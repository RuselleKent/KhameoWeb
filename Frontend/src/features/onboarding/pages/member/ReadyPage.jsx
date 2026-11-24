import { Navigate } from 'react-router-dom';
import ReadyStep from '../../components/ReadyStep';
import { groupLabel } from '../../groupLabel';
import { useOnboarding } from '../../useOnboarding';
import { formatEventTime } from '../../../../lib/formatDate';

export default function ReadyPage() {
  const { joined } = useOnboarding().answers;

  if (!joined.member) return <Navigate to="/onboarding/member" replace />;

  const { group, next_event } = joined.member.invite;
  const cards = [
    { title: 'Open the group', description: 'See activities, the feed and rankings.' },
    next_event
      ? { title: next_event.title, description: formatEventTime(next_event.starts_at) }
      : { title: 'Explore your dashboard', description: 'See your home and schedule.' },
    { title: 'Start a solo session', description: 'Warm up before your slot.' },
  ];

  return (
    <ReadyStep
      pathId="member"
      badge="check"
      title={(firstName) => (firstName ? `You’re in, ${firstName}` : 'You’re in')}
      description={`You joined ${groupLabel(group)} as a Member. Your host can see your submissions.`}
      cards={cards}
      profileTo="/onboarding/member/profile"
      nextTo="/onboarding/member/tour"
    />
  );
}
