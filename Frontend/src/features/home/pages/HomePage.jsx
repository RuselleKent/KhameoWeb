import Card from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import LogoutButton from '../../auth/components/LogoutButton';

// Placeholder until the home dashboard is designed and built.
export default function HomePage() {
  const { user } = useAuth();
  const firstName = user.name?.split(' ')[0];

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <title>Home · Khameo</title>
      <Card className="w-full max-w-[420px]">
        <h1 className="text-[32px] leading-tight text-ink">Hi{firstName ? `, ${firstName}` : ''}</h1>
        <p className="mt-2 text-sm leading-[21px] text-muted">
          You’re signed in as <span className="font-semibold text-ink">{user.email}</span>. Your dashboard is coming
          soon.
        </p>
        <LogoutButton size="block" className="mt-6" />
      </Card>
    </main>
  );
}
