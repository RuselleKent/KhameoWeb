import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import CodeInput from '../../../components/ui/CodeInput';
import FieldError from '../../../components/ui/FieldError';
import { LOCKED_CODE_COPY, useCodeEntry } from '../../../lib/useCodeEntry';
import { formatDuration } from '../../../lib/useCountdown';

/**
 * Code boxes for an emailed two-factor code, with resend. Used at log in and when turning two-factor on.
 * Props: see useCodeEntry.
 */
export default function TwoFactorCodeForm(props) {
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
  } = useCodeEntry(props);

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
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
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <CodeInput
        ref={codeRef}
        label="Two-factor code"
        value={locked ? '' : code}
        onChange={changeCode}
        invalid={Boolean(codeError)}
        disabled={Boolean(locked)}
        autoFocus
        aria-describedby={codeError ? 'two-factor-error' : undefined}
      />
      {codeError && !locked && <FieldError id="two-factor-error">{codeError}</FieldError>}

      {locked ? (
        <Button size="block" onClick={resend} disabled={resendIn > 0} loading={sending} loadingText="Sending…">
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
                onClick={resend}
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
