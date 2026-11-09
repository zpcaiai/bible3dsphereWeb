import type { BibleCharacter } from './types';

export type DigitalHumanState =
  | 'booting'
  | 'model-awaiting'
  | 'loading-model'
  | 'ready'
  | 'speaking'
  | 'error';

export interface DigitalHumanAdapter {
  initialize(): Promise<void>;
  loadCharacter(character: BibleCharacter): Promise<void>;
  speak(text: string): Promise<void>;
  setVoice(voiceId: string): Promise<void>;
  getState(): DigitalHumanState;
  dispose(): void;
}
