// shared/hooks/useWalletEvents.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useStompEvents from './useStompEvents.js';
import { selectTenantId } from '../store/slices/tenantSlice.js';
import { setWallet } from '../store/slices/billingSlice.js';

/**
 * Hook to subscribe to wallet-related WebSocket events.
 *
 * Subscribes to: /topic/tenant/{tenantId}/{wallet}
 * Listens for: WALLET_FUNDED events
 *
 * When WALLET_FUNDED event is received, updates the wallet balance in Redux store.
 *
 * @returns {{ isConnected: boolean, refetchWallet: () => void }}
 */
export default function useWalletEvents() {
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const token = useSelector((/** @type {{ auth: { keycloakToken: string | null, token: string | null } }} */ s) => s.auth.keycloakToken || s.auth.token);
  const wallet = useSelector((/** @type {{ billing: { wallet: any } }} */ s) => s.billing.wallet);

  const { isConnected, subscribe } = useStompEvents(token);

  const unwrapWalletEvent = (event) => {
    if (!event || typeof event !== 'object') return event;
    if (event.data && typeof event.data === 'object') {
      return {
        ...event.data,
        event: event.event || event.eventType || event.data.event || null,
      };
    }
    return {
      ...event,
      event: event.event || event.eventType || null,
    };
  };

  useEffect(() => {
    if (!tenantId || !isConnected) return;

    const topic = `/topic/tenant/${tenantId}/wallet`;
    const { unsubscribe } = subscribe(topic, (/** @type {any} */ incomingEvent) => {
      const event = unwrapWalletEvent(incomingEvent);
      if (event.event === 'WALLET_FUNDED' || event.event === 'WALLET_CREATED') {
        // Update wallet balance from the event
        dispatch(setWallet({
          balance: event.totalBalance || event.balance,
          currency: event.currency || 'INR',
        }));
        console.log('[WalletEvents] Wallet funded:', event.totalBalance);

        // Trigger a custom event to notify components to refetch
        window.dispatchEvent(new CustomEvent('wallet-funded', { detail: event }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tenantId, isConnected, subscribe, dispatch]);

  const refetchWallet = () => {
    // Components can call this to manually trigger a refetch
    window.dispatchEvent(new CustomEvent('wallet-refetch'));
  };

  return { isConnected, refetchWallet };
}
