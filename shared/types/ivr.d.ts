// shared/types/ivr.d.ts

export type IVRNodeType =
  | "start"
  | "menu"
  | "input"
  | "tts"
  | "action"
  | "transfer";

export interface IVRNode {
  id: string;
  type: IVRNodeType;
  label: string;

  /** ID of next node or null if terminal */
  next?: string | null;

  /** Menu options if node is "menu" */
  options?: Array<{
    key: string;
    next: string;
  }>;

  /** TTS text for audio nodes */
  ttsText?: string;

  /** Transfer target (SIP URI, queue name, etc.) */
  target?: string;
}

export interface IVRGraph {
  id: string;
  name: string;
  nodes: Record<string, IVRNode>;
  start: string;
}
