import { useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import { MAX_BIO, MAX_DISPLAY_NAME, MAX_OCCUPATION, MAX_USERNAME, MESSAGES } from '../profileRules';
import { useOnboarding } from '../useOnboarding';
import { useUsernameCheck } from '../useUsernameCheck';
import ProfilePhoto from './ProfilePhoto';
import StepActions from './StepActions';
import StepHeading from './StepHeading';

/**
 * "Set up your profile", shared by every path.
 * - `pathId` sets the pill; `backTo` and `nextTo` are the routes around this step
 * The answers stay in OnboardingProvider; ReadyStep sends them. If it gets errors back it returns here
 * with them in the location state: { errors: { username: '…' } }.
 */
export default function ProfileStep({ pathId, backTo, nextTo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const id = useId();
  const { answers, updateAnswers } = useOnboarding();
  const { profile } = answers;

  const [serverErrors, setServerErrors] = useState(location.state?.errors ?? {});
  const [touched, setTouched] = useState({});
  const usernameStatus = useUsernameCheck(profile.username);

  const nameMissing = !profile.display_name.trim();
  // A failed check doesn't block: the API checks again when onboarding is sent.
  const canContinue = !nameMissing && (usernameStatus === 'available' || usernameStatus === 'error');

  function setField(field, value) {
    updateAnswers({ profile: { ...profile, [field]: value } });
    setServerErrors((errors) => ({ ...errors, [field]: undefined }));
  }

  const touch = (field) => setTouched((fields) => ({ ...fields, [field]: true }));

  function usernameError() {
    if (usernameStatus === 'taken') return MESSAGES.usernameTaken;
    // Wait for the user to finish before complaining about the length; wrong characters show right away.
    if (usernameStatus === 'invalid' && (touched.username || /\W/.test(profile.username))) return MESSAGES.usernameFormat;
    if (usernameStatus === 'empty' && touched.username) return MESSAGES.usernameFormat;
    return usernameStatus === 'available' ? undefined : serverErrors.username;
  }

  const usernameHint = {
    checking: 'Checking…',
    available: `@${profile.username} is available.`,
    error: 'We couldn’t check this username right now. You can still continue.',
  }[usernameStatus];

  function handleSubmit(e) {
    e.preventDefault();
    if (canContinue) navigate(nextTo);
    else setTouched({ username: true, display_name: true });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>Set up your profile · Khameo</title>

      <StepHeading
        pathId={pathId}
        title="Set up your profile"
        description="This is how you appear in groups and lobbies. It also pre-fills your practice sessions."
      />

      <ProfilePhoto name={profile.display_name} />

      <Input
        label="Username"
        prefix="@"
        placeholder="jane_cruz"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={MAX_USERNAME + 1}
        value={profile.username}
        // People often type or paste the @ too.
        onChange={(e) => setField('username', e.target.value.replace(/[@\s]/g, '').slice(0, MAX_USERNAME))}
        onBlur={() => touch('username')}
        error={usernameError()}
        success={usernameStatus === 'available'}
        aria-describedby={`${id}-username-status`}
      >
        <p
          id={`${id}-username-status`}
          aria-live="polite"
          className={
            usernameHint
              ? `mt-1.5 text-xs ${usernameStatus === 'available' ? 'text-success' : 'text-muted'}`
              : 'sr-only'
          }
        >
          {usernameHint ?? (usernameStatus === 'taken' ? MESSAGES.usernameTaken : '')}
        </p>
      </Input>

      <Input
        label="Display name"
        placeholder="Jane Cruz"
        autoComplete="name"
        maxLength={MAX_DISPLAY_NAME}
        value={profile.display_name}
        onChange={(e) => setField('display_name', e.target.value)}
        onBlur={() => touch('display_name')}
        error={nameMissing && touched.display_name ? MESSAGES.displayName : serverErrors.display_name}
      />

      <Input
        label="Bio (optional)"
        labelAction={
          <span className="text-xs text-muted">
            {profile.bio.length}/{MAX_BIO}
          </span>
        }
        placeholder="Tell others a little about you"
        maxLength={MAX_BIO}
        value={profile.bio}
        onChange={(e) => setField('bio', e.target.value)}
        error={serverErrors.bio}
      />

      <div className="rounded-xl border border-field bg-[#FAF9F6] p-5">
        <Input
          label="Occupation (optional)"
          placeholder="Student"
          autoComplete="organization-title"
          maxLength={MAX_OCCUPATION}
          value={profile.occupation}
          onChange={(e) => setField('occupation', e.target.value)}
          error={serverErrors.occupation}
          hint="Tells Khameo who you speak as, so feedback fits your goals."
        />
      </div>

      <p className="text-[13.5px] leading-[18px] text-muted">You can change these in Settings.</p>

      <StepActions backTo={backTo} continueDisabled={!canContinue} />
    </form>
  );
}
