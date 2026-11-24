import { Navigate } from 'react-router-dom';
import ProfileStep from '../../components/ProfileStep';
import { useOnboarding } from '../../useOnboarding';

export default function ProfilePage() {
  const { joined } = useOnboarding().answers;

  if (!joined.coach) return <Navigate to="/onboarding/coach" replace />;
  return (
    <ProfileStep
      pathId="coach"
      label={`Coach · ${joined.coach.invite.group.name}`}
      backTo="/onboarding/coach"
      nextTo="/onboarding/coach/ready"
    />
  );
}
