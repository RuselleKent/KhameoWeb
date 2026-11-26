import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { LOGIN_CODE_IS_MOCK, cancelLogin, resendLoginCode } from '../auth.api';
import TwoFactorCodeForm from '../components/TwoFactorCodeForm';
import TwoFactorScreen from '../components/TwoFactorScreen';

/**
 * Second step of every email log in: the emailed 6-digit code. LoginPage passes { email, from, verification }
 * in the location state; once signed in, RedirectIfAuthenticated sends the user to `from` or their next step.
 */
export default function LoginVerifyPage() {
  const location = useLocation();
  const { loginTwoFactor } = useAuth();
  const [expired, setExpired] = useState(false);

  const { email, from, verification } = location.state ?? {};
  // Counted from when the code was sent, so a reload doesn't restart the cooldown.
  const [initialResendIn] = useState(() => {
    const elapsed = verification?.sent_at ? Math.floor((Date.now() - verification.sent_at) / 1000) : 0;
    return Math.max(0, (verification?.resend_in ?? 60) - elapsed);
  });

  // Opened by URL: there is no log in to finish.
  if (!email) return <Navigate to="/login" replace />;

  const loginState = { email, from };

  return (
    <TwoFactorScreen
      backTo="/login"
      backState={loginState}
      backLabel="Back to log in"
      onBack={() => cancelLogin()}
      title="Enter your 6-digit code"
      description={
        <>
          We emailed a code to <span className="font-bold break-words text-ink">{email}</span> to make sure it’s you.
          It expires in 10 minutes.
        </>
      }
    >
      {import.meta.env.DEV && LOGIN_CODE_IS_MOCK && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted">Dev · the log in code is mocked: use 123456.</p>
      )}
      {expired ? (
        <>
          <Alert variant="error" icon={false} title="This log in has expired">
            Enter your email and password again to get a new code.
          </Alert>
          <Button to="/login" state={loginState} size="block">
            Log in again
          </Button>
        </>
      ) : (
        <TwoFactorCodeForm
          onVerify={(code) => loginTwoFactor({ code })}
          onResend={resendLoginCode}
          resendIn={initialResendIn}
          onError={(info) => {
            if (info.code !== 'login_expired') return false;
            setExpired(true);
            return true;
          }}
        />
      )}
    </TwoFactorScreen>
  );
}
