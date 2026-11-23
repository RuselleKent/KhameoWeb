import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import Divider from '../../../components/ui/Divider';
import GoogleButton from '../../../components/ui/GoogleButton';
import Input from '../../../components/ui/Input';
import PasswordInput from '../../../components/ui/PasswordInput';
import AuthLayout from '../components/AuthLayout';
import { getFieldErrors, login } from '../auth.api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCKOUT_HINT = 'After 5 failed tries, log in pauses for 15 minutes.';

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';

function without(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Pre-filled when arriving from sign-up's "Log in instead".
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  // Which message box shows above the Google button: null | 'noAccount' | 'throttled' | 'generic' | 'google'
  const [notice, setNotice] = useState(null);
  // After a wrong-password reply we know the email exists: show its green "confirmed" border.
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setErrors((prev) => without(prev, 'email'));
    setEmailConfirmed(false);
    if (notice === 'noAccount') setNotice(null);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setErrors((prev) => without(prev, 'password'));
    setWrongPassword(false);
  }

  function tryAnotherEmail() {
    setEmail('');
    setErrors({});
    setNotice(null);
    emailRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const clientErrors = validate({ email, password });
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      (clientErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});
    setNotice(null);
    setWrongPassword(false);

    try {
      await login({ email: email.trim(), password, remember });
      // TODO: store the user in auth state and send them to the dashboard once those exist.
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);

      if (fieldErrors.email) {
        setErrors({ email: fieldErrors.email });
        setNotice('noAccount');
        emailRef.current?.focus();
      } else if (fieldErrors.password) {
        setErrors({ password: fieldErrors.password });
        setEmailConfirmed(true);
        setWrongPassword(true);
        passwordRef.current?.focus();
      } else if (error?.response?.status === 429) {
        setNotice('throttled');
      } else {
        setNotice('generic');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <title>Log in · Khameo</title>

      <Link
        to="/welcome"
        className="rounded text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ← Back
      </Link>
      <h1 className="mt-1 text-[32px] leading-tight text-ink">Welcome back</h1>
      <p className="mt-1 text-sm leading-[21px] text-muted">Log in to keep practicing.</p>

      {notice === 'noAccount' && (
        <Alert
          variant="error"
          icon={false}
          title="No account found"
          className="mt-4"
          actions={
            <>
              <Link to="/signup" state={{ email: email.trim() }} className={`text-xs ${linkClass}`}>
                Create account
              </Link>
              <button type="button" onClick={tryAnotherEmail} className={`text-xs ${linkClass}`}>
                Try another email
              </button>
            </>
          }
        >
          Check the spelling, or create a new account
        </Alert>
      )}
      {notice === 'throttled' && (
        <Alert variant="error" icon={false} title="Too many tries" className="mt-4">
          Log in is paused for 15 minutes. Try again later, or reset your password.
        </Alert>
      )}
      {notice === 'generic' && (
        <Alert variant="error" icon={false} title="Couldn’t log in" className="mt-4">
          Something went wrong on our side. Check your connection and try again.
        </Alert>
      )}
      {notice === 'google' && (
        <Alert variant="info" className="mt-4">
          Google sign-in isn’t available yet. Log in with your email and password for now.
        </Alert>
      )}

      <div className={notice ? 'mt-4' : 'mt-8'}>
        <GoogleButton onClick={() => setNotice('google')} />
        <Divider className="my-2" />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <Input
            ref={emailRef}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
            success={emailConfirmed}
          />

          <div className="flex flex-col">
            <PasswordInput
              ref={passwordRef}
              label="Password"
              autoComplete="current-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={handlePasswordChange}
              error={errors.password}
              hint={wrongPassword ? LOCKOUT_HINT : undefined}
            />
            <Link
              to="/forgot-password"
              className="mt-2 self-end rounded text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink"
            >
              Forgot password?
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Checkbox
              className="px-1"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            >
              Keep me signed in
            </Checkbox>

            <Button type="submit" size="block" loading={submitting} loadingText="Logging in…">
              Log in
            </Button>

            <p className="text-center text-sm text-muted">
              New to Khameo?{' '}
              <Link to="/signup" className={linkClass}>
                Create account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
