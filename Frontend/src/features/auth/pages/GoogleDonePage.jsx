import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import PageLoader from '../../../components/layout/PageLoader';
import { GOOGLE_MESSAGE_TYPE } from '../useGoogleSignIn';

/** The window that opened this popup, if it is still there and on our own origin. */
function sameOriginOpener() {
  const opener = window.opener;
  if (!opener || opener.closed) return null;
  try {
    // Reading location throws for a cross-origin opener.
    return opener.location.origin === window.location.origin ? opener : null;
  } catch {
    return null;
  }
}

/**
 * /auth/google/done?status=…[&email=…] — where Laravel's Google callback sends the popup.
 * Posts the result to the Khameo window that opened it (same origin only) and closes.
 * Opened without that window (popup turned into a tab, opener gone): goes to /login with the status.
 * Lives outside AuthProvider, so the popup doesn't load the session first.
 */
export default function GoogleDonePage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'error';
  const email = searchParams.get('email');
  // Decided once: whether there's a window to report back to.
  const [opener] = useState(sameOriginOpener);

  useEffect(() => {
    if (!opener) return;
    opener.postMessage({ type: GOOGLE_MESSAGE_TYPE, status, email }, window.location.origin);
    window.close();
  }, [opener, status, email]);

  if (!opener) {
    const params = new URLSearchParams({ google: status });
    if (email) params.set('email', email);
    return <Navigate to={`/login?${params}`} replace />;
  }
  return <PageLoader />;
}
