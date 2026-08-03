import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';

/**
 * STOMP WebSocket hook — connects to a STOMP broker for real-time events.
 *
 * Two brokers exist:
 *   - tenant-service /ws  → wallet, billing, provisioning, apps, notifications
 *   - pbx-core /ws        → calls, agents, queues, campaigns
 *
 * Pass `wsUrl` to target a specific broker. If omitted, falls back to
 * `stompWsUrl` from the Redux tenant slice (pbx-core per-app websocket_url).
 *
 * Auth: JWT in STOMP CONNECT headers (validated by TenantChannelInterceptor).
 *
 * @param {string|null} token - JWT access token
 * @param {string|null} [wsUrl] - optional explicit WebSocket URL override
 * @returns {{ isConnected: boolean, subscribe: (topic: string, callback: (msg: any) => void) => { unsubscribe: () => void }, send: (destination: string, body: any) => void, client: Client|null }}
 */
export default function useStompEvents(token, wsUrl) {
  const stompWsUrlFromRedux = /** @type {string|null} */ (
    useSelector((/** @type {any} */ s) => s.tenant.stompWsUrl || s.tenant.websocketUrl)
  );
  const stompWsUrl = wsUrl || stompWsUrlFromRedux;
  const tenantId = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.tenantId));

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = /** @type {import('react').MutableRefObject<Client|null>} */ (useRef(null));
  const subsRef = /** @type {import('react').MutableRefObject<Array<{unsubscribe: () => void}>>} */ (useRef([]));

  useEffect(() => {
    if (!stompWsUrl || !token || !tenantId) {
      console.warn('[STOMP] Skipping connect:', {
        hasWsUrl: !!stompWsUrl,
        hasToken: !!token,
        tenantId: tenantId || null,
      });
      return;
    }

    const brokerUrl = stompWsUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');

    const client = new Client({
      brokerURL: brokerUrl,
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
        console.log('[STOMP] Connected to', brokerUrl);
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
