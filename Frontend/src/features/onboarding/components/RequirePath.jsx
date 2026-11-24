import { Navigate, Outlet } from 'react-router-dom';
import { useOnboarding } from '../useOnboarding';

/** Wraps the steps of one path. Opened by URL without choosing that path → /onboarding. */
export default function RequirePath({ pathId }) {
  const { answers } = useOnboarding();

  if (answers.path !== pathId) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
