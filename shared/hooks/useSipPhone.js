import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserAgent, Registerer, Inviter, SessionState } from 'sip.js';
import {
  setRegistrationState, setIncomingCall, clearIncomingCall,
  setActiveCall, setCallState, setMuted, callEnded, selectIsRegistered,
} from '../store/slices/sipSlice.js';

/**
 * @typedef {Object} SipCredentials
 * @property {string} extension
 * @property {string} sip_domain
 * @property {string} sip_password
 * @property {string} [sip_wss_url]
 */

/**
 * SIP.js softphone hook — handles registration, inbound/outbound calls, DTMF, hold, transfer.
 *
 * @returns {{ isRegistered: boolean, register: () => Promise<void>, unregister: () => Promise<void>,
 *             call: (number: string) => Promise<void>, answer: () => Promise<void>, hangup: () => void,
 *             hold: () => Promise<void>, unhold: () => Promise<void>,
 *             mute: () => void, unmute: () => void,
 *             transfer: (target: string) => Promise<void>, sendDtmf: (digit: string) => void }}
 */
export default function useSipPhone() {
  const dispatch = useDispatch();
  const isRegistered = useSelector(selectIsRegistered);
  const sipWssUrl = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.sipWssUrl));
  const turnUrl = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.turnUrl));
  const tenantSlug = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.tenant.slug));
  const authToken = /** @type {string|null} */ (useSelector((/** @type {any} */ s) => s.auth?.access_token));

  const uaRef = /** @type {import('react').MutableRefObject<UserAgent|null>} */ (useRef(null));
  const registererRef = /** @type {import('react').MutableRefObject<Registerer|null>} */ (useRef(null));
  const sessionRef = /** @type {import('react').MutableRefObject<any>} */ (useRef(null));
  const credsRef = /** @type {import('react').MutableRefObject<SipCredentials|null>} */ (useRef(null));

  /**
   * Fetch SIP credentials + TURN credentials, then register.
   */
  const register = useCallback(async () => {
    if (uaRef.current) return;
    if (!sipWssUrl || !authToken) return;

    dispatch(setRegistrationState('REGISTERING'));

    try {
      const sipRes = await fetch('/api/v1/agents/me/sip-credentials', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!sipRes.ok) throw new Error('Failed to fetch SIP credentials');
      /** @type {SipCredentials} */
      const sipCreds = await sipRes.json();
      credsRef.current = sipCreds;

      /** @type {RTCIceServer[]} */
      let iceServers = [];
      if (tenantSlug) {
        try {
          const turnRes = await fetch(`/api/v1/turn/credentials/${tenantSlug}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (turnRes.ok) {
            const turnCreds = await turnRes.json();
            iceServers = [{
              urls: turnCreds.turn_url || turnUrl || '',
              username: turnCreds.username,
              credential: turnCreds.password,
            }];
          }
        } catch (/** @type {any} */ _e) {
          console.warn('[SIP] TURN credentials fetch failed, using STUN only');
          iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
        }
      }

      const sipUri = `sip:${sipCreds.extension}@${sipCreds.sip_domain}`;

      const ua = new UserAgent({
        uri: UserAgent.makeURI(sipUri),
        transportOptions: {
          server: sipCreds.sip_wss_url || sipWssUrl,
        },
        authorizationUsername: sipCreds.extension,
        authorizationPassword: sipCreds.sip_password,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: { iceServers },
        },
        logLevel: import.meta.env.DEV ? 'debug' : 'warn',
        delegate: {
          onInvite: (/** @type {any} */ invitation) => handleIncomingCall(invitation),
        },
      });

      await ua.start();
      uaRef.current = ua;

      const registerer = new Registerer(ua);
      registererRef.current = registerer;

      registerer.stateChange.addListener((/** @type {any} */ state) => {
        /** @type {Record<string, string>} */
        const map = { Initial: 'REGISTERING', Registered: 'REGISTERED', Unregistered: 'UNREGISTERED', Terminated: 'FAILED' };
        dispatch(setRegistrationState(map[state] || 'UNREGISTERED'));
      });

      await registerer.register();
      console.log('[SIP] Registered:', sipUri);

    } catch (/** @type {any} */ err) {
      console.error('[SIP] Registration failed:', err);
      dispatch(setRegistrationState('FAILED'));
    }
  }, [sipWssUrl, authToken, tenantSlug, turnUrl, dispatch]);

  /**
   * Handle incoming INVITE from Kamailio.
   * @param {any} invitation
   */
  function handleIncomingCall(invitation) {
    const callerNumber = invitation.remoteIdentity?.uri?.user || 'Unknown';
    const callerName = invitation.remoteIdentity?.displayName || callerNumber;

    dispatch(setIncomingCall({
      id: invitation.id,
      callerNumber,
      callerName,
      timestamp: Date.now(),
    }));

    sessionRef.current = invitation;

    invitation.stateChange.addListener((/** @type {any} */ state) => {
      if (state === SessionState.Terminated) {
        dispatch(clearIncomingCall());
        sessionRef.current = null;
      }
    });
  }

  const answer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    await session.accept();
    setupActiveSession(session, 'INBOUND');
  }, [dispatch]);

  const call = useCallback(async (/** @type {string} */ number) => {
    const ua = uaRef.current;
    if (!ua || !credsRef.current) return;

    const target = UserAgent.makeURI(`sip:${number}@${credsRef.current.sip_domain}`);
    if (!target) return;

    dispatch(setCallState('RINGING_OUT'));

    const inviter = new Inviter(ua, target);
    sessionRef.current = inviter;

    inviter.stateChange.addListener((/** @type {any} */ state) => {
      if (state === SessionState.Established) {
        setupActiveSession(inviter, 'OUTBOUND');
      }
      if (state === SessionState.Terminated) {
        dispatch(callEnded());
        sessionRef.current = null;
      }
    });

    await inviter.invite();
  }, [dispatch]);

  /**
   * @param {any} session
   * @param {string} direction
   */
  function setupActiveSession(session, direction) {
    const remoteNumber = session.remoteIdentity?.uri?.user || 'Unknown';
    const remoteName = session.remoteIdentity?.displayName || remoteNumber;

    dispatch(setActiveCall({
      id: session.id,
      direction,
      remoteNumber,
      remoteName,
      startTime: Date.now(),
    }));

    session.stateChange.addListener((/** @type {any} */ state) => {
      if (state === SessionState.Terminated) {
        dispatch(callEnded());
        sessionRef.current = null;
      }
    });
  }

  const hangup = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      if (session.state === SessionState.Established) {
        session.bye();
      } else {
        session.reject?.() || session.cancel?.();
      }
    } catch (/** @type {any} */ _e) {
      console.warn('[SIP] Hangup error:', _e);
    }
    dispatch(callEnded());
    sessionRef.current = null;
  }, [dispatch]);

  const hold = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.sessionDescriptionHandler) return;
    await session.hold();
    dispatch(setCallState('ON_HOLD'));
  }, [dispatch]);

  const unhold = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.sessionDescriptionHandler) return;
    await session.unhold();
    dispatch(setCallState('CONNECTED'));
  }, [dispatch]);

  const mute = useCallback(() => {
    const session = sessionRef.current;
    if (!session?.sessionDescriptionHandler) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    pc?.getSenders().forEach((/** @type {any} */ s) => { if (s.track) s.track.enabled = false; });
    dispatch(setMuted(true));
  }, [dispatch]);

  const unmute = useCallback(() => {
    const session = sessionRef.current;
    if (!session?.sessionDescriptionHandler) return;
    const pc = session.sessionDescriptionHandler.peerConnection;
    pc?.getSenders().forEach((/** @type {any} */ s) => { if (s.track) s.track.enabled = true; });
    dispatch(setMuted(false));
  }, [dispatch]);

  const transfer = useCallback(async (/** @type {string} */ target) => {
    const session = sessionRef.current;
    if (!session || !credsRef.current) return;
    const targetUri = UserAgent.makeURI(`sip:${target}@${credsRef.current.sip_domain}`);
    if (targetUri) await session.refer(targetUri);
  }, []);

  const sendDtmf = useCallback((/** @type {string} */ digit) => {
    const session = sessionRef.current;
    if (!session) return;
    session.info({ contentType: 'application/dtmf-relay', body: `Signal=${digit}\r\nDuration=160` });
  }, []);

  const unregister = useCallback(async () => {
    try {
      await registererRef.current?.unregister();
      await uaRef.current?.stop();
    } catch (/** @type {any} */ _) { /* ignore */ }
    uaRef.current = null;
    registererRef.current = null;
    dispatch(setRegistrationState('UNREGISTERED'));
  }, [dispatch]);

  useEffect(() => {
    return () => { unregister(); };
  }, [unregister]);

  return {
    isRegistered,
    register,
    unregister,
    call,
    answer,
    hangup,
    hold,
    unhold,
    mute,
    unmute,
    transfer,
    sendDtmf,
  };
}