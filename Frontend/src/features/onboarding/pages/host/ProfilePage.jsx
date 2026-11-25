import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import ProfileStep from '../../components/ProfileStep';
import { hasHostApplication } from '../../hostRules';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!hasHostApplication(user)) return <Navigate to="/onboarding/host" replace />;
  return (
    <ProfileStep
      pathId="host"
      label="Host · verification in review"
      backTo="/onboarding/host/submitted"
      nextTo="/onboarding/host/ready"
    />
  );
}
