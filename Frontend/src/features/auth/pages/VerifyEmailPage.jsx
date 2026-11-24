import { useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import CodeInput from '../../../components/ui/CodeInput';
import FieldError from '../../../components/ui/FieldError';
import { formatDuration, useCountdown } from '../../../lib/useCountdown';
import AuthLayout from '../components/AuthLayout';
import AuthSuccess from '../components/AuthSuccess';
import { useAuth } from '../../../hooks/useAuth';
import { getErrorInfo, resendVerificationCode, verifyEmail } from '../auth.api';

// Used when the page is opened without timers from sign-up (e.g. after a reload).
const DEFAULT_TIMERS = { expires_in: 600, resend_in: 60 };

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';
const backLinkClass =
  'w-fit rounded text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const LOCKED_COPY = {
  expired: {
    title: 'This code has expired',
    body: 'Codes last 10 minutes. We’ll email you a new one right away.',
  },
  tooManyTries: {
    title: 'Too many tries',
    body: 'For your security, this code no longer works. We’ll email you a new one right away.',
  },
};

function StepDots() {
  return (
    <div className="flex justify-center gap-1.5">
      <span aria-hidden="true" className="h-1.5 w-6 rounded-full bg-brand" />
      <span aria-hidden="true" className="size-1.5 rounded-full bg-field" />
      <span aria-hidden="true" className="size-1.5 rounded-full bg-field" />
      <span className="sr-only">Step 1 of 3</span>
    </div>
  );
}

