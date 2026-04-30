import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startSession, endSession, addTranscript, addIntent,
  setSentiment, addEscalation, resetBotTest, selectBotTest,
} from '../store/slices/botTestSlice.js';

/**
 * Live bot testing hook — connects to voice-brain test endpoint.
 *
 * Two modes:
 *   Text: sends typed message, gets bot text + audio response
 *   Voice: sends browser mic audio, gets bot response
 *
 * voice-brain /test endpoint serves a browser test UI with polling.
 * Events polled every 300ms: transcript, intent, sentiment, escalation.
 *
 * @param {string|null} botId - selected bot ID
 * @param {{ voiceBrainUrl?: string }} options
 * @returns {{ sendMessage: (text: string) => Promise<void>,
 *             startVoice: () => Promise<void>,
 *             stopVoice: () => void,
 *             startTest: () => Promise<void>,
 *             endTest: () => void,
 *             transcript: Array<{role: string, text: string, timestamp?: number}>,
 *             intents: Array<{intent: string, confidence: number, timestamp?: number}>,
 *             sentiment: number,
 *             escalationEvents: Array<{type: string, target?: string, reason?: string, timestamp?: number}>,
 *             isActive: boolean }}
 */

export default function useBotTest(botId, options = {}) {
  const dispatch = useDispatch();
  const { transcript, intents, sentiment, escalationEvents, isActive } = useSelector(selectBotTest);
  const authToken = useSelector((/** @type {any} */ s) => s.auth?.access_token);

const pollRef = /** @type {import('react').MutableRefObject<ReturnType<typeof setInterval>|null>} */ (useRef(null));
  const sessionIdRef = /** @type {import('react').MutableRefObject<string|null>} */ (useRef(null));
  const voiceBrainUrl = options.voiceBrainUrl || '/api/v1';

  /**
   * Start a test session — creates a session with voice-brain.
   */
  const startTest = useCallback(async () => {
    if (!botId) return;

    dispatch(resetBotTest());

    try {
      const res = await fetch(`${voiceBrainUrl}/bots/${botId}/test-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot_id: botId }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data.session_id || data.call_id || `test-${Date.now()}`;
      } else {
        // Fallback: use local session ID (voice-brain /test mode)
        sessionIdRef.current = `test-${Date.now()}`;
      }
    } catch {
      sessionIdRef.current = `test-${Date.now()}`;
    }

    dispatch(startSession(sessionIdRef.current));
    startPolling();
  }, [botId, authToken, dispatch, voiceBrainUrl]);

  /**
   * End the test session.
   */
  const endTest = useCallback(() => {
    stopPolling();
    dispatch(endSession());
    sessionIdRef.current = null;
  }, [dispatch]);

  /**
   * Send a text message to the bot.
   * @param {string} text
   */
  const sendMessage = useCallback(async (/** @type {string} */ text) => {
    if (!text.trim() || !isActive) return;

    // Add user message to transcript immediately
    dispatch(addTranscript({ role: 'user', text }));

    try {
      const res = await fetch(`${voiceBrainUrl}/bots/${botId}/test-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          text,
          bot_id: botId,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Bot response
        if (data.response) {
          dispatch(addTranscript({ role: 'bot', text: data.response }));
        }

        // Intent
        if (data.intent) {
          dispatch(addIntent({
            intent: data.intent,
            confidence: data.confidence || 0,
          }));
        }

        // Sentiment
        if (data.sentiment !== undefined) {
          dispatch(setSentiment(data.sentiment));
        }

        // Escalation
        if (data.escalation) {
          dispatch(addEscalation({
            type: data.escalation.type,
            target: data.escalation.target,
            reason: data.escalation.reason,
          }));
        }
      }
    } catch (/** @type {any} */ err) {
      dispatch(addTranscript({
        role: 'system',
        text: `Error: ${err.message || 'Failed to send message'}`,
      }));
    }
  }, [botId, isActive, authToken, dispatch, voiceBrainUrl]);

  /**
   * Start browser mic for voice input.
   */
  const mediaRecorderRef = /** @type {import('react').MutableRefObject<MediaRecorder|null>} */ (useRef(null));

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      /** @type {Blob[]} */
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        // Send audio to voice-brain for STT → LLM → response
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('session_id', sessionIdRef.current || '');
        formData.append('bot_id', botId || '');

        dispatch(addTranscript({ role: 'system', text: '🎤 Processing audio...' }));

        try {
          const res = await fetch(`${voiceBrainUrl}/bots/${botId}/test-voice`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user_text) {
              dispatch(addTranscript({ role: 'user', text: data.user_text }));
            }
            if (data.response) {
              dispatch(addTranscript({ role: 'bot', text: data.response }));
            }
            if (data.intent) {
              dispatch(addIntent({ intent: data.intent, confidence: data.confidence || 0 }));
            }
            if (data.sentiment !== undefined) {
              dispatch(setSentiment(data.sentiment));
            }
          }
        } catch (/** @type {any} */ err) {
          dispatch(addTranscript({ role: 'system', text: `Audio error: ${err.message}` }));
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (/** @type {any} */ err) {
      dispatch(addTranscript({ role: 'system', text: `Mic error: ${err.message}` }));
    }
  }, [botId, authToken, dispatch, voiceBrainUrl]);

  const stopVoice = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  /**
   * Poll voice-brain /test events for streaming updates.
   */
  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (!sessionIdRef.current) return;
      try {
        const res = await fetch(
          `${voiceBrainUrl}/bots/${botId}/test-events?session_id=${sessionIdRef.current}`,
          { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        if (res.ok) {
          const events = await res.json();
          if (Array.isArray(events)) {
            events.forEach((evt) => {
              if (evt.type === 'transcript') dispatch(addTranscript(evt));
              if (evt.type === 'intent') dispatch(addIntent(evt));
              if (evt.type === 'sentiment') dispatch(setSentiment(evt.score));
              if (evt.type === 'escalation') dispatch(addEscalation(evt));
            });
          }
        }
      } catch { /* polling failures are silent */ }
    }, 300);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    sendMessage,
    startVoice,
    stopVoice,
    startTest,
    endTest,
    transcript,
    intents,
    sentiment,
    escalationEvents,
    isActive,
  };
}
