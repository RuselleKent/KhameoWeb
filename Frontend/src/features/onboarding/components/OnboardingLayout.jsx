import { Navigate, Outlet, useMatches } from 'react-router-dom';
import Logo from '../../../components/layout/Logo';
import { useAuth } from '../../../hooks/useAuth';
import { useOnboarding } from '../useOnboarding';
import StepProgress from './StepProgress';

/**
 * Shell for the onboarding steps: logo and progress on top, a 640px column below.
 * Each step route sets its position with `handle: { step, totalSteps }` (see router.jsx).
 * The consent screen comes first, so steps redirect there until it is answered.
 */
export default function OnboardingLayout() {
  const { user } = useAuth();
  const { answers } = useOnboarding();
  const progress = useMatches().findLast((match) => match.handle?.step)?.handle;

  if (!user.recording_consent_at && !answers.consentSkipped) return <Navigate to="/onboarding/consent" replace />;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-10">
        <Logo />
        {progress && <StepProgress step={progress.step} total={progress.totalSteps} />}
      </header>
      <main className="mx-auto w-full max-w-[672px] px-4 pt-6 pb-16 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
