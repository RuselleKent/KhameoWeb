import { useRef, useState } from 'react';
import { getErrorInfo } from './apiErrors';
import { useCountdown } from './useCountdown';

/** Title and text for a code that can't be used any more; keys are the `locked` values below. */
export const LOCKED_CODE_COPY = {
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
 * State of a form that checks an emailed 6-digit code, with resend.
 * - `onVerify(code)` and `onResend()` call the API; onResend resolves with { resend_in }
 * - `onError(info)` may return true to say the page handled that error itself
 * - `resendIn` is the cooldown to start with, in seconds
 */
export function useCodeEntry({ onVerify, onResend, onError, resendIn: initialResendIn = 60 }) {
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

  function changeCode(next) {
    setCode(next);
    setCodeError(null);
  }

  async function resend() {
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

  async function submit(e) {
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

  return {
    codeRef,
    code,
    changeCode,
    codeError,
    locked,
    failed,
    announcement,
    sending,
    submitting,
    resendIn,
    complete,
    resend,
    submit,
  };
}
