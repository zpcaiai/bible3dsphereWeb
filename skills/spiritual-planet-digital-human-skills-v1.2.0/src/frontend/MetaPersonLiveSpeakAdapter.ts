import type { BibleCharacter } from './types';
import type { DigitalHumanAdapter, DigitalHumanState } from './DigitalHumanAdapter';

const LIVESPEAK_ORIGIN = 'https://metaperson.avatarsdk.com';

export class MetaPersonLiveSpeakAdapter implements DigitalHumanAdapter {
  private state: DigitalHumanState = 'booting';
  private pendingCharacter?: BibleCharacter;

  constructor(private readonly iframe: HTMLIFrameElement) {}

  async initialize(): Promise<void> {
    window.addEventListener('message', this.onMessage);
  }

  async loadCharacter(character: BibleCharacter): Promise<void> {
    this.pendingCharacter = character;
    if (this.state === 'model-awaiting' || this.state === 'ready') {
      this.sendLoadModel(character.avatar.modelUrl);
    }
  }

  async speak(text: string): Promise<void> {
    if (this.state !== 'ready') throw new Error(`Avatar not ready: ${this.state}`);
    this.iframe.contentWindow?.postMessage(
      { eventName: 'speak', text },
      LIVESPEAK_ORIGIN,
    );
  }

  async setVoice(voiceId: string): Promise<void> {
    this.iframe.contentWindow?.postMessage(
      { eventName: 'set_azure_voice_name', voiceName: voiceId },
      LIVESPEAK_ORIGIN,
    );
  }

  getState(): DigitalHumanState {
    return this.state;
  }

  dispose(): void {
    window.removeEventListener('message', this.onMessage);
  }

  private sendLoadModel(modelUrl: string): void {
    this.state = 'loading-model';
    this.iframe.contentWindow?.postMessage(
      { eventName: 'load_model', modelUrl },
      LIVESPEAK_ORIGIN,
    );
  }

  private onMessage = (event: MessageEvent) => {
    if (event.origin !== LIVESPEAK_ORIGIN) return;
    const data = event.data;
    if (!data || data.source !== 'livespeak') return;

    if (data.eventName === 'avatar_state_changed') {
      switch (data.avatarState) {
        case 'ModelAwaiting':
          this.state = 'model-awaiting';
          if (this.pendingCharacter) this.sendLoadModel(this.pendingCharacter.avatar.modelUrl);
          break;
        case 'Ready':
          this.state = 'ready';
          break;
        case 'Speaking':
          this.state = 'speaking';
          break;
        case 'Error':
          this.state = 'error';
          break;
      }
    }
  };
}
