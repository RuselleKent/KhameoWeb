import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { formatDuration, useCountdown } from '../../../lib/useCountdown';
import AuthLayout from '../components/AuthLayout';
import AuthSuccess from '../components/AuthSuccess';
import { forgotPassword, getErrorInfo } from '../auth.api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_WAIT_SECONDS = 300;

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';
const backLinkClass =
  'w-fit rounded text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const emailRef = useRef(null);

  // Pre-filled from the login page's "Forgot password?" link.
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generic, setGeneric] = useState(false);
  // { email, demoUrl } once the link is sent
  const [sent, setSent] = useState(null);
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [waitFor, restartWait] = useCountdown(0);

  const throttled = waitFor > 0;
  const emailLooksValid = EMAIL_PATTERN.test(email.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || throttled) return;

    if (!email.trim()) return failField('Enter your email.');
    if (!emailLooksValid) return failField('Enter a valid email address.');

    setSubmitting(true);
    setGeneric(false);
    try {
      const data = await forgotPassword({ email: email.trim() });
      setSent({ email: email.trim(), demoUrl: data.demo_reset_url });
    } catch (err) {
      const info = getErrorInfo(err);
      if (info.status === 429) {
        const seconds = info.retryAfter ?? DEFAULT_WAIT_SECONDS;
        setWaitMinutes(Math.max(1, Math.ceil(seconds / 60)));
        restartWait(seconds);
      } else {
        setGeneric(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function failField(message) {
    setError(message);
    emailRef.current?.focus();
  }

  if (sent) {
    return (
      <AuthLayout>
        <title>Check your inbox · Khameo</title>
        <AuthSuccess
          align="start"
          title="Check your inbox"
          description={`We sent a reset link to ${sent.email}. It works once and expires after a short time. Didn’t get it? Check spam.`}
        >
          {/* Only the mock API returns demoUrl; with the real API the link arrives by email. */}
          {sent.demoUrl && (
            <Button to={sent.demoUrl} size="block">
              Open reset link (demo)
            </Button>
          )}
          <Link
            to="/login"
            className="rounded-xl py-3.5 text-center text-sm font-semibold text-brand hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Back to log in
          </Link>
        </AuthSuccess>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <title>Forgot password · Khameo</title>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <Link to="/login" className={backLinkClass}>
          ← Back to log in
        </Link>

        <div>
          <h1 className="text-[32px] leading-[38px] text-ink">Forgot your password?</h1>
          <p className="mt-1.5 text-sm leading-[21px] text-muted">
            Enter your email and we’ll send you a link to reset it.
          </p>
        </div>

        <Input
          ref={emailRef}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          error={error}
          success={emailLooksValid}
        />

        {throttled && (
          <Alert variant="warning" icon={false} title="Too many requests">
            For your security, wait {waitMinutes} {waitMinutes === 1 ? 'minute' : 'minutes'} before asking for
            another link.
          </Alert>
        )}
        {generic && (
          <Alert variant="error" icon={false} title="Couldn’t send the link">
            Something went wrong on our side. Check your connection and try again.
          </Alert>
        )}

        <Button
          type="submit"
          size="block"
          disabled={throttled}
          loading={submitting}
          loadingText="Sending…"
        >
          {throttled ? `Send link in ${formatDuration(waitFor)}` : 'Send reset link'}
        </Button>

        <p className="text-center text-sm text-muted">
          Remembered it?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
