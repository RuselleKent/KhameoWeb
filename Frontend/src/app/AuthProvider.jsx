import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import PageLoader from '../components/layout/PageLoader';
import * as authApi from '../features/auth/auth.api';
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

/**
 * Holds the signed-in user for the whole app.
 * On start it asks the API who is signed in (getUser): 401 means nobody, other failures show Retry.
 * Children only render once that check is done, so guards never see a half-loaded state.
 *
 * Context value: { user, login, register, logout, setUser }
 * - login / register call the API and store the returned user
 * - setUser(user) stores a user a page already got from the API (verify email, reset password)
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' | 'ready' | 'error'
  const [status, setStatus] = useState('loading');
  // Bumped by Retry to run the session check again.
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);

  const login = useCallback(async (credentials) => {
    const signedIn = await authApi.login(credentials);
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Even if the request fails, forget the user locally so the UI doesn't stay signed in.
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, setUser }), [user, login, register, logout]);

  if (status === 'loading') return <PageLoader />;
  if (status === 'error') return <SessionError onRetry={retry} />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
