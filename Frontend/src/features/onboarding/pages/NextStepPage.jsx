import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import LogoutButton from '../../auth/components/LogoutButton';
import { PATHS } from '../paths';
import { useOnboarding } from '../useOnboarding';

/** Placeholder for step 2 of each path, until those screens are built. */
export default function NextStepPage({ pathId }) {
  const navigate = useNavigate();
  const { answers } = useOnboarding();
  const path = PATHS.find((p) => p.id === pathId);

  // Opened by URL without choosing this path first.
  if (answers.path !== pathId) return <Navigate to="/onboarding" replace />;

  return (
    <div className="flex flex-col gap-6">
      <title>{`${path.title} · Khameo`}</title>
      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">{path.title}</h1>
      <p className="text-[15px] leading-5 text-muted">The next step of this path is coming soon.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/onboarding')}>
          Back
        </Button>
        <LogoutButton />
      </div>
    </div>
  );
}
