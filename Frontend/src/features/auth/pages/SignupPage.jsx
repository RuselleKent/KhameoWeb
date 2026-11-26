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
import GoogleFlow, { GoogleMockPicker } from '../components/GoogleFlow';
import { useAuth } from '../../../hooks/useAuth';
import { getFieldErrors } from '../auth.api';
import { useGoogleSignIn } from '../useGoogleSignIn';
import { MIN_PASSWORD_LENGTH, getPasswordStrength } from '../passwordStrength';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';
const inlineLink = 'text-brand underline underline-offset-2 hover:text-brand-dark';

// API field name → form field name
const SERVER_FIELDS = {
  name: 'name',
  email: 'email',
  password: 'password',
  password_confirmation: 'confirm',
  confirmed_age: 'confirmedAge',
  accepted_terms: 'acceptedTerms',
};

function validate(v) {
  const errors = {};
  // Figma flags a single word ("Jane") with "Enter your full name.", so ask for first and last name.
  if (v.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Enter your full name.';
  if (!v.email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = 'Enter a valid email address.';
  if (v.password.length < MIN_PASSWORD_LENGTH) errors.password = 'Use at least 8 characters.';
  if (!v.confirm) errors.confirm = 'Re-enter your password.';
  else if (v.confirm !== v.password) errors.confirm = 'Passwords don’t match.';
  if (!v.confirmedAge) errors.confirmedAge = 'You must be 18 or older to use Khameo.';
  if (!v.acceptedTerms) errors.acceptedTerms = 'Please accept the terms to continue.';
  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, signIn } = useAuth();
  const emailRef = useRef(null);
  const google = useGoogleSignIn('signup');

  const [values, setValues] = useState({
    name: '',
    email: location.state?.email ?? '',
    password: '',
    confirm: '',
    confirmedAge: false,
    acceptedTerms: false,
  });
  // Client errors show once a field has been left (or a box unticked), so the user isn't
  // greeted with red while still typing.
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  // null | 'emailTaken' | 'generic'
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);
  const errorFor = (field) => serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined);
  const canSubmit =
    Object.keys(clientErrors).length === 0 && Object.keys(serverErrors).length === 0 && !submitting;

  const strength = getPasswordStrength(values.password);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setServerErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'email' && notice === 'emailTaken') setNotice(null);
  }

  const touch = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  function textProps(field) {
    return {
      value: values[field],
      onChange: (e) => update(field, e.target.value),
      onBlur: touch(field),
      error: errorFor(field),
    };
  }

  function checkboxProps(field) {
    return {
      checked: values[field],
      onChange: (e) => {
        update(field, e.target.checked);
        setTouched((prev) => ({ ...prev, [field]: true }));
      },
      error: errorFor(field),
    };
  }

  function switchToDifferentEmail() {
    update('email', '');
    setNotice(null);
    emailRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setNotice(null);

    try {
      const email = values.email.trim();
      const { verification } = await register({
        name: values.name.trim(),
        email,
        password: values.password,
        password_confirmation: values.confirm,
        confirmed_age: values.confirmedAge,
        accepted_terms: values.acceptedTerms,
      });
      // The verify page starts its expiry and resend timers from `verification`.
      navigate('/verify-email', { replace: true, state: { email, verification } });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const mapped = {};
      for (const [apiField, message] of Object.entries(fieldErrors)) {
        mapped[SERVER_FIELDS[apiField] ?? apiField] = message;
      }

      if (Object.keys(mapped).length === 0) {
        setNotice('generic');
      } else {
        setServerErrors(mapped);
        if (mapped.email) {
          setNotice('emailTaken');
          emailRef.current?.focus();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Google sign-up sends confirmed_age and accepted_terms too, so both boxes come first.
  const googleReady = values.confirmedAge && values.acceptedTerms;

  if (google.phase !== 'idle') {
    return (
      <AuthLayout>
        <GoogleFlow google={google} page="signup" onContinue={signIn} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <title>Create account · Khameo</title>

      <Link
        to="/welcome"
        className="rounded text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ← Back
      </Link>
      <h1 className="mt-2 text-[32px] leading-tight text-ink">Create your account</h1>
      <p className="mt-[5px] text-sm leading-[21px] text-muted">Free to start. Takes under a minute.</p>

      {notice === 'emailTaken' && (
        <Alert
          variant="warning"
          icon={false}
          title="You already have an account"
          className="mt-2"
          actions={
            <>
              <Link to="/login" state={{ email: values.email.trim() }} className={`text-xs ${linkClass}`}>
                Log in instead
              </Link>
              <Link to="/forgot-password" className={`text-xs ${linkClass}`}>
                Forgot password?
              </Link>
              <button type="button" onClick={switchToDifferentEmail} className={`text-xs ${linkClass}`}>
                Use a different email
              </button>
            </>
          }
        >
          Log in instead, or reset your password if you forgot it. You can also use a different email.
        </Alert>
      )}
      {notice === 'generic' && (
        <Alert variant="error" icon={false} title="Couldn’t create your account" className="mt-2">
          Something went wrong on our side. Check your connection and try again.
        </Alert>
      )}
      <GoogleButton
        className="mt-4"
        disabled={!googleReady}
        aria-describedby={googleReady ? undefined : 'google-hint'}
        onClick={() => google.start()}
      />
      {!googleReady && (
        <p id="google-hint" className="mt-2 text-center text-xs text-muted">
          Tick both boxes first
        </p>
      )}
      <GoogleMockPicker />
      <Divider className="mt-4" />

      <form noValidate onSubmit={handleSubmit} className="mt-4">
        <div className="flex flex-col gap-4">
          <Input label="Full name" autoComplete="name" placeholder="Jane Cruz" {...textProps('name')} />
          <Input
            ref={emailRef}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...textProps('email')}
          />
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            strength={strength.level}
            strengthLabel={strength.label}
            {...textProps('password')}
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Password must match"
            {...textProps('confirm')}
          />
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <Checkbox size="sm" {...checkboxProps('confirmedAge')}>
            I am 18 years old or older
          </Checkbox>
          <Checkbox size="sm" {...checkboxProps('acceptedTerms')}>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className={inlineLink}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className={inlineLink}>
              Privacy Policy
            </a>
            .
          </Checkbox>
        </div>

        <Button
          type="submit"
          size="block"
          className="mt-8"
          disabled={!canSubmit}
          loading={submitting}
          loadingText="Creating account…"
        >
          Create account
        </Button>

        <p className="mt-2 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
