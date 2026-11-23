import { useState } from 'react';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

/** Logs out; RequireAuth then sends the user to /login. */
export default function LogoutButton(props) {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} loading={busy} loadingText="Logging out…" {...props}>
      Log out
    </Button>
  );
}
