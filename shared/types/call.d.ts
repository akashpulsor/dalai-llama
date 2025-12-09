declare module "@dalaillama/shared-types/call" {
  /* -------------------------------------------------------------------------- */
  /*                               BASIC ENUM TYPES                             */
  /* -------------------------------------------------------------------------- */

  /** Call lifecycle states */
  export type CallStatus = "idle" | "ringing" | "connected" | "hold" | "ended";

  /** Direction of the call */
  export type CallDirection = "inbound" | "outbound";

  /** Realtime emotion/sentiment classification */
  export type Sentiment = "neutral" | "positive" | "negative";

  /** Speaker identity used in STT messages */
  export type Speaker = "agent" | "customer";

  /** Message types sent over STT WS */
  export type STTMessageType = "stt" | "sentiment" | "waveform";

  /* -------------------------------------------------------------------------- */
  /*                             COMPLEX STRUCTURES                             */
  /* -------------------------------------------------------------------------- */

  /** A transcript buffer with 2-channel storage */
  export interface LiveTranscription {
    agent: string[];
    customer: string[];
  }

  /** Waveform (64 PCM-like points normalized -1..1) */
  export type WaveformArray = number[];

  /** Message received over real STT websocket */
  export interface STTMessage {
    type: STTMessageType;
    speaker?: Speaker;
    text?: string;
    sentiment?: Sentiment;
    samples?: WaveformArray;
  }

  /* -------------------------------------------------------------------------- */
  /*                          REDUX STORE — CALL SHAPE                           */
  /* -------------------------------------------------------------------------- */

  export interface ActiveCall {
    callId: string;
    status: CallStatus;
    direction: CallDirection;

    from: string;
    to: string;

    startedAt: number;
    durationMs: number;

    sentiment: Sentiment;
    transcript: LiveTranscription;

    mute: boolean;
    hold: boolean;
    recording: boolean;

    supervisorListening: boolean;
    supervisorWhispering: boolean;
      /** ✅ REQUIRED FOR STT WAVEFORM */
    waveform: WaveformArray;
    /** Serialized JSON for now — will be a complex object later */
    aiSummary: string | null;
  }

  export interface ACWForm {
    disposition?: string;
    notes?: string;
  }

  export interface CallState {
    activeCall: ActiveCall | null;
    inACW: boolean;
    acwForm: ACWForm;
  }
}
