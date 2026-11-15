import { DIGITAL_HUMAN_STATES, isDigitalHumanPlaybackActive } from './DigitalHumanAdapter'
import { validateDigitalHumanResponse } from './contracts'

const COMMAND_ERRORS = new Set(['authenticate', 'load_model', 'set_azure_voice_name', 'speak'])

/** @implements {import('./DigitalHumanAdapter').DigitalHumanAdapter} */
export class MetaPersonLiveSpeakAdapter {
  constructor({ iframe, origin, requestAccessToken, onStateChange = () => {}, onError = () => {}, timeoutMs = 30_000, speechTimeoutMs = 180_000 }) {
    if (!iframe || !origin?.startsWith('https://')) throw new Error('LiveSpeak adapter requires iframe and HTTPS origin')
    this.iframe = iframe
    this.origin = origin
    this.requestAccessToken = requestAccessToken
    this.authentication = null
    this.providerLoaded = false
    this.authenticationRequired = false
    this.onStateChange = onStateChange
    this.onError = onError
    this.timeoutMs = timeoutMs
    this.speechTimeoutMs = speechTimeoutMs
    this.timer = null
    this.modelRequested = false
    this.state = DIGITAL_HUMAN_STATES.BOOTING
    this.pendingCharacter = null
    this.activeCharacterId = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return
    this.initialized = true
    window.addEventListener('message', this.handleMessage)
    this.armTimeout(this.timeoutMs, 'Avatar 启动超时，已保留文字回答。')
  }

  async loadCharacter(character) {
    if (character.avatar?.reviewState !== 'APPROVED' || !character.avatar?.modelUrl) throw new Error('Avatar asset is not approved')
    if (character.voice?.reviewState !== 'APPROVED' || !character.voice?.voiceId) throw new Error('Voice profile is not approved')
    if (this.pendingCharacter) throw new Error('Use a new LiveSpeak session to change characters')
    this.pendingCharacter = character
    if (this.state === DIGITAL_HUMAN_STATES.MODEL_AWAITING) this.sendLoadModel(character)
  }

  setVoice(character) {
    if (character.voice?.reviewState !== 'APPROVED' || !character.voice?.voiceId) throw new Error('Voice profile is not approved')
    this.post({ eventName: 'set_azure_voice_name', voiceName: character.voice.voiceId })
  }

  async speakApproved(response) {
    const verified = validateDigitalHumanResponse(response, this.activeCharacterId)
    if (!verified.speechApproved) throw new Error('Content has not passed the release gate')
    if (this.state !== DIGITAL_HUMAN_STATES.READY) throw new Error(`Avatar not ready: ${this.state}`)
    this.setState(DIGITAL_HUMAN_STATES.PREPARING_SPEECH)
    this.armTimeout(this.timeoutMs, '数字人未能开始播放，文字回答已保留。')
    try {
      this.post({ eventName: 'speak', text: verified.spokenText })
    } catch {
      this.fail('数字人无法播放，文字回答已保留。')
    }
  }

  getState() { return this.state }

  dispose() {
    clearTimeout(this.timer)
    this.authentication?.abort()
    if (this.initialized) window.removeEventListener('message', this.handleMessage)
    this.initialized = false
    this.pendingCharacter = null
    this.activeCharacterId = null
    this.setState(DIGITAL_HUMAN_STATES.DISPOSED)
  }

  setState(next) {
    this.state = next
    this.onStateChange(next)
  }

