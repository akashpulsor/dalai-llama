import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startSession, endSession, addTranscript, addIntent,
  setSentiment, addEscalation, setPipelineStatus, setLatency, selectBotTest,
} from '../store/slices/botTestSlice.js';
import { useStartTestCallMutation, useHangupTestCallMutation } from '../store/slices/pbxCoreApi.js';

/**
 * Real call test hook — originates a call through the full production stack.
 *
 * @param {string|null} botId
 * @param {{ useStompSubscribe?: (topic: string, callback: (msg: any) => void) => { unsubscribe: () => void } }} [deps]
 * @returns {{ startCall: (options?: { phone_number?: string, use_softphone?: boolean }) => Promise<void>,
 *             hangup: () => Promise<void>,
 *             callId: string|null,
 *             pipelineStatus: any,
 *             latency: any,
 *             transcript: Array<{role: string, text: string, timestamp?: number}>,
 *             intents: Array<{intent: string, confidence: number, timestamp?: number}>,
 *             sentiment: number,
 *             escalationEvents: Array<{type: string, target?: string, reason?: string, timestamp?: number}>,
 *             isActive: boolean }}
 */
export default function useTestCall(botId, deps = {}) {
  const { useStompSubscribe } = deps;
  const dispatch = useDispatch();
  const { pipelineStatus, latency, transcript, intents, sentiment, escalationEvents, isActive } =
    useSelector(selectBotTest);

  const [doStartCall] = useStartTestCallMutation();
  const [doHangup] = useHangupTestCallMutation();

  const callIdRef = /** @type {import('react').MutableRefObject<string|null>} */ (useRef(null));
  const subsRef = /** @type {import('react').MutableRefObject<Array<{unsubscribe: () => void}>>} */ (useRef([]));

  /**
   * Start a test call — browser softphone or PSTN.
   * @param {{ phone_number?: string, use_softphone?: boolean }} [options]
   */
const startCall = useCallback(async (/** @type {{ phone_number?: string, use_softphone?: boolean } | undefined} */ options) => {
    const opts = options || { use_softphone: true };
    if (!botId) return;
    
    dispatch(setPipelineStatus({
      kamailio: 'pending',
      freeswitch: 'pending',
      voice_brain: 'pending',
      stt: 'pending',
      llm: 'pending',
      tts: 'pending',
      escalation: 'pending',
    }));

    try {
      /** @type {any} */
      const result = await doStartCall({ botId, ...options }).unwrap();
      callIdRef.current = result.call_id;
      dispatch(startSession(result.call_id));

      // Subscribe to STOMP for live diagnostics
      if (useStompSubscribe && result.call_id) {
        const tenantId = result.tenant_id;

        const sub1 = useStompSubscribe(
          `/user/queue/test-call/${result.call_id}`,
          (/** @type {any} */ msg) => {
            if (msg.pipeline_status) dispatch(setPipelineStatus(msg.pipeline_status));
            if (msg.latency) dispatch(setLatency(msg.latency));
            if (msg.call_status === 'ENDED') dispatch(endSession());
          }
        );

        const sub2 = useStompSubscribe(
          `/topic/tenant/${tenantId}/calls/${result.call_id}/transcript`,
          (/** @type {any} */ msg) => {
            if (msg.text) {
              dispatch(addTranscript({ role: msg.speaker || 'bot', text: msg.text }));
            }
            if (msg.intent) {
              dispatch(addIntent({ intent: msg.intent, confidence: msg.confidence || 0 }));
            }
            if (msg.sentiment !== undefined) {
              dispatch(setSentiment(msg.sentiment));
            }
            if (msg.escalation) {
              dispatch(addEscalation(msg.escalation));
            }
          }
        );

        subsRef.current = [sub1, sub2];
      }
    } catch (/** @type {any} */ err) {
      dispatch(addTranscript({
        role: 'system',
        text: `Call failed: ${err?.data?.message || err?.message || 'Unknown error'}`,
      }));
    }
  }, [botId, doStartCall, dispatch, useStompSubscribe]);

  const hangup = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId || !botId) return;

    try {
      await doHangup({ botId, callId }).unwrap();
    } catch (/** @type {any} */ _) { /* ignore */ }

    dispatch(endSession());
    subsRef.current.forEach((/** @type {any} */ s) => { try { s.unsubscribe(); } catch (/** @type {any} */ _) { /* */ } });
    subsRef.current = [];
    callIdRef.current = null;
  }, [botId, doHangup, dispatch]);

  useEffect(() => {
    return () => {
      subsRef.current.forEach((/** @type {any} */ s) => { try { s.unsubscribe(); } catch (/** @type {any} */ _) { /* */ } });
    };
  }, []);

  return {
    startCall,
    hangup,
    callId: callIdRef.current,
    pipelineStatus,
    latency,
    transcript,
    intents,
    sentiment,
    escalationEvents,
    isActive,
  };
}