import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wraps app routes that need onboarding finished (use inside RequireAuth).
 * Not onboarded → /onboarding.
 */
export default function RequireOnboarded() {
  const { user } = useAuth();

  if (!user?.onboarded_at) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
