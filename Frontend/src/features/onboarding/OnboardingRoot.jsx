import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OnboardingProvider from './OnboardingProvider';

/** Parent route of every /onboarding page (inside RequireAuth). Already onboarded → /home. */
export default function OnboardingRoot() {
  const { user } = useAuth();

  if (user.onboarded_at) return <Navigate to="/home" replace />;
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}
