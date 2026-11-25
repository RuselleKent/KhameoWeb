import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorInfo } from '../../../lib/apiErrors';
import TwoFactorCodeForm from '../../auth/components/TwoFactorCodeForm';
import TwoFactorScreen from '../../auth/components/TwoFactorScreen';
import { hasHostApplication } from '../hostRules';
import { confirmTwoFactor, sendTwoFactorCode } from '../onboarding.api';
import { useHostFlow } from '../useHostFlow';
import { useOnboarding } from '../useOnboarding';

/**
 * Turns two-factor on, in a host application. The code is emailed when the user asks for it (not on page
 * load, so a reload never sends another email). Then on to the proof: role proof or community proof.
 */
export default function TwoFactorPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { answers, updateHost } = useOnboarding();
  const { host } = answers;
  const { base, submittedTo, onboarding } = useHostFlow();
  // Cooldown of the code that was sent, in seconds; null until one is sent.
  const [resendIn, setResendIn] = useState(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const school = host.type === 'school';
  const backTo = school ? `${base}/school-email` : base;

  // Opened by URL without choosing the host path or finishing the step before.
  if (onboarding && answers.path !== 'host') return <Navigate to="/onboarding" replace />;
  if (hasHostApplication(user)) return <Navigate to={submittedTo} replace />;
  if (school && !host.school_code) return <Navigate to={`${base}/school-email`} replace />;

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

  // The application was refused (403 two_factor_required).
  const refusedNotice = host.needs_two_factor && (
    <Alert variant="warning" icon={false} title="Confirm two-factor to submit">
      Your application needs two-factor. Confirm it here, then submit again. Your answers and file are still there.
    </Alert>
  );

  if (user.two_factor_confirmed_at) {
    return (
      <TwoFactorScreen
        backTo={backTo}
        title="Two-factor is on"
        description="We’ll email you a code each time you log in. You can continue to the next step."
      >
        <Button size="block" onClick={() => navigate(`${base}/${school ? 'role-proof' : 'community-proof'}`)}>
          Continue
        </Button>
      </TwoFactorScreen>
    );
  }

  if (resendIn === null) {
    return (
      <TwoFactorScreen
        backTo={backTo}
        title="Confirm it’s you"
        description={<>Two-factor is required for verified Hosts. We’ll email a 6-digit code to {email}.</>}
      >
        {refusedNotice}
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
      backTo={backTo}
      title="Enter your 6-digit code"
      description={<>We emailed a code to {email}. Two-factor is required for verified Hosts.</>}
    >
      {refusedNotice}
      <TwoFactorCodeForm
        resendIn={resendIn}
        onResend={sendTwoFactorCode}
        onVerify={async (code) => {
          const confirmed = await confirmTwoFactor({ code });
          updateHost({ needs_two_factor: false });
          setResendIn(null);
          // Shows "Two-factor is on".
          setUser(confirmed);
        }}
      />
    </TwoFactorScreen>
  );
}
