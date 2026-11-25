import ProfileStep from '../../components/ProfileStep';
import { useOnboarding } from '../../useOnboarding';

export default function ProfilePage() {
  const { startedAs } = useOnboarding().answers;

  return (
    <ProfileStep
      pathId="personal"
      // Came here from "Not yet" on the member or coach path: Back returns to the invite code.
      backTo={startedAs ? `/onboarding/${startedAs}` : '/onboarding/personal'}
      nextTo="/onboarding/personal/ready"
    />
  );
}
