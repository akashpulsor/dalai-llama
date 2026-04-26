import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';

/**
 * STOMP WebSocket hook — connects to PBX-Core /ws for real-time events.
 *
 * Uses native WebSocket transport so local Vite dev does not depend on
 * SockJS' CommonJS/transitive dependency chain.
 * Auth: JWT in STOMP CONNECT headers (validated by TenantChannelInterceptor).
 *
 * Topics available:
 *   /topic/tenant/{tid}/calls          → call events (start, answer, end)
 *   /topic/tenant/{tid}/agents         → agent status changes
 *   /topic/tenant/{tid}/queues         → queue stat updates
 *   /topic/tenant/{tid}/campaigns      → campaign progress
 *   /user/queue/transcript             → personal live transcript (my call)
 *   /topic/tenant/{tid}/calls/{cid}/transcript → specific call transcript
 *
 * @param {string|null} token - JWT access token
 * @returns {{ isConnected: boolean, subscribe: (topic: string, callback: (msg: any) => void) => { unsubscribe: () => void }, send: (destination: string, body: any) => void, client: Client|null }}
 */
export default function useStompEvents(token) {
  const stompWsUrl = /** @type {string|null} */ (
    useSelector((/** @type {any} */ s) => s.tenant.stompWsUrl || s.tenant.websocketUrl)
  );
  const tenantId = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.tenantId));

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = /** @type {import('react').MutableRefObject<Client|null>} */ (useRef(null));
  const subsRef = /** @type {import('react').MutableRefObject<Array<{unsubscribe: () => void}>>} */ (useRef([]));

  useEffect(() => {
    if (!stompWsUrl || !token || !tenantId) return;

    const wsUrl = stompWsUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (/** @type {string} */ msg) => {
        if (import.meta.env.DEV) console.debug('[STOMP]', msg);
      },
      onConnect: () => {
        setIsConnected(true);
        console.log('[STOMP] Connected to', wsUrl);
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('[STOMP] Disconnected');
      },
      onStompError: (/** @type {any} */ frame) => {
        console.error('[STOMP] Error:', frame.headers?.message || frame.body);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subsRef.current.forEach((/** @type {any} */ sub) => {
        try { sub.unsubscribe(); } catch (/** @type {any} */ _) { /* ignore */ }
      });
      subsRef.current = [];
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [stompWsUrl, token, tenantId]);

  /**
   * Subscribe to a STOMP topic.
   * @param {string} topic
   * @param {(msg: any) => void} callback
   * @returns {{ unsubscribe: () => void }}
   */
  const subscribe = useCallback((/** @type {string} */ topic, /** @type {(msg: any) => void} */ callback) => {
    /** @param {any} msg */
    const onMessage = (/** @type {any} */ msg) => {
      let parsed;
      try {
        parsed = JSON.parse(msg.body);
      } catch (/** @type {any} */ _) {
        parsed = msg.body;
      }
      console.log('[STOMP] WebSocket message', {
        topic,
        destination: msg.headers?.destination,
        body: parsed,
      });
      callback(parsed);
    };

    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn('[STOMP] Not connected, queuing subscribe for:', topic);
      const interval = setInterval(() => {
        if (clientRef.current?.connected) {
          clearInterval(interval);
          const sub = clientRef.current.subscribe(topic, onMessage);
          subsRef.current.push(sub);
        }
      }, 500);
      return { unsubscribe: () => clearInterval(interval) };
    }

    const sub = client.subscribe(topic, onMessage);
    subsRef.current.push(sub);
    return sub;
  }, []);

  /**
   * Send a message to a STOMP destination.
   * @param {string} destination
   * @param {any} body
   */
  const send = useCallback((/** @type {string} */ destination, /** @type {any} */ body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }, []);

  return { isConnected, subscribe, send, client: clientRef.current };
}
