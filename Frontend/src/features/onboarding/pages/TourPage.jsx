import { Link, Navigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

const AREAS = ['Home', 'Solo Practice', 'Library', 'Groups', 'Real Time Rehearsal', 'Analytics', 'Settings'];

/** Offer of the app tour, after onboarding is saved. `readyTo` is the path's Ready step. */
export default function TourPage({ readyTo }) {
  const { user } = useAuth();

  // Opened by URL before the Ready step saved onboarding.
  if (!user.onboarded_at) return <Navigate to={readyTo} replace />;

  return (
    <div className="flex flex-col items-center gap-6 text-center sm:pt-20">
      <title>Take a one-minute tour · Khameo</title>

      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">Take a one-minute tour</h1>
      <p className="text-[15px] leading-5 text-muted">
        See what each part of Khameo does and how to move around. We use sample data, so nothing is real.
      </p>

      <ul className="flex flex-wrap justify-center gap-2">
        {AREAS.map((area) => (
          <li key={area} className="rounded-full bg-white px-2.5 py-1 text-xs leading-4 font-semibold text-ink">
            {area}
          </li>
        ))}
      </ul>

      {/* Both go home until the tour itself is built. */}
      <Button size="blockLg" to="/home" replace>
        Start the tour
      </Button>
      <Link
        to="/home"
        replace
        className="rounded text-sm leading-[18px] font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Skip for now. You can replay the tour from Settings.
      </Link>
    </div>
  );
}
