import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import PasswordInput from '../../../components/ui/PasswordInput';
import { cn } from '../../../lib/utils';
import AuthLayout from '../components/AuthLayout';
import AuthSuccess from '../components/AuthSuccess';
import { useAuth } from '../../../hooks/useAuth';
import { getFieldErrors, resetPassword } from '../auth.api';
import { MIN_PASSWORD_LENGTH, getPasswordStrength } from '../passwordStrength';

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';

function requirementsFor(password) {
  return [
    { label: 'At least 8 characters', met: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'A mix of letters and numbers', met: /[A-Za-z]/.test(password) && /\d/.test(password) },
  ];
}

function RequirementList({ items }) {
  return (
    <ul className="flex flex-col gap-1.5 text-[13px]">
      {items.map(({ label, met }) => (
        <li key={label} className={cn('flex items-center gap-2', met ? 'text-success' : 'text-muted')}>
          <span
            aria-hidden="true"
            className={cn(
              'grid size-4 shrink-0 place-items-center rounded-full text-[11px] font-bold',
              met ? 'bg-success-soft' : 'bg-[#EAEAEA]',
            )}
          >
            {met ? <Check strokeWidth={3.5} className="size-2.5" /> : '·'}
          </span>
          {label}
          <span className="sr-only">{met ? '(done)' : '(not yet)'}</span>
        </li>
      ))}
    </ul>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-[32px] leading-[38px] text-ink">Set a new password</h1>
      <p className="mt-1.5 text-sm leading-[21px] text-muted">Choose one you haven’t used on Khameo before.</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  // null | 'linkExpired' | 'generic'
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // The signed-in user returned by the reset; set means "Password updated" is showing.
  const [resetUser, setResetUser] = useState(null);
  const { setUser } = useAuth();

  const requirements = requirementsFor(password);
  const strength = getPasswordStrength(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = requirements.every((r) => r.met) && confirm === password && !submitting;

  const confirmError = serverErrors.confirm ?? (confirmTouched && mismatch ? 'Passwords don’t match.' : undefined);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setNotice(null);
    setServerErrors({});
    try {
      const { user } = await resetPassword({ token, email, password, password_confirmation: confirm });
      setResetUser(user);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.token) setNotice('linkExpired');
      else if (fieldErrors.password || fieldErrors.password_confirmation) {
        setServerErrors({ password: fieldErrors.password, confirm: fieldErrors.password_confirmation });
      } else setNotice('generic');
    } finally {
      setSubmitting(false);
    }
  }

  if (resetUser) {
    return (
      <AuthLayout>
        <title>Password updated · Khameo</title>
        <AuthSuccess title="Password updated" description="Your password is updated. You’re signed in on this device.">
          {/* Storing the user lets the route guard take them to /home (or an unfinished step). */}
          <Button size="block" onClick={() => setUser(resetUser)}>
            Go to my dashboard
          </Button>
          <p className="text-sm text-muted">
            Didn’t do this?{' '}
            <Link to="/forgot-password" state={{ email }} className={linkClass}>
              Secure my account
            </Link>
          </p>
        </AuthSuccess>
      </AuthLayout>
    );
  }

  // Missing token/email (link copied wrong) or a link the server has already rejected.
  if (!token || !email || notice === 'linkExpired') {
    const expired = notice === 'linkExpired';
    return (
      <AuthLayout>
        <title>Reset password · Khameo</title>
        <div className="flex flex-col gap-[18px]">
          <Header />
          <Alert
            variant="error"
            icon={false}
            title={expired ? 'This reset link has expired' : 'This reset link isn’t valid'}
          >
            {expired
              ? 'Reset links work once and only for a short time. Ask for a new one.'
              : 'Open the newest link from your email, or ask for a new one.'}
          </Alert>
          <Button to="/forgot-password" state={{ email }} size="block">
            Get a new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <title>Reset password · Khameo</title>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <Header />

        {notice === 'generic' && (
          <Alert variant="error" icon={false} title="Couldn’t update your password">
            Something went wrong on our side. Check your connection and try again.
          </Alert>
        )}

        {/* Hidden username field helps password managers save the new password to the right account. */}
        <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />

        <PasswordInput
          label="New password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setServerErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={serverErrors.password}
          strength={strength.level}
          // The checklist below already says "At least 8 characters", so leave the empty meter unlabelled.
          strengthLabel={strength.level === 'none' ? '' : strength.label}
        />

        <RequirementList items={requirements} />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setServerErrors((prev) => ({ ...prev, confirm: undefined }));
          }}
          onBlur={() => setConfirmTouched(true)}
          error={confirmError}
        />

        <Button type="submit" size="block" disabled={!canSubmit} loading={submitting} loadingText="Updating…">
          Update password
        </Button>

        <p className="text-center text-xs text-muted">You’ll stay signed in on your other devices.</p>
      </form>
    </AuthLayout>
  );
}
