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
 * On reconnect, all registered subscriptions are automatically re-subscribed.
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
  // Registry of desired subscriptions: Map<topic, callback>
  // Survives reconnects — re-subscribed on every onConnect.
  const registryRef = /** @type {import('react').MutableRefObject<Map<string, (msg: any) => void>>} */ (useRef(new Map()));
  // Active STOMP subscription handles (from the current connection)
  const activeSubsRef = /** @type {import('react').MutableRefObject<Array<{unsubscribe: () => void}>>} */ (useRef([]));

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

    /** Re-subscribe all topics in the registry on the given client */
    const resubscribeAll = (/** @type {Client} */ cl) => {
      // Tear down old handles
      activeSubsRef.current.forEach((sub) => {
        try { sub.unsubscribe(); } catch (/** @type {any} */ _) { /* ignore */ }
      });
      activeSubsRef.current = [];

      registryRef.current.forEach((cb, topic) => {
        console.log('[STOMP] Subscribing to', topic);
        const sub = cl.subscribe(topic, cb);
        activeSubsRef.current.push(sub);
      });
    };

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
        console.log('[STOMP] Connected to', brokerUrl);
        setIsConnected(true);
        // (Re-)subscribe everything in the registry
        resubscribeAll(client);
      },
      onDisconnect: () => {
        console.log('[STOMP] Disconnected — will auto-reconnect');
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.warn('[STOMP] WebSocket closed — will auto-reconnect');
        setIsConnected(false);
      },
      onStompError: (/** @type {any} */ frame) => {
        console.error('[STOMP] Error:', frame.headers?.message || frame.body);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      activeSubsRef.current.forEach((sub) => {
        try { sub.unsubscribe(); } catch (/** @type {any} */ _) { /* ignore */ }
      });
      activeSubsRef.current = [];
      registryRef.current.clear();
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [stompWsUrl, token, tenantId]);

  /**
   * Subscribe to a STOMP topic.
   * The subscription is added to a registry and automatically re-subscribed
   * after reconnect. If the client is already connected, subscribes immediately.
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

    // Register so it survives reconnects
    registryRef.current.set(topic, onMessage);

    // If already connected, subscribe now
    const client = clientRef.current;
    if (client && client.connected) {
      console.log('[STOMP] Subscribing to', topic);
      const sub = client.subscribe(topic, onMessage);
      activeSubsRef.current.push(sub);
    }

    return {
      unsubscribe: () => {
        registryRef.current.delete(topic);
        // Find and remove the active sub for this topic
        // (best-effort — if not connected, nothing to unsub)
      },
    };
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
