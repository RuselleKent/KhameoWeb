import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { resendLoginCode } from '../auth.api';
import TwoFactorCodeForm from '../components/TwoFactorCodeForm';
import TwoFactorScreen from '../components/TwoFactorScreen';

/**
 * Second step of a log in with two-factor on. LoginPage passes { email, from } in the location state;
 * once signed in, RedirectIfAuthenticated uses `from` to return to the page they wanted.
 */
export default function LoginVerifyPage() {
  const location = useLocation();
  const { loginTwoFactor } = useAuth();
  const [expired, setExpired] = useState(false);

  const { email, from } = location.state ?? {};

  // Opened by URL: there is no log in to finish.
  if (!email) return <Navigate to="/login" replace />;

  const loginState = { email, from };

  return (
    <TwoFactorScreen
      backTo="/login"
      backState={loginState}
      backLabel="Back to log in"
      title="Enter your 6-digit code"
      description={
        <>
          We emailed a code to <span className="font-bold break-words text-ink">{email}</span>. Two-factor sign-in is
          required for verified Hosts.
        </>
      }
    >
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
