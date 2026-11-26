import { useCallback, useEffect, useRef, useState } from 'react';
import { GOOGLE_STATUSES, GOOGLE_USE_MOCK, getUser, googleRedirectUrl, logout, mockGoogleSignIn } from './auth.api';

/** `type` of the message /auth/google/done posts to the window that opened the popup. */
export const GOOGLE_MESSAGE_TYPE = 'khameo:google-sign-in';

// A popup closed without reporting back counts as cancelled, after this grace period
// (the done page posts its message just before it closes itself).
const CLOSED_GRACE_MS = 600;
const POLL_MS = 500;

const IDLE = { phase: 'idle', intent: null, blocked: false, email: null, user: null, run: 0 };

/**
 * Google sign-in through a popup (docs/api-auth.md section 9).
 *
 * phase: 'idle' | 'waiting' | 'success' | 'cancelled' | 'not_registered' | 'already_in_use' | 'error'
 * - start(intent) opens the popup ('login' | 'signup'); `blocked` is true when the browser stopped it
 * - on 'success', `user` is the signed-in user (getUser()); the page shows the welcome screen and then
 *   hands it to AuthProvider's signIn()
 * - `email` is the Google address, when the popup reported one (not_registered, already_in_use)
 * - restart() starts again with a different Google account (logs the connected one out first)
 * - reset() closes the popup and goes back to the form
 *
 * `initial` sets the starting state, e.g. { phase: 'cancelled' } from /login?google=cancelled.
 */
export function useGoogleSignIn(defaultIntent, initial) {
  const [state, setState] = useState(() => ({ ...IDLE, ...initial }));
  const popupRef = useRef(null);
  // Each start() gets a number; results of older runs are ignored.
  const runRef = useRef(0);

  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    popupRef.current = null;
  }, []);

  const handleResult = useCallback(
    async (run, status, email = null) => {
      if (run !== runRef.current) return;
      popupRef.current = null;
      if (status !== 'success') {
        setState((s) => ({ ...s, phase: GOOGLE_STATUSES.includes(status) ? status : 'error', email, user: null }));
        return;
      }
      try {
        const user = await getUser();
        if (run === runRef.current) setState((s) => ({ ...s, phase: 'success', email: user.email, user }));
      } catch {
        if (run === runRef.current) setState((s) => ({ ...s, phase: 'error' }));
      }
    },
    [],
  );

  const start = useCallback(
    (intent = defaultIntent) => {
      closePopup();
      const run = ++runRef.current;
      setState({ ...IDLE, phase: 'waiting', intent, run });

      if (GOOGLE_USE_MOCK) {
        mockGoogleSignIn().then(({ status, email, user }) => {
          if (run !== runRef.current) return;
          if (status === 'success') setState((s) => ({ ...s, phase: 'success', email, user }));
          else handleResult(run, status, email);
        });
        return;
      }

      const popup = window.open(googleRedirectUrl({ intent }), 'khameo-google', 'popup,width=500,height=640');
      if (!popup) {
        setState((s) => ({ ...s, blocked: true }));
        return;
      }
      popupRef.current = popup;
    },
    [closePopup, defaultIntent, handleResult],
  );

  // While the real popup is open: listen for its result, and notice if it was closed without one.
  const waitingRun = state.phase === 'waiting' && !GOOGLE_USE_MOCK ? state.run : null;
  useEffect(() => {
    if (waitingRun === null) return undefined;

    function onMessage(event) {
      // Only our own /auth/google/done page may report a result.
      if (event.origin !== window.location.origin || event.data?.type !== GOOGLE_MESSAGE_TYPE) return;
      handleResult(waitingRun, event.data.status, event.data.email ?? null);
    }

    let graceTimer;
    const poll = setInterval(() => {
      if (!popupRef.current?.closed || graceTimer) return;
      graceTimer = setTimeout(() => handleResult(waitingRun, 'cancelled'), CLOSED_GRACE_MS);
    }, POLL_MS);

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      clearTimeout(graceTimer);
    };
  }, [waitingRun, handleResult]);

  // Close the popup if the page goes away.
  useEffect(() => closePopup, [closePopup]);

  const reset = useCallback(() => {
    runRef.current += 1;
    closePopup();
    setState(IDLE);
  }, [closePopup]);

  const restart = useCallback(
    async (intent) => {
      // A connected account already has a session: end it before choosing another one.
      if (state.phase === 'success' && !GOOGLE_USE_MOCK) {
        try {
          await logout();
        } catch {
          // Already signed out.
        }
      }
      start(intent ?? state.intent ?? defaultIntent);
    },
    [defaultIntent, start, state.intent, state.phase],
  );

  return { ...state, start, restart, reset };
}