  armTimeout(delay, message) {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      if (!this.initialized) return
      this.fail(message)
    }, delay)
  }

  post(payload) {
    if (!this.iframe.contentWindow) throw new Error('LiveSpeak frame is unavailable')
    this.iframe.contentWindow.postMessage(payload, this.origin)
  }

  sendLoadModel(character) {
    if (this.modelRequested) return
    this.modelRequested = true
    this.setState(DIGITAL_HUMAN_STATES.LOADING_MODEL)
    this.armTimeout(this.timeoutMs, 'Avatar 模型加载超时，已保留文字回答。')
    this.post({ eventName: 'load_model', modelUrl: character.avatar.modelUrl })
  }

  fail(message) {
    clearTimeout(this.timer)
    this.authentication?.abort()
    this.setState(DIGITAL_HUMAN_STATES.ERROR)
    this.onError(new Error(message))
  }

  authenticate = async () => {
    if (!this.providerLoaded || !this.authenticationRequired || this.authentication) return
    if (!this.requestAccessToken) {
      this.fail('数字人播放服务尚未配置认证，文字回答已保留。')
      return
    }
    const controller = new AbortController()
    this.authentication = controller
    try {
      const token = await this.requestAccessToken(controller.signal)
      if (controller.signal.aborted || !this.initialized) return
      if (typeof token !== 'string' || !token.trim()) throw new Error('Missing LiveSpeak access token')
      this.post({ eventName: 'authenticate', accessToken: token })
    } catch {
      if (!controller.signal.aborted) this.fail('数字人播放服务认证失败，文字回答已保留。')
    }
  }

  handleMessage = (event) => {
    if (!this.initialized || this.state === DIGITAL_HUMAN_STATES.ERROR) return
    if (event.origin !== this.origin || !event.source || event.source !== this.iframe.contentWindow) return
    const data = event.data
    if (data?.source !== 'livespeak') return
    if (data.eventName === 'livespeak_loaded') {
      this.providerLoaded = true
      void this.authenticate()
      return
    }
    if (data.eventName === 'message_processing_error' && COMMAND_ERRORS.has(data.failedEventName)) {
      this.fail('数字人播放服务无法完成操作，文字回答已保留。')
      return
    }
    if (data.eventName !== 'avatar_state_changed') return
    if (data.avatarState === 'WaitingForAuthentication') {
      if (this.state !== DIGITAL_HUMAN_STATES.BOOTING) return
      this.authenticationRequired = true
      void this.authenticate()
      return
    }
    if (data.avatarState === 'ModelAwaiting') {
      if (this.modelRequested) return
      this.setState(DIGITAL_HUMAN_STATES.MODEL_AWAITING)
      try {
        if (this.pendingCharacter) this.sendLoadModel(this.pendingCharacter)
      } catch {
        this.fail('数字人模型无法加载，文字回答已保留。')
      }
    } else if (data.avatarState === 'Ready') {
      if (this.state === DIGITAL_HUMAN_STATES.LOADING_MODEL) {
        const character = this.pendingCharacter
        try {
          this.setVoice(character)
          clearTimeout(this.timer)
          this.activeCharacterId = character.id
          this.setState(DIGITAL_HUMAN_STATES.READY)
        } catch {
          this.fail('数字人音色无法加载，文字回答已保留。')
        }
      } else if (this.state === DIGITAL_HUMAN_STATES.SPEAKING) {
        clearTimeout(this.timer)
        this.setState(DIGITAL_HUMAN_STATES.READY)
      }
    } else if (data.avatarState === 'WaitingForTouch') {
      if (this.state !== DIGITAL_HUMAN_STATES.PREPARING_SPEECH) return
      this.setState(DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH)
      this.armTimeout(this.timeoutMs, '未确认播放，请重新连接后重播；文字回答已保留。')
    } else if (data.avatarState === 'Speaking') {
      if (!isDigitalHumanPlaybackActive(this.state) || this.state === DIGITAL_HUMAN_STATES.SPEAKING) return
      this.armTimeout(this.speechTimeoutMs, 'Avatar 播放结束未确认，已回退文字。')
      this.setState(DIGITAL_HUMAN_STATES.SPEAKING)
    } else if (data.avatarState === 'Error') {
      this.fail('Avatar 服务报告错误，已保留文字回答。')
    }
  }
}
