import { useLocation } from 'react-router-dom';

/**
 * The host pages run in two places: in onboarding (/onboarding/host) and later, from Settings or Groups
 * (/host-application, also used to reapply). This gives the routes for where they are now.
 */
export function useHostFlow() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/host-application')) {
    return { base: '/host-application', startFrom: '/host-status', submittedTo: '/host-status', onboarding: false };
  }
  return {
    base: '/onboarding/host',
    startFrom: '/onboarding',
    submittedTo: '/onboarding/host/submitted',
    onboarding: true,
  };
}
