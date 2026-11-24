import { Link, Navigate, Outlet, useMatches } from 'react-router-dom';
import Logo from '../../../components/layout/Logo';
import { useAuth } from '../../../hooks/useAuth';
import { cn } from '../../../lib/utils';
import { useOnboarding } from '../useOnboarding';
import StepProgress from './StepProgress';

/**
 * Shell for the onboarding steps: logo and progress on top, a 640px column below.
 * Each step route describes itself with a `handle` (see router.jsx):
 * - step, totalSteps  progress in the header
 * - wide              760px column (Ready)
 * - skip              { to, clear, hidden }: Skip link; `clear` changes the answers of the skipped step,
 *                     `hidden(answers)` may hide it
 * The consent screen comes first, so steps redirect there until it is answered.
 */
export default function OnboardingLayout() {
  const { user } = useAuth();
  const { answers, updateAnswers } = useOnboarding();
  const handle = useMatches().findLast((match) => match.handle?.step)?.handle;

  // Once onboarded this was already asked; Ready and the tour stay reachable.
  if (!user.onboarded_at && !user.recording_consent_at && !answers.consentSkipped) {
    return <Navigate to="/onboarding/consent" replace />;
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between gap-3 px-4 py-5 sm:px-10">
        <Logo />
        {handle && (
          <StepProgress step={handle.step} total={handle.totalSteps}>
            {handle.skip && !handle.skip.hidden?.(answers) && (
              <Link
                to={handle.skip.to}
                onClick={() => updateAnswers(handle.skip.clear)}
                className="rounded text-[15px] leading-5 font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Skip
              </Link>
            )}
          </StepProgress>
        )}
      </header>
      <main className={cn('mx-auto w-full px-4 pt-6 pb-16 sm:pt-10', handle?.wide ? 'max-w-[792px]' : 'max-w-[672px]')}>
        <Outlet />
      </main>
    </div>
  );
}
