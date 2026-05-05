// @ts-check
// shared/hooks/useTenantEvents.js
//
// Two backend services publish STOMP events via separate WebSocket brokers:
//
//   1. tenant-service (/ws on API host, derived from API_BASE_URL)
//      Topics: wallet, billing, apps, notifications, provisioning
//      Used by: dashboard-ui, admin-ui
//
//   2. pbx-core (/ws, per-app websocket_url from tenant-config)
//      Topics: calls, agents, queues, campaigns
//      Used by: admin-ui, agents-ui, supervisor-ui
//
// Each UI calls this hook with a `broker` option to connect to the right endpoint.
// Admin-ui calls the hook TWICE (once per broker) to receive events from both.

import { useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useStompEvents from './useStompEvents.js';
import { selectTenantId, selectTenantWsUrl, selectStompWsUrl } from '../store/slices/tenantSlice.js';
import { setWallet } from '../store/slices/billingSlice.js';

/* ─── helpers ─────────────────────────────────────────────────────────── */

/**
 * Emit a browser-level CustomEvent so any component can listen for it.
 * @param {string} name
 * @param {any} detail
 */
const emitBrowserEvent = (name, detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

/**
 * Normalize a raw STOMP payload into a consistent shape.
 * @param {any} payload
 * @param {string|null} tenantId
 */
const normalizeTenantEvent = (payload, tenantId) => {
  if (payload && typeof payload === 'object') {
    const baseData =
      payload.data && typeof payload.data === 'object'
        ? payload.data
        : payload;
    return {
      event:
        payload.event ||
        payload.eventType ||
        baseData.event ||
        baseData.eventType ||
        null,
      tenant_id:
        payload.tenant_id ||
        payload.tenantId ||
        baseData.tenant_id ||
        baseData.tenantId ||
        tenantId ||
        null,
      status: payload.status || baseData.status || baseData.state || null,
      message: payload.message || baseData.message || null,
      data: baseData,
      raw: payload,
    };
  }
  return { event: null, tenant_id: tenantId, status: null, message: null, data: payload, raw: payload };
};

/* ─── topic sets ──────────────────────────────────────────────────────── */

/**
 * @typedef {'wallet'|'billing'|'apps'|'notifications'|'provisioning'|'calls'|'agents'|'queues'|'campaigns'} TopicName
 */

/**
 * @typedef {'tenant-service'|'pbx-core'} BrokerType
 */

/** Topics published by tenant-service (dashboard-ui + admin-ui) */
const TENANT_SERVICE_TOPICS = /** @type {TopicName[]} */ (['wallet', 'billing', 'apps', 'notifications', 'provisioning']);

/** Topics published by pbx-core (admin-ui, agents-ui, supervisor-ui) */
const PBX_CORE_TOPICS = /** @type {TopicName[]} */ (['calls', 'agents', 'queues', 'campaigns']);

/** Browser event name map — topic → custom event name(s) */
const TOPIC_BROWSER_EVENTS = /** @type {Record<TopicName, string[]>} */ ({
  wallet:        ['wallet-funded', 'tenant-wallet-event'],
  billing:       ['tenant-billing-event'],
  apps:          ['tenant-app-event'],
  notifications: ['tenant-notification-event'],
  provisioning:  ['tenant-provisioning-event'],
  calls:         ['tenant-call-event'],
  agents:        ['tenant-agent-event'],
  queues:        ['tenant-queue-event'],
  campaigns:     ['tenant-campaign-event'],
});

/** Default topics per broker type */
const DEFAULT_TOPICS_FOR_BROKER = /** @type {Record<BrokerType, TopicName[]>} */ ({
  'tenant-service': TENANT_SERVICE_TOPICS,
  'pbx-core': PBX_CORE_TOPICS,
});

/* ─── hook ────────────────────────────────────────────────────────────── */

/**
 * Shared hook to subscribe to tenant WebSocket topics on a specific broker.
 *
 * Works with both auth flows:
 *   - Keycloak-based (admin-ui, agents-ui, supervisor-ui) → reads keycloakToken
 *   - PKCE/dashboard-based (dashboard-ui) → reads auth.token
 *
 * @param {{ source?: string, broker?: BrokerType, topics?: TopicName[] }} [options]
 *   - source: label for logs (e.g. 'dashboard-ui')
 *   - broker: 'tenant-service' or 'pbx-core' — determines which WS URL to connect to
 *   - topics: override which topics to subscribe to (defaults based on broker)
 * @returns {{ isConnected: boolean }}
 */
export default function useTenantEvents(options = {}) {
  const {
    source = 'unknown',
    broker = 'tenant-service',
    topics: requestedTopics,
  } = options;

  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const tenantWsUrl = useSelector(selectTenantWsUrl);
  const pbxWsUrl = useSelector(selectStompWsUrl);
  const token = useSelector(
    (/** @type {{ auth: { keycloakToken: string|null, token: string|null } }} */ s) =>
      s.auth.keycloakToken || s.auth.token
  );

  // Pick the right WS URL based on broker type
  const wsUrl = broker === 'tenant-service' ? tenantWsUrl : pbxWsUrl;

  const { isConnected, subscribe, send } = useStompEvents(token, wsUrl);
  const pingRef = useRef(/** @type {string|null} */ (null));

  // Determine which topics to subscribe to
  const activeTopics = useMemo(() => {
    return requestedTopics || DEFAULT_TOPICS_FOR_BROKER[broker] || TENANT_SERVICE_TOPICS;
  }, [requestedTopics, broker]);

  // Build topic → STOMP path map
  const topicPaths = useMemo(() => {
    if (!tenantId) return null;
    /** @type {Record<string, string>} */
    const map = {};
    for (const t of activeTopics) {
      map[t] = `/topic/tenant/${tenantId}/${t}`;
    }
    return map;
  }, [tenantId, activeTopics]);

  // Subscribe to configured topics
  useEffect(() => {
    if (!topicPaths || !tenantId || !isConnected) return;

    /** @type {Array<{unsubscribe: () => void}>} */
    const subs = [];

    for (const [topicName, topicPath] of Object.entries(topicPaths)) {
      subs.push(
        subscribe(topicPath, (/** @type {any} */ payload) => {
          const event = normalizeTenantEvent(payload, tenantId);

          // Wallet-specific: update Redux balance
          if (topicName === 'wallet') {
            const walletData =
              event.data && typeof event.data === 'object' && event.data.data
                ? event.data.data
                : event.data;
            const balance = walletData?.totalBalance ?? walletData?.balance ?? null;
            const currency = walletData?.currency || 'INR';
            if (balance != null) {
              dispatch(setWallet({ balance: Number(balance), currency }));
            }
          }

          // Emit browser events for this topic
          const eventNames = TOPIC_BROWSER_EVENTS[/** @type {TopicName} */ (topicName)] || [];
          for (const eName of eventNames) {
            emitBrowserEvent(eName, event);
          }

          console.log(`[TenantEvents:${source}:${broker}] ${topicName}:`, event.event, event.status || '');
        })
      );
    }

    return () => {
      subs.forEach((/** @type {any} */ sub) => {
        try { sub.unsubscribe(); } catch (/** @type {any} */ _) { /* ignore */ }
      });
    };
  }, [dispatch, isConnected, subscribe, tenantId, topicPaths, source, broker]);

  // Ping on connect (only for tenant-service — it has the /app/tenant/{id}/ping endpoint)
  useEffect(() => {
    if (broker !== 'tenant-service') return;
    if (!isConnected || !tenantId) {
      pingRef.current = null;
      return;
    }
    if (pingRef.current === tenantId) return;

    pingRef.current = tenantId;
    send(`/app/tenant/${tenantId}/ping`, {
      source,
      timestamp: Date.now(),
    });
  }, [isConnected, send, tenantId, source, broker]);

  return { isConnected };
}

/* ─── convenience presets ─────────────────────────────────────────────── */
export { TENANT_SERVICE_TOPICS, PBX_CORE_TOPICS };
