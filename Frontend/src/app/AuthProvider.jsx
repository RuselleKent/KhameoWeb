import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import PageLoader from '../components/layout/PageLoader';
import * as authApi from '../features/auth/auth.api';
import { connectOnboardingMock, withMockOnboardingFields } from '../features/onboarding/onboarding.api';
import { AuthContext } from './authContext';

function SessionError({ onRetry }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-[420px]">
        <Alert variant="error" icon={false} title="We couldn’t load Khameo">
          Check your connection and try again.
        </Alert>
        <Button size="block" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </main>
  );
}

// "Not now" on the consent screen lasts until the next log in (docs/api-auth.md, redirect rules).
// Kept per account so a reload doesn't ask again; cleared on every log in and log out.
const CONSENT_SKIPPED_KEY = 'khameo.consentSkipped';
const accountKey = (user) => (user ? `${user.id}|${user.email}` : null);

function readConsentSkipped() {
  try {
    return localStorage.getItem(CONSENT_SKIPPED_KEY);
  } catch {
    return null;
  }
}

function writeConsentSkipped(key) {
  try {
    if (key) localStorage.setItem(CONSENT_SKIPPED_KEY, key);
    else localStorage.removeItem(CONSENT_SKIPPED_KEY);
  } catch {
    // Storage blocked: "Not now" lasts until a reload.
  }
}

/**
 * Holds the signed-in user for the whole app.
 * On start it asks the API who is signed in (getUser): 401 means nobody, other failures show Retry.
 * Children only render once that check is done, so guards never see a half-loaded state.
 *
 * Context value: { user, consentSkipped, login, loginTwoFactor, register, signIn, logout, setUser, skipConsent }
 * - login may only start a log in ({ two_factor_required: true }): nobody is signed in until loginTwoFactor
 * - loginTwoFactor / register store the user the API returns; signIn(user) stores one from Google sign-in
 * - setUser(user) stores a user a page already got from the API (verify email, consent, onboarding…);
 *   it also takes an updater function
 * - skipConsent() records "Not now" on the consent screen; consentSkipped feeds nextStepFor()
 */
export default function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  // 'loading' | 'ready' | 'error'
  const [status, setStatus] = useState('loading');
  // Bumped by Retry to run the session check again.
  const [attempt, setAttempt] = useState(0);
  const [consentSkippedFor, setConsentSkippedFor] = useState(readConsentSkipped);

  // Users from the API get back the fields the onboarding mocks saved (no-op once those are real).
  const setUser = useCallback((next) => {
    setUserState((current) => {
      const value = typeof next === 'function' ? next(current) : withMockOnboardingFields(next);
      return value ?? null;
    });
  }, []);

  // The onboarding mocks read and change this user (see mockdata/mockUserStore.js).
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    connectOnboardingMock(
      () => userRef.current,
      (changed) => {
        // Update the ref now too, so a second mock call before the next render sees the change.
        userRef.current = changed;
        setUser(changed);
      },
    );
  }, [setUser]);

  const forgetConsentSkip = useCallback(() => {
    writeConsentSkipped(null);
    setConsentSkippedFor(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi.getUser().then(
      (current) => {
        if (cancelled) return;
        setUser(current);
        setStatus('ready');
      },
      (error) => {
        if (cancelled) return;
        if (error?.response?.status === 401) {
          // Nobody signed in: that's a normal, ready state.
          setUser(null);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, setUser]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  const signIn = useCallback(
    (signedIn) => {
      forgetConsentSkip();
      setUser(signedIn);
    },
    [forgetConsentSkip, setUser],
  );

  const login = useCallback(
    async (credentials) => {
      const result = await authApi.login(credentials);
      if (!result.two_factor_required) signIn(result);
      return result;
    },
    [signIn],
  );

  const loginTwoFactor = useCallback(
    async ({ code }) => {
      const signedIn = await authApi.loginTwoFactor({ code });
      signIn(signedIn);
      return signedIn;
    },
    [signIn],
  );

  const register = useCallback(
    async (payload) => {
      const result = await authApi.register(payload);
      signIn(result.user);
      return result;
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the request fails (offline, session already gone), forget the user locally.
    } finally {
      forgetConsentSkip();
      setUser(null);
    }
  }, [forgetConsentSkip, setUser]);

  const skipConsent = useCallback(() => {
    const key = accountKey(userRef.current);
    writeConsentSkipped(key);
    setConsentSkippedFor(key);
  }, []);

  const consentSkipped = Boolean(user) && consentSkippedFor === accountKey(user);

  const value = useMemo(
    () => ({ user, consentSkipped, login, loginTwoFactor, register, signIn, logout, setUser, skipConsent }),
    [user, consentSkipped, login, loginTwoFactor, register, signIn, logout, setUser, skipConsent],
  );

  if (status === 'loading') return <PageLoader />;
  if (status === 'error') return <SessionError onRetry={retry} />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
