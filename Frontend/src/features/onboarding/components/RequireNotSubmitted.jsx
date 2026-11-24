import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { hasHostApplication } from '../hostRules';
import { useHostFlow } from '../useHostFlow';

/** Wraps the host verification steps. They close while an application is in review or approved. */
export default function RequireNotSubmitted() {
  const { user } = useAuth();
  const { submittedTo } = useHostFlow();

  if (hasHostApplication(user)) return <Navigate to={submittedTo} replace />;
  return <Outlet />;
}
