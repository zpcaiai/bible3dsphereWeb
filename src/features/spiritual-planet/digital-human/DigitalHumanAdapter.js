export const DIGITAL_HUMAN_STATES = Object.freeze({
  BOOTING: 'booting', MODEL_AWAITING: 'model-awaiting', LOADING_MODEL: 'loading-model',
  READY: 'ready', SPEAKING: 'speaking', ERROR: 'error', DISPOSED: 'disposed',
})

export class DigitalHumanAdapter {
  initialize() { throw new Error('not implemented') }
  loadCharacter() { throw new Error('not implemented') }
  speakApproved() { throw new Error('not implemented') }
  setVoice() { throw new Error('not implemented') }
  getState() { throw new Error('not implemented') }
  dispose() { throw new Error('not implemented') }
}
