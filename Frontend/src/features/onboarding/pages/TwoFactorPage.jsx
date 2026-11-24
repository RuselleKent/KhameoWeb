import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorInfo } from '../../../lib/apiErrors';
import TwoFactorCodeForm from '../../auth/components/TwoFactorCodeForm';
import TwoFactorScreen from '../../auth/components/TwoFactorScreen';
import { confirmTwoFactor, sendTwoFactorCode } from '../onboarding.api';
import { useOnboarding } from '../useOnboarding';

const NEXT_STEP = '/onboarding/host/role-proof';

/**
 * Turns two-factor on: host path, before Role proof. The code is emailed when the user asks for it
 * (not on page load, so a reload never sends another email).
 */
export default function TwoFactorPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { answers } = useOnboarding();
  // Cooldown of the code that was sent, in seconds; null until one is sent.
  const [resendIn, setResendIn] = useState(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Opened by URL without choosing the host path first.
  if (answers.path !== 'host') return <Navigate to="/onboarding" replace />;

  async function handleFirstSend() {
    setSending(true);
    setFailed(false);
    try {
      const { resend_in } = await sendTwoFactorCode();
      setResendIn(resend_in);
    } catch (error) {
      const info = getErrorInfo(error);
      // 429: a code went out moments ago (e.g. before going Back), so let the user enter it.
      if (info.status === 429 && info.retryAfter) setResendIn(info.retryAfter);
      else setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const email = <span className="font-bold break-words text-ink">{user.email}</span>;

  if (user.two_factor_confirmed_at) {
    return (
      <TwoFactorScreen
        backTo="/onboarding/host"
        title="Two-factor is on"
        description="We’ll email you a code each time you log in. You can continue to the next step."
      >
        <Button size="block" onClick={() => navigate(NEXT_STEP)}>
          Continue
        </Button>
      </TwoFactorScreen>
    );
  }

  if (resendIn === null) {
    return (
      <TwoFactorScreen
        backTo="/onboarding/host"
        title="Confirm it’s you"
        description={<>Two-factor is required for verified Hosts. We’ll email a 6-digit code to {email}.</>}
      >
        {failed && (
          <Alert variant="error" icon={false} title="Something went wrong">
            Check your connection and try again.
          </Alert>
        )}
        <Button size="block" onClick={handleFirstSend} loading={sending} loadingText="Sending…">
          Email me a code
        </Button>
      </TwoFactorScreen>
    );
  }

  return (
    <TwoFactorScreen
      backTo="/onboarding/host"
      title="Enter your 6-digit code"
      description={<>We emailed a code to {email}. Two-factor is required for verified Hosts.</>}
    >
      <TwoFactorCodeForm
        resendIn={resendIn}
        onResend={sendTwoFactorCode}
        onVerify={async (code) => {
          setUser(await confirmTwoFactor({ code }));
          navigate(NEXT_STEP);
        }}
      />
    </TwoFactorScreen>
  );
}
