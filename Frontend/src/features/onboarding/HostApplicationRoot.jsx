import { Outlet } from 'react-router-dom';
import OnboardingProvider from './OnboardingProvider';

/** Parent of /host-status and /host-application, for users who finished onboarding. */
export default function HostApplicationRoot() {
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}
