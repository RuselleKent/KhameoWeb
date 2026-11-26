import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import GoogleButton from '../../../components/ui/GoogleButton';
import { GOOGLE_MOCK_OPTIONS, GOOGLE_USE_MOCK, getGoogleMockChoice, setGoogleMockChoice } from '../auth.api';
import AuthSuccess from './AuthSuccess';
import StepDots from './StepDots';

const linkClass = 'font-bold text-brand underline underline-offset-2 hover:text-brand-dark';
const backClass =
  'w-fit rounded text-sm font-semibold text-brand hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Google account row: photo (or first letter), name/email, optional "In use" pill. */
function AccountCard({ name, email, subtitle, avatarUrl, badge }) {
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-divider bg-white p-[15px] text-left">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" width="44" height="44" className="size-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E3F3F1] font-bold text-brand"
        >
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {name && <p className="truncate text-[15px] font-semibold text-ink">{name}</p>}
        <p className={name ? 'truncate text-[13px] text-muted' : 'truncate text-sm font-semibold text-ink'}>{email}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {badge && (
        <span className="shrink-0 rounded-[10px] bg-[#F4F4F4] px-4 py-2 text-[11px] font-semibold text-[#B84A0F]">
          {badge}
        </span>
      )}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className={backClass}>
      ← Back
    </button>
  );
}

function Heading({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[32px] leading-[1.2] text-ink">{title}</h1>
      {children && <p className="text-sm leading-[21px] text-muted">{children}</p>}
    </div>
  );
}

