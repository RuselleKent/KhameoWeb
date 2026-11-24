import { Navigate, Outlet, useMatches } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OnboardingProvider from './OnboardingProvider';

/**
 * Parent route of every /onboarding page (inside RequireAuth). Already onboarded → /home,
 * except on routes with `handle: { afterOnboarding: true }` (Ready, which saves onboarding, and the tour).
 */
export default function OnboardingRoot() {
  const { user } = useAuth();
  const matches = useMatches();
  const openAfterOnboarding = matches.some((match) => match.handle?.afterOnboarding);

  if (user.onboarded_at && !openAfterOnboarding) return <Navigate to="/home" replace />;
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}
