import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../../../../components/ui/Alert';
import Button from '../../../../components/ui/Button';
import CodeInput from '../../../../components/ui/CodeInput';
import FieldError from '../../../../components/ui/FieldError';
import Input from '../../../../components/ui/Input';
import { getErrorInfo, getFieldErrors } from '../../../../lib/apiErrors';
import { LOCKED_CODE_COPY, useCodeEntry } from '../../../../lib/useCodeEntry';
import { formatDuration } from '../../../../lib/useCountdown';
import StepActions from '../../components/StepActions';
import StepHeading from '../../components/StepHeading';
import { schoolEmailError } from '../../hostRules';
import { hostStepNote } from '../../hostSteps';
import { sendSchoolEmailCode, verifySchoolEmail } from '../../onboarding.api';
import { useHostFlow } from '../../useHostFlow';
import { useOnboarding } from '../../useOnboarding';

/** "Code sent to …", the code boxes and Verify email. */
function SchoolEmailCode({ email, resendIn: initialResendIn, backTo, onVerified }) {
  const {
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
  } = useCodeEntry({
    resendIn: initialResendIn,
    onResend: () => sendSchoolEmailCode({ school_email: email }),
    onVerify: async (value) => {
      await verifySchoolEmail({ school_email: email, code: value });
      onVerified(value);
    },
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-[14px] border border-[#B9D9D2] bg-brand-soft px-[18px] py-4">
        <p className="text-[15px] leading-5 font-semibold break-words text-ink">Code sent to {email}</p>
        <p className="mt-[3px] text-[13px] leading-[17px] text-muted">
          Check your inbox.{' '}
          {!locked &&
            (resendIn > 0 ? (
              `You can resend in ${formatDuration(resendIn)}.`
            ) : (
              <button
                type="button"
                onClick={resend}
                disabled={sending}
                className="font-bold text-brand underline underline-offset-2 hover:text-brand-dark"
              >
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            ))}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {locked && (
        <Alert variant="error" icon={false} title={LOCKED_CODE_COPY[locked].title}>
          {LOCKED_CODE_COPY[locked].body}
        </Alert>
      )}
      {failed && (
        <Alert variant="error" icon={false} title="Something went wrong">
          Check your connection and try again.
        </Alert>
      )}

      <div className="flex flex-col gap-2.5">
        <p className="text-[15px] leading-5 font-semibold text-ink">Enter the 6-digit code</p>
        <CodeInput
          ref={codeRef}
          label="School email code"
          value={locked ? '' : code}
          onChange={changeCode}
          invalid={Boolean(codeError)}
          disabled={Boolean(locked)}
          autoFocus
          aria-describedby={codeError ? 'school-code-error' : undefined}
          className="max-w-[420px]"
        />
        {codeError && !locked && <FieldError id="school-code-error">{codeError}</FieldError>}
      </div>

      {locked ? (
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" to={backTo} className="shrink-0">
            Back
          </Button>
          <Button size="blockLgWrap" onClick={resend} disabled={resendIn > 0} loading={sending} loadingText="Sending…">
            {resendIn > 0 ? `Send a new code in ${formatDuration(resendIn)}` : 'Send a new code'}
          </Button>
        </div>
      ) : (
        <StepActions
          backTo={backTo}
          continueLabel="Verify email"
          continueDisabled={!complete}
          loading={submitting}
          loadingText="Verifying…"
        />
      )}
    </form>
  );
}

export default function SchoolEmailPage() {
  const navigate = useNavigate();
  const { answers, updateHost } = useOnboarding();
  const { host } = answers;
  const { base } = useHostFlow();
  const email = host.school_email.trim();

  const [error, setError] = useState(host.school_email_error);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  // { email, resendIn } of the code that was sent.
  const [sent, setSent] = useState(null);

  // Community hosts skip this step.
  if (host.type !== 'school') return <Navigate to={base} replace />;

  const verified = Boolean(host.school_code);

  function handleEmailChange(e) {
    // A different email has to be verified again.
    updateHost({ school_email: e.target.value, school_code: null, school_email_error: null });
    setSent(null);
    setError(null);
    setFailed(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (sending) return;
    if (verified) {
      navigate(`${base}/two-factor`);
      return;
    }

    const formatError = schoolEmailError(email);
    if (formatError) {
      setError(formatError);
      return;
    }

    setSending(true);
    setError(null);
    setFailed(false);
    try {
      const { resend_in } = await sendSchoolEmailCode({ school_email: email });
      setSent({ email, resendIn: resend_in });
    } catch (err) {
      const info = getErrorInfo(err);
      const message = getFieldErrors(err).school_email;
      if (message) setError(message);
      // A code went out moments ago (e.g. before going Back): let the user enter it.
      else if (info.status === 429 && info.retryAfter) setSent({ email, resendIn: info.retryAfter });
      else setFailed(true);
    } finally {
      setSending(false);
    }
  }

  function handleVerified(code) {
    updateHost({ school_email: email, school_code: code, school_email_error: null });
    navigate(`${base}/two-factor`);
  }

  return (
    <div className="flex flex-col gap-6">
      <title>Verify your school email · Khameo</title>

      <StepHeading
        pathId="host"
        note={hostStepNote(host.type, 'School email')}
        title="Verify your school email"
        description="Use your school or organization email. Free providers like Gmail or Yahoo can’t verify an institution."
      />

      <form noValidate onSubmit={handleSend} className="flex flex-col gap-6">
        <Input
          label="Institutional email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@school.edu.ph"
          disabled={sending}
          value={host.school_email}
          onChange={handleEmailChange}
          error={error}
          success={verified}
          suffix={verified ? '✓ Verified' : sent ? '✓ Domain accepted' : undefined}
        />
        {failed && (
          <Alert variant="error" icon={false} title="Something went wrong">
            Check your connection and try again.
          </Alert>
        )}
        {(verified || !sent) && (
          <StepActions
            backTo={base}
            continueLabel={verified ? 'Continue' : 'Send code'}
            continueDisabled={!email}
            loading={sending}
            loadingText="Sending…"
          />
        )}
      </form>

      {!verified && sent && (
        <SchoolEmailCode
          key={sent.email}
          email={sent.email}
          resendIn={sent.resendIn}
          backTo={base}
          onVerified={handleVerified}
        />
      )}
    </div>
  );
}
