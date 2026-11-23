import { Navigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import LogoutButton from '../../auth/components/LogoutButton';

// Placeholder until the onboarding screens are designed and built.
export default function OnboardingPage() {
  const { user } = useAuth();

  // Already onboarded: nothing to do here.
  if (user.onboarded_at) return <Navigate to="/home" replace />;

  const firstName = user.name?.split(' ')[0];

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <title>Get started · Khameo</title>
      <Card className="w-full max-w-[420px]">
        <h1 className="text-[32px] leading-tight text-ink">Let’s set things up{firstName ? `, ${firstName}` : ''}</h1>
        <p className="mt-2 text-sm leading-[21px] text-muted">Onboarding is coming soon.</p>
        <LogoutButton size="block" className="mt-6" />
      </Card>
    </main>
  );
}
