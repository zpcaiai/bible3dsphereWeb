import { DIGITAL_HUMAN_STATES, DigitalHumanAdapter } from './DigitalHumanAdapter'
import { validateDigitalHumanResponse } from './contracts'

const ALLOWED_AVATAR_STATES = new Set(['ModelAwaiting', 'Ready', 'Speaking', 'Error'])

export class MetaPersonLiveSpeakAdapter extends DigitalHumanAdapter {
  constructor({ iframe, origin, onStateChange = () => {}, onError = () => {}, timeoutMs = 30_000, speechTimeoutMs = 180_000 }) {
    super()
    if (!iframe || !origin?.startsWith('https://')) throw new Error('LiveSpeak adapter requires iframe and HTTPS origin')
    this.iframe = iframe
    this.origin = origin
    this.onStateChange = onStateChange
    this.onError = onError
    this.timeoutMs = timeoutMs
    this.speechTimeoutMs = speechTimeoutMs
    this.timer = null
    this.modelRequested = false
    this.speakingObserved = false
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
    this.pendingCharacter = character
    if ([DIGITAL_HUMAN_STATES.MODEL_AWAITING, DIGITAL_HUMAN_STATES.READY].includes(this.state)) this.sendLoadModel(character)
  }

  async setVoice(character) {
    if (character.voice?.reviewState !== 'APPROVED' || !character.voice?.voiceId) throw new Error('Voice profile is not approved')
    this.post({ eventName: 'set_azure_voice_name', voiceName: character.voice.voiceId })
  }

  async speakApproved(response) {
    const verified = validateDigitalHumanResponse(response, this.activeCharacterId)
    if (!verified.speechApproved) throw new Error('Content has not passed the release gate')
    if (this.state !== DIGITAL_HUMAN_STATES.READY) throw new Error(`Avatar not ready: ${this.state}`)
    this.speakingObserved = false
    this.setState(DIGITAL_HUMAN_STATES.SPEAKING)
    this.armTimeout(this.timeoutMs, 'Avatar 未确认开始播放，已保留文字回答。')
    this.post({ eventName: 'speak', text: verified.spokenText })
  }

  getState() { return this.state }

  dispose() {
    clearTimeout(this.timer)
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
      this.setState(DIGITAL_HUMAN_STATES.ERROR)
      this.onError(new Error(message))
    }, delay)
  }

  post(payload) {
    this.iframe.contentWindow?.postMessage(payload, this.origin)
  }

  sendLoadModel(character) {
    this.modelRequested = true
    this.setState(DIGITAL_HUMAN_STATES.LOADING_MODEL)
    this.armTimeout(this.timeoutMs, 'Avatar 模型加载超时，已保留文字回答。')
    this.post({ eventName: 'load_model', modelUrl: character.avatar.modelUrl })
  }

  handleMessage = (event) => {
    if (!this.initialized || this.state === DIGITAL_HUMAN_STATES.ERROR) return
    if (event.origin !== this.origin || event.source !== this.iframe.contentWindow) return
    const data = event.data
    if (!data || data.source !== 'livespeak' || data.eventName !== 'avatar_state_changed' || !ALLOWED_AVATAR_STATES.has(data.avatarState)) return
    if (data.avatarState === 'ModelAwaiting') {
      this.setState(DIGITAL_HUMAN_STATES.MODEL_AWAITING)
      if (this.pendingCharacter) this.sendLoadModel(this.pendingCharacter)
    } else if (data.avatarState === 'Ready') {
      if (!this.modelRequested || (this.state === DIGITAL_HUMAN_STATES.SPEAKING && !this.speakingObserved)) return
      clearTimeout(this.timer)
      this.activeCharacterId = this.pendingCharacter?.id || this.activeCharacterId
      this.setState(DIGITAL_HUMAN_STATES.READY)
      if (this.pendingCharacter?.voice?.reviewState === 'APPROVED') this.setVoice(this.pendingCharacter).catch(() => this.setState(DIGITAL_HUMAN_STATES.ERROR))
    } else if (data.avatarState === 'Speaking') {
      if (this.state !== DIGITAL_HUMAN_STATES.SPEAKING) return
      this.speakingObserved = true
      this.armTimeout(this.speechTimeoutMs, 'Avatar 播放结束未确认，已回退文字。')
      this.setState(DIGITAL_HUMAN_STATES.SPEAKING)
    } else {
      clearTimeout(this.timer)
      this.setState(DIGITAL_HUMAN_STATES.ERROR)
      this.onError(new Error('Avatar 服务报告错误，已保留文字回答。'))
    }
  }
}