/** "Continue in the Google window" while the popup is open (Figma 1903-4049). */
function Waiting({ google }) {
  return (
    <div className="flex flex-col items-center gap-[18px] text-center">
      <title>Continue with Google · Khameo</title>
      <span
        aria-hidden="true"
        className="size-[74px] animate-spin rounded-full border-[5px] border-accent/25 border-t-accent motion-reduce:animate-none"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] leading-tight tracking-[-0.01em] text-ink">Continue in the Google window</h1>
        <p className="text-sm leading-[21px] text-muted">
          Choose the account you want to use. We never see your Google password.
        </p>
      </div>

      {google.blocked ? (
        <Alert
          variant="warning"
          icon={false}
          title="Popup blocked"
          className="w-full text-left"
          actions={
            <button type="button" onClick={() => google.start(google.intent)} className={`text-xs ${linkClass}`}>
              Open again
            </button>
          }
        >
          Your browser stopped the Google window. Allow popups for {window.location.host}, then open it again.
        </Alert>
      ) : (
        <ol className="flex w-full flex-col gap-3 rounded-xl border border-divider bg-white p-4 text-left text-[15px]">
          <li className="flex items-center gap-3 font-semibold text-ink">
            <span aria-hidden="true" className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[#E8E8E8] text-[13px] font-bold text-[#B84A0F]">
              ·
            </span>
            Choose your account in the Google window
          </li>
          <li className="flex items-center gap-3 text-muted">
            <span aria-hidden="true" className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[#EAEAEA] text-[13px] font-bold">
              ·
            </span>
            Come back here. We sign you in
          </li>
        </ol>
      )}

      <Button variant="secondary" size="block" onClick={google.reset}>
        Cancel
      </Button>
      {!google.blocked && (
        <p className="text-sm text-muted">
          Window didn’t open?{' '}
          <button type="button" onClick={() => google.start(google.intent)} className={linkClass}>
            Try again
          </button>
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {google.blocked ? 'The Google window was blocked.' : 'Waiting for the Google window.'}
      </p>
    </div>
  );
}

/** "Welcome, Jane" once the account is connected (Figma 1903-4141). */
function Connected({ google, onContinue }) {
  const { user } = google;
  const firstName = user.name?.split(' ')[0];
  const isNew = !user.onboarded_at;

  return (
    <AuthSuccess
      title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
      description="Your Google account is connected, and your email is already verified. No code needed."
    >
      <title>Welcome · Khameo</title>
      <AccountCard name={user.name} email={user.email} avatarUrl={user.avatar_url} />
      {isNew && (
        <p className="text-[13px] text-muted">
          We filled in your name and photo. No password needed. You can add one later in Settings.
        </p>
      )}
      <Button size="block" onClick={() => onContinue(user)}>
        Continue
      </Button>
      <p className="text-sm text-ink">
        Not you?{' '}
        <button type="button" onClick={() => google.restart()} className={linkClass}>
          Use a different Google account
        </button>
      </p>
      {isNew && <StepDots />}
    </AuthSuccess>
  );
}

/** "Google sign-in was cancelled" (Figma 1910-1239). */
function Cancelled({ google, page }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <title>Google sign-in cancelled · Khameo</title>
      <div className="flex flex-col gap-2">
        <BackButton onClick={google.reset} />
        <Heading title="Google sign-in was cancelled">
          You closed the Google window before choosing an account.
        </Heading>
      </div>
      <Alert variant="warning" icon={false} title="Nothing was changed">
        If a popup was blocked, allow popups for {window.location.host}, then try again.
      </Alert>
      <GoogleButton onClick={() => google.start(google.intent)} />
      {page === 'login' ? (
        <p className="text-center text-sm text-muted">
          New to Khameo?{' '}
          <Link to="/signup" className={linkClass}>
            Create account
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}

/** "That Google account isn’t registered", after trying to log in with it (Figma 1931-3378). */
function NotRegistered({ google, page }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-[18px]">
      <title>Google account not registered · Khameo</title>
      <div className="flex flex-col gap-[17px]">
        <BackButton onClick={google.reset} />
        <Heading title="That Google account isn’t registered">You don’t have a Khameo account yet.</Heading>
      </div>
      {google.email && <AccountCard email={google.email} subtitle="Google account" />}
      <p className="text-sm leading-[21px] text-muted">Create an account with it in one step. No password needed.</p>
      {/* Sign-up asks for the 18+ and Terms boxes before Google, so this goes there. */}
      <Button size="block" onClick={() => (page === 'signup' ? google.reset() : navigate('/signup'))}>
        Create account with Google
      </Button>
      <Button variant="secondary" size="block" onClick={() => google.restart('login')}>
        Use a different Google account
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => (page === 'login' ? google.reset() : navigate('/login'))}
          className={linkClass}
        >
          Log in with email
        </button>
      </p>
    </div>
  );
}

/** "This Google account is already in use", after trying to sign up with it (Figma 1931-3461). */
function AlreadyInUse({ google, page }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-[18px]">
      <title>Google account already in use · Khameo</title>
      <div className="flex flex-col gap-[17px]">
        <BackButton onClick={google.reset} />
        <Heading title="This Google account is already in use">
          It already has a Khameo account, so you don’t need a new one.
        </Heading>
      </div>
      {google.email && <AccountCard email={google.email} subtitle="Google account" badge="In use" />}
      <Button size="block" onClick={() => google.start('login')}>
        Log in with this Google account
      </Button>
      <Button variant="secondary" size="block" onClick={() => google.restart('signup')}>
        Try a different Google account
      </Button>
      <button
        type="button"
        onClick={() => (page === 'login' ? google.reset() : navigate('/login', { state: { email: google.email } }))}
        className={`mx-auto text-sm ${linkClass}`}
      >
        Log in with email instead
      </button>
    </div>
  );
}

/** Anything else (unknown status, getUser failed). */
function Failed({ google }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <title>Google sign-in · Khameo</title>
      <div className="flex flex-col gap-2">
        <BackButton onClick={google.reset} />
        <Heading title="Google sign-in didn’t work" />
      </div>
      <Alert variant="error" icon={false} title="Something went wrong">
        We couldn’t finish signing you in with Google. Check your connection and try again.
      </Alert>
      <Button size="block" onClick={() => google.start(google.intent)}>
        Try again
      </Button>
    </div>
  );
}

/**
 * The Google sign-in screens that replace the log in / sign-up form while `google.phase` isn't 'idle'.
 * `google` comes from useGoogleSignIn(); `page` is 'login' | 'signup'; `onContinue(user)` signs the user in.
 */
export default function GoogleFlow({ google, page, onContinue }) {
  switch (google.phase) {
    case 'waiting':
      return <Waiting google={google} />;
    case 'success':
      return <Connected google={google} onContinue={onContinue} />;
    case 'cancelled':
      return <Cancelled google={google} page={page} />;
    case 'not_registered':
      return <NotRegistered google={google} page={page} />;
    case 'already_in_use':
      return <AlreadyInUse google={google} page={page} />;
    default:
      return <Failed google={google} />;
  }
}

/** Dev only, while Google is mocked: pick what the mock popup answers. */
export function GoogleMockPicker() {
  const [choice, setChoice] = useState(getGoogleMockChoice);
  if (!import.meta.env.DEV || !GOOGLE_USE_MOCK) return null;

  return (
    <label className="mt-2 flex items-center justify-end gap-2 text-xs text-muted">
      <span>Dev · mock Google result</span>
      <select
        value={choice}
        onChange={(e) => {
          setChoice(e.target.value);
          setGoogleMockChoice(e.target.value);
        }}
        className="rounded-md border border-field bg-white px-1.5 py-1 text-xs text-ink"
      >
        {GOOGLE_MOCK_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
