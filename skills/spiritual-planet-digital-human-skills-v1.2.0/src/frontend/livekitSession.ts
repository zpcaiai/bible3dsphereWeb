/**
 * Deliberately minimal client-side contract.
 * Use the current LiveKit JS SDK APIs for room creation/token connection in the host app.
 * Keep vendor code here rather than spreading it through UI components.
 */
export interface RealtimeSessionState {
  connected: boolean;
  listening: boolean;
  avatarSpeaking: boolean;
}

export interface RealtimeSessionAdapter {
  connect(token: string, wsUrl: string): Promise<void>;
  disconnect(): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  getState(): RealtimeSessionState;
}
