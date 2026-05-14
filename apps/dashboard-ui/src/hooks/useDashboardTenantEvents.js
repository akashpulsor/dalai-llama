import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectTenantId,
  selectTenantWsUrl,
  setWallet,
  showFlash,
} from "@dalaillama/shared-store";
import useStompEvents from "@dalaillama/shared-hooks/useStompEvents.js";

const SUCCESS_STATUSES = new Set(["ACTIVE", "COMPLETED", "SUCCESS", "READY"]);
const FAILURE_STATUSES = new Set(["FAILED", "ERROR", "PARTIAL_FAILURE", "BLOCKED"]);

const emitBrowserEvent = (name, detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const normalizeTenantEvent = (payload, tenantId) => {
  if (payload && typeof payload === "object") {
    const baseData =
      payload.data && typeof payload.data === "object"
        ? payload.data
        : payload;
    const eventName =
      payload.event ||
      payload.eventType ||
      payload.EventType ||
      baseData.event ||
      baseData.eventType ||
      baseData.EventType ||
      null;
    const status =
      payload.status ||
      baseData.status ||
      baseData.state ||
      null;
    const message =
      payload.message ||
      baseData.message ||
      null;
    const resolvedTenantId =
      payload.tenant_id ||
      payload.tenantId ||
      baseData.tenant_id ||
      baseData.tenantId ||
      tenantId ||
      null;

    return {
      event: eventName,
      tenant_id: resolvedTenantId,
      status,
      message,
      data: baseData,
      raw: payload,
    };
  }

  return {
    event: null,
    tenant_id: tenantId,
    status: null,
    message: null,
    data: payload,
    raw: payload,
  };
};

const getFlashType = (event) => {
  if (FAILURE_STATUSES.has(String(event.status || "").toUpperCase())) {
    return event.event === "TENANT_SUSPENDED" ? "warning" : "error";
  }
  if (SUCCESS_STATUSES.has(String(event.status || "").toUpperCase())) {
    return "success";
  }
  if (event.event === "PING_ACK") {
    return "success";
  }
  if (event.event === "TENANT_SUSPENDED") {
    return "warning";
  }
  return "info";
};

const getFlashMessage = (event, fallbackLabel) => {
  if (event.message) return event.message;
  if (event.event === "PING_ACK") return "Realtime connection active.";
  if (event.event === "TENANT_SUSPENDED") return "Tenant suspended due to billing state.";
  if (event.event) return `${fallbackLabel}: ${event.event}`;
  return fallbackLabel;
};

export default function useDashboardTenantEvents() {
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const token = useSelector((s) => s.auth.keycloakToken || s.auth.token);
  const tenantWsUrl = useSelector(selectTenantWsUrl);
  const stompWsUrl = useSelector((s) => s.tenant.stompWsUrl);

  const { isConnected, subscribe, send } = useStompEvents(token, tenantWsUrl);
  const pingTenantRef = useRef(null);
  const previousConnectionRef = useRef(null);

  useEffect(() => {
    console.log("[dashboard-events] STOMP endpoint state", {
      tenantWsUrl,
      fallbackStompWsUrl: stompWsUrl,
      selectedWsUrl: tenantWsUrl || stompWsUrl || null,
      tenantId,
      hasToken: !!token,
      isConnected,
    });
  }, [isConnected, stompWsUrl, tenantId, tenantWsUrl, token]);

  const topics = useMemo(() => {
    if (!tenantId) return null;
    return {
      wallet: `/topic/tenant/${tenantId}/wallet`,
      billing: `/topic/tenant/${tenantId}/billing`,
      apps: `/topic/tenant/${tenantId}/apps`,
      notifications: `/topic/tenant/${tenantId}/notifications`,
      provisioning: `/topic/tenant/${tenantId}/provisioning`,
    };
  }, [tenantId]);

  useEffect(() => {
    if (!topics || !tenantId || !isConnected) {
      console.log("[dashboard-events] Waiting to subscribe", {
        hasTopics: !!topics,
        tenantId,
        isConnected,
      });
      return;
    }

    console.log("[dashboard-events] Subscribing tenant topics", topics);

    const walletSub = subscribe(topics.wallet, (payload) => {
      const event = normalizeTenantEvent(payload, tenantId);
      console.log("[dashboard-events] Wallet event", event);
      const eventName = String(event.event || "").toUpperCase();
      const walletData =
        event.data && typeof event.data === "object" && event.data.data
          ? event.data.data
          : event.data;
      const balance = walletData?.totalBalance ?? walletData?.balance ?? null;
      const currency = walletData?.currency || "INR";

      if (balance != null) {
        dispatch(setWallet({ balance: Number(balance), currency }));
      }

      emitBrowserEvent("wallet-funded", event);
      emitBrowserEvent("tenant-wallet-event", event);

      if (eventName === "WALLET_CREATED" || eventName === "WALLET_FUNDED") {
        dispatch(
          showFlash({
            message: getFlashMessage(event, "Wallet updated"),
            type: getFlashType(event),
          })
        );
      }
    });

    const billingSub = subscribe(topics.billing, (payload) => {
      const event = normalizeTenantEvent(payload, tenantId);
      console.log("[dashboard-events] Billing event", event);
      emitBrowserEvent("tenant-billing-event", event);
      dispatch(
        showFlash({
          message: getFlashMessage(event, "Billing updated"),
          type: getFlashType(event),
        })
      );
    });

    const appsSub = subscribe(topics.apps, (payload) => {
      const event = normalizeTenantEvent(payload, tenantId);
      console.log("[dashboard-events] App event", event);
      emitBrowserEvent("tenant-app-event", event);
      dispatch(
        showFlash({
          message: getFlashMessage(event, "App update received"),
          type: getFlashType(event),
        })
      );
    });

    const notificationSub = subscribe(topics.notifications, (payload) => {
      const event = normalizeTenantEvent(payload, tenantId);
      console.log("[dashboard-events] Notification event", event);
      emitBrowserEvent("tenant-notification-event", event);
      dispatch(
        showFlash({
          message: getFlashMessage(event, "Notification received"),
          type: getFlashType(event),
        })
      );
    });

    const provisioningSub = subscribe(topics.provisioning, (payload) => {
      const event = normalizeTenantEvent(payload, tenantId);
      console.log("[dashboard-events] Provisioning event", event);
      emitBrowserEvent("tenant-provisioning-event", event);
      dispatch(
        showFlash({
          message: getFlashMessage(event, "Provisioning update"),
          type: getFlashType(event),
        })
      );
    });

    return () => {
      console.log("[dashboard-events] Unsubscribing tenant topics", topics);
      walletSub.unsubscribe();
      billingSub.unsubscribe();
      appsSub.unsubscribe();
      notificationSub.unsubscribe();
      provisioningSub.unsubscribe();
    };
  }, [dispatch, isConnected, subscribe, tenantId, topics]);

  useEffect(() => {
    if (previousConnectionRef.current === isConnected) return;

    if (previousConnectionRef.current === false && isConnected) {
      emitBrowserEvent("tenant-provisioning-event", {
        connection: "connected",
        message: "Realtime connection restored.",
      });
    } else if (previousConnectionRef.current === true && !isConnected) {
      emitBrowserEvent("tenant-provisioning-event", {
        connection: "reconnecting",
        message: "Realtime connection lost. Reconnecting...",
      });
    }

    previousConnectionRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) {
      pingTenantRef.current = null;
      return;
    }
    if (!tenantId || pingTenantRef.current === tenantId) return;

    pingTenantRef.current = tenantId;
    send(`/app/tenant/${tenantId}/ping`, {
      source: "dashboard-ui",
      timestamp: Date.now(),
    });
  }, [isConnected, send, tenantId]);
}
