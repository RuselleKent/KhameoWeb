import { Navigate, Outlet } from 'react-router-dom';
import { useOnboarding } from '../useOnboarding';

/**
 * Wraps the steps of one path. Opened by URL without choosing that path → /onboarding.
 * Stays open after "Not yet" moved the user to the personal path, so they can come Back and enter a code.
 */
export default function RequirePath({ pathId }) {
  const { answers } = useOnboarding();

  if (answers.path !== pathId && answers.startedAs !== pathId) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