export default function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();
  // Sign-up passes the email; after a reload (or a login before verifying) it comes from the session.
  const email = location.state?.email ?? user?.email ?? searchParams.get('email') ?? '';
  const timers = location.state?.verification ?? DEFAULT_TIMERS;

  const codeRef = useRef(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  // null | 'expired' | 'tooManyTries' — set by the server; the expiry countdown can also expire it.
  const [locked, setLocked] = useState(null);
  // null | 'generic' | 'resent'
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [expiresIn, restartExpiry] = useCountdown(timers.expires_in);
  const [resendIn, restartResend] = useCountdown(timers.resend_in);

  const lockReason = locked ?? (expiresIn === 0 ? 'expired' : null);
  const complete = /^\d{6}$/.test(code);

  function handleCodeChange(next) {
    setCode(next);
    setCodeError(null);
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!complete || submitting || lockReason) return;

    setSubmitting(true);
    setNotice(null);
    try {
      const { user } = await verifyEmail({ email, code });
      setVerifiedUser(user);
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.code === 'code_invalid') {
        const left = info.attemptsLeft;
        setCodeError(`That code isn’t right. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`);
      } else if (info.code === 'code_expired') {
        setLocked('expired');
      } else if (info.code === 'too_many_attempts') {
        setLocked('tooManyTries');
      } else {
        setNotice('generic');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resending || resendIn > 0) return;

    setResending(true);
    setNotice(null);
    try {
      const next = await resendVerificationCode({ email });
      restartExpiry(next.expires_in);
      restartResend(next.resend_in);
      setCode('');
      setCodeError(null);
      setLocked(null);
      setNotice('resent');
      // The boxes may have been disabled; focus the first one once they're enabled again.
      requestAnimationFrame(() => codeRef.current?.querySelector('input')?.focus());
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 429 && info.retryAfter) restartResend(info.retryAfter);
      else setNotice('generic');
    } finally {
      setResending(false);
    }
  }

  if (verifiedUser) {
    const firstName = verifiedUser.name?.split(' ')[0];
    return (
      <AuthLayout>
        <title>Email verified · Khameo</title>
        <AuthSuccess
          title="Email verified"
          description={`You’re all set${firstName ? `, ${firstName}` : ''}. Next, tell us how you want to use Khameo.`}
        >
          {/* Storing the verified user lets the route guard move on to /onboarding (or /home).
              It waits for this click so the success screen stays visible until then. */}
          <Button size="block" onClick={() => setUser(verifiedUser)}>
            Continue
          </Button>
          <StepDots />
        </AuthSuccess>
      </AuthLayout>
    );
  }

  if (!email) {
    return (
      <AuthLayout>
        <title>Verify your email · Khameo</title>
        <h1 className="text-[32px] leading-[38px] text-ink">Check your email</h1>
        <Alert variant="info" className="mt-5">
          We couldn’t tell which email to verify. Log in and we’ll pick up where you left off.
        </Alert>
        <Button to="/login" size="block" className="mt-[18px]">
          Go to log in
        </Button>
      </AuthLayout>
    );
  }

  const resendControl =
    resendIn > 0 ? (
      <span>Resend in {formatDuration(resendIn)}</span>
    ) : (
      <button type="button" onClick={handleResend} disabled={resending} className={linkClass}>
        {resending ? 'Sending…' : 'Resend code'}
      </button>
    );

  return (
    <AuthLayout>
      <title>Verify your email · Khameo</title>

      <Link to="/signup" className={backLinkClass}>
        ← Back
      </Link>
      <h1 className="mt-8 text-[32px] leading-[38px] text-ink">Check your email</h1>
      <p className="mt-2 text-sm text-muted">
        We sent a 6-digit code to <span className="font-bold text-ink">{email}</span>.
      </p>

      {lockReason && (
        <Alert variant="error" icon={false} title={LOCKED_COPY[lockReason].title} className="mt-5">
          {LOCKED_COPY[lockReason].body}
        </Alert>
      )}
      {notice === 'generic' && (
        <Alert variant="error" icon={false} title="Something went wrong" className="mt-5">
          Check your connection and try again.
        </Alert>
      )}
      <p aria-live="polite" className="sr-only">
        {notice === 'resent' ? `We sent a new code to ${email}.` : ''}
      </p>

      <form noValidate onSubmit={handleVerify} className={lockReason ? 'mt-[18px]' : 'mt-5'}>
        <CodeInput
          ref={codeRef}
          // A dead code is shown as empty, greyed-out boxes (Figma "Expired code").
          value={lockReason ? '' : code}
          onChange={handleCodeChange}
          invalid={Boolean(codeError)}
          disabled={Boolean(lockReason)}
          autoFocus
          aria-describedby={codeError ? 'code-error' : 'code-status'}
        />

        {!lockReason &&
          (codeError ? (
            <>
              <FieldError id="code-error" className="mt-5">
                {codeError}
              </FieldError>
              <p className="mt-[18px] text-[13px] leading-[15px] text-muted">
                Make sure you used the newest code. {resendControl}
              </p>
            </>
          ) : (
            <>
              <div id="code-status" className="mt-5 flex justify-between gap-4 text-[13px] leading-[15px] text-muted">
                <p>Code expires in {formatDuration(expiresIn, { padMinutes: true })}</p>
                {resendControl}
              </div>
              <p className="mt-[18px] text-[13px] leading-[15px] text-muted">
                Can’t find it? Check your spam folder.
              </p>
            </>
          ))}

        {lockReason ? (
          <Button
            size="block"
            className="mt-[18px]"
            onClick={handleResend}
            disabled={resendIn > 0}
            loading={resending}
            loadingText="Sending…"
          >
            {resendIn > 0 ? `Send a new code in ${formatDuration(resendIn)}` : 'Send a new code'}
          </Button>
        ) : (
          <Button
            type="submit"
            size="block"
            className="mt-[18px]"
            disabled={!complete}
            loading={submitting}
            loadingText="Verifying…"
          >
            Verify email
          </Button>
        )}
      </form>

      <p className="mt-[18px] text-center text-sm text-muted">
        Wrong email?{' '}
        <Link to="/signup" state={{ email }} className={linkClass}>
          Change it
        </Link>
      </p>
    </AuthLayout>
  );
}
