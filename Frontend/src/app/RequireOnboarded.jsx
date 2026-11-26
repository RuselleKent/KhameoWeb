import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { nextStepFor } from './authRedirect';

/**
 * Wraps app routes that need every first step done (use inside RequireAuth):
 * no consent answer since logging in → /onboarding/consent, not onboarded → /onboarding.
 */
export default function RequireOnboarded() {
  const { user, consentSkipped } = useAuth();

  const next = nextStepFor(user, { consentSkipped });
  if (next !== '/home') return <Navigate to={next} replace />;
  return <Outlet />;
}
