import { Navigate } from 'react-router-dom';
import ProfileStep from '../../components/ProfileStep';
import { groupLabel } from '../../groupLabel';
import { useOnboarding } from '../../useOnboarding';

export default function ProfilePage() {
  const { joined } = useOnboarding().answers;

  if (!joined.member) return <Navigate to="/onboarding/member" replace />;
  return (
    <ProfileStep
      pathId="member"
      label={`Member · ${groupLabel(joined.member.invite.group)}`}
      backTo="/onboarding/member"
      nextTo="/onboarding/member/ready"
    />
  );
}
