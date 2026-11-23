import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wraps every signed-in route.
 * Signed out → /login (remembering this page so login can come back to it).
 * Email not verified → /verify-email.
 */
export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.email_verified_at) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}
