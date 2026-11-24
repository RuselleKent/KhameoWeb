import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import LogoutButton from '../../auth/components/LogoutButton';
import { PATHS } from '../paths';
import { useOnboarding } from '../useOnboarding';

/** Placeholder for the steps of each path that aren't built yet. */
export default function NextStepPage({
  pathId,
  title,
  backTo = '/onboarding',
  continueTo,
  requireTwoFactor = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { answers } = useOnboarding();
  const heading = title ?? PATHS.find((p) => p.id === pathId).title;

  // Opened by URL without choosing this path first.
  if (answers.path !== pathId) return <Navigate to="/onboarding" replace />;
  if (requireTwoFactor && !user.two_factor_confirmed_at) return <Navigate to="/onboarding/host/two-factor" replace />;

  return (
    <div className="flex flex-col gap-6">
      <title>{`${heading} · Khameo`}</title>
      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">{heading}</h1>
      <p className="text-[15px] leading-5 text-muted">This step is coming soon.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate(backTo)}>
          Back
        </Button>
        {continueTo && <Button onClick={() => navigate(continueTo)}>Continue</Button>}
        <LogoutButton />
      </div>
    </div>
  );
}
