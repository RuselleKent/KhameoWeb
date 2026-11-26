import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { nextStepFor } from './authRedirect';

/**
 * Wraps the public routes (landing, welcome, login, sign-up, verify email, forgot/reset password).
 * Signed out → show the page. Signed in → send the user to their next step instead (authRedirect.js):
 * - not verified → /verify-email (that page itself stays reachable, sign-up lands there signed in)
 * - no consent → /onboarding/consent, not onboarded → /onboarding
 * - done → the page they were trying to reach before logging in, or /home
 */
export default function RedirectIfAuthenticated() {
  const { user, consentSkipped } = useAuth();
  const location = useLocation();

  if (!user) return <Outlet />;

  const next = nextStepFor(user, { consentSkipped });
  if (next === '/verify-email') {
    return location.pathname === '/verify-email' ? (
      <Outlet />
    ) : (
      // Keep any state (e.g. code timers from sign-up) for the verify page.
      <Navigate to="/verify-email" replace state={location.state} />
    );
  }
  if (next === '/home') {
    return <Navigate to={location.state?.from?.pathname ?? '/home'} replace />;
  }
  return <Navigate to={next} replace />;
}
