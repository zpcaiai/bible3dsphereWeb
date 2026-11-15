export const DIGITAL_HUMAN_STATES = Object.freeze({
  BOOTING: 'booting', MODEL_AWAITING: 'model-awaiting', LOADING_MODEL: 'loading-model',
  READY: 'ready', PREPARING_SPEECH: 'preparing-speech', WAITING_FOR_TOUCH: 'waiting-for-touch',
  SPEAKING: 'speaking', ERROR: 'error', DISPOSED: 'disposed',
})

export function isDigitalHumanPlaybackActive(state) {
  return state === DIGITAL_HUMAN_STATES.PREPARING_SPEECH ||
    state === DIGITAL_HUMAN_STATES.WAITING_FOR_TOUCH || state === DIGITAL_HUMAN_STATES.SPEAKING
}

/**
 * @typedef {Object} DigitalHumanAdapter
 * @property {() => Promise<void>} initialize
 * @property {(character: object) => Promise<void>} loadCharacter
 * @property {(response: object) => Promise<void>} speakApproved
 * @property {(character: object) => void} setVoice
 * @property {() => string} getState
 * @property {() => void} dispose
 */
