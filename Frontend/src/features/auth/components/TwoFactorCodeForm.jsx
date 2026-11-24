import { useRef, useState } from 'react';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import CodeInput from '../../../components/ui/CodeInput';
import FieldError from '../../../components/ui/FieldError';
import { getErrorInfo } from '../../../lib/apiErrors';
import { formatDuration, useCountdown } from '../../../lib/useCountdown';

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

/**
 * Code boxes for an emailed two-factor code, with resend. Used at log in and when turning two-factor on.
 * - `onVerify(code)` and `onResend()` call the API; onResend resolves with { resend_in }
 * - `onError(info)` may return true to say the page handled that error itself
 * - `resendIn` is the cooldown to start with, in seconds
 */
export default function TwoFactorCodeForm({ onVerify, onResend, onError, resendIn: initialResendIn = 60 }) {
  const codeRef = useRef(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  // null | 'expired' | 'tooManyTries'
  const [locked, setLocked] = useState(null);
  const [failed, setFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, restartResend] = useCountdown(initialResendIn);

  const complete = /^\d{6}$/.test(code);

  async function handleResend() {
    if (sending || resendIn > 0) return;

    setSending(true);
    setFailed(false);
    setAnnouncement('');
    try {
      const { resend_in } = await onResend();
      restartResend(resend_in);
      setCode('');
      setCodeError(null);
      setLocked(null);
      setAnnouncement('We sent a new code.');
      // The boxes may have been disabled; focus the first one once they're enabled again.
      requestAnimationFrame(() => codeRef.current?.querySelector('input')?.focus());
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.status === 429 && info.retryAfter) restartResend(info.retryAfter);
      else if (!onError?.(info)) setFailed(true);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!complete || submitting || locked) return;

    setSubmitting(true);
    setFailed(false);
    try {
      await onVerify(code);
    } catch (error) {
      const info = getErrorInfo(error);
      if (info.code === 'code_invalid') {
        const left = info.attemptsLeft;
        setCodeError(`That code isn’t right. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`);
      } else if (info.code === 'code_expired') {
        setLocked('expired');
      } else if (info.code === 'too_many_attempts') {
        setLocked('tooManyTries');
      } else if (!onError?.(info)) {
        setFailed(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {locked && (
        <Alert variant="error" icon={false} title={LOCKED_COPY[locked].title}>
          {LOCKED_COPY[locked].body}
        </Alert>
      )}
      {failed && (
        <Alert variant="error" icon={false} title="Something went wrong">
          Check your connection and try again.
        </Alert>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <CodeInput
        ref={codeRef}
        label="Two-factor code"
        value={locked ? '' : code}
        onChange={(next) => {
          setCode(next);
          setCodeError(null);
        }}
        invalid={Boolean(codeError)}
        disabled={Boolean(locked)}
        autoFocus
        aria-describedby={codeError ? 'two-factor-error' : undefined}
      />
      {codeError && !locked && <FieldError id="two-factor-error">{codeError}</FieldError>}

      {locked ? (
        <Button size="block" onClick={handleResend} disabled={resendIn > 0} loading={sending} loadingText="Sending…">
          {resendIn > 0 ? `Send a new code in ${formatDuration(resendIn)}` : 'Send a new code'}
        </Button>
      ) : (
        <>
          <Button type="submit" size="block" disabled={!complete} loading={submitting} loadingText="Verifying…">
            Verify and continue
          </Button>
          <p className="text-xs leading-[1.5] text-muted">
            Can’t find it? Check your spam folder.{' '}
            {resendIn > 0 ? (
              <span>Resend in {formatDuration(resendIn)}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className="font-bold text-brand underline underline-offset-2 hover:text-brand-dark"
              >
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </p>
        </>
      )}
    </form>
  );
}
