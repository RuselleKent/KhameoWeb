import { Navigate } from 'react-router-dom';
import ReadyStep from '../../components/ReadyStep';
import { useOnboarding } from '../../useOnboarding';

const AI_NOTE = 'AI drafts are visible only to you until you finalize.';

export default function ReadyPage() {
  const { joined } = useOnboarding().answers;

  if (!joined.coach) return <Navigate to="/onboarding/coach" replace />;

  const { group, pending_reviews_count: pending } = joined.coach.invite;
  const waiting =
    pending > 0
      ? `${pending} ${pending === 1 ? 'submission is' : 'submissions are'} waiting for your review.`
      : 'No submissions are waiting for review yet.';

  return (
    <ReadyStep
      pathId="coach"
      badge="check"
      title={() => `You’re a coach in ${group.name}`}
      description={`${waiting} ${AI_NOTE}`}
      cards={[
        { title: 'Review submissions', description: 'Start with the oldest one.' },
        { title: 'Open the group', description: 'See members and activities.' },
        { title: 'Explore your dashboard', description: 'See your home and schedule.' },
      ]}
      profileTo="/onboarding/coach/profile"
      nextTo="/onboarding/coach/tour"
    />
  );
}
