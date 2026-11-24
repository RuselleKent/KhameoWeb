import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import ReadyStep from '../../components/ReadyStep';
import { hasHostApplication } from '../../hostRules';

const CARDS = [
  { title: 'Start a solo session', description: 'Practice any scenario now.' },
  { title: 'Join a group', description: 'Use an invite code any time from Groups.' },
  { title: 'Check host status', description: 'See if your application was approved.', to: '/host-status' },
];

export default function ReadyPage() {
  const { user } = useAuth();

  if (!hasHostApplication(user)) return <Navigate to="/onboarding/host" replace />;
  return (
    <ReadyStep
      pathId="host"
      description="You can use Khameo now. Your host application is in review, and you can create groups after the Administrator approves you."
      cards={CARDS}
      profileTo="/onboarding/host/profile"
      tourTo="/onboarding/host/tour"
    />
  );
}
