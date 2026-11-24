import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { getFieldErrors } from '../../../lib/apiErrors';
import { completeOnboarding } from '../onboarding.api';
import { isProfileComplete } from '../profileRules';
import { useOnboarding } from '../useOnboarding';

const PROFILE_PREFIX = 'profile.';

/**
 * Last step of every path. Any choice saves onboarding first, then opens `nextTo`.
 * - `description` and `cards` ([{ title, description }]) differ per path
 * - `profileTo` is that path's profile step, for when the API rejects something there
 * Saving sets onboarded_at; this route and the tour stay open after that (`afterOnboarding` in router.jsx).
 */
export default function ReadyStep({ pathId, description, cards, profileTo, nextTo }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { answers } = useOnboarding();
  const { profile } = answers;
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!user.onboarded_at && !isProfileComplete(profile)) return <Navigate to={profileTo} replace />;

  async function handleChoice() {
    if (saving) return;
    // Came back here after saving (browser Back).
    if (user.onboarded_at) {
      navigate(nextTo);
      return;
    }

    setSaving(true);
    setFailed(false);
    try {
      const saved = await completeOnboarding({
        path: pathId,
        goals: answers.goals,
        profile: {
          display_name: profile.display_name.trim(),
          username: profile.username,
          bio: profile.bio.trim() || null,
          occupation: profile.occupation.trim() || null,
        },
      });
      setUser(saved);
      navigate(nextTo);
    } catch (error) {
      // 'profile.username' → 'username', e.g. when someone took it since the check.
      const profileErrors = Object.fromEntries(
        Object.entries(getFieldErrors(error))
          .filter(([field]) => field.startsWith(PROFILE_PREFIX))
          .map(([field, message]) => [field.slice(PROFILE_PREFIX.length), message]),
      );
      if (Object.keys(profileErrors).length > 0) {
        navigate(profileTo, { state: { errors: profileErrors } });
        return;
      }
      setFailed(true);
      setSaving(false);
    }
  }

  const firstName = profile.display_name.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col items-center gap-6 text-center sm:pt-[30px]">
      <title>You’re ready · Khameo</title>

      <span
        aria-hidden="true"
        className="grid size-[72px] place-items-center rounded-full bg-accent-soft text-[30px] leading-none text-accent"
      >
        ★
      </span>
      <h1 className="text-[28px] leading-tight break-words text-ink sm:text-[36px]">
        You’re ready{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="text-[15px] leading-5 text-muted">{description}</p>

      <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            disabled={saving}
            onClick={handleChoice}
            className="flex flex-col gap-1.5 rounded-[14px] border border-field bg-white p-[18px] text-left transition-colors hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-[15px] leading-5 font-semibold text-ink">{card.title}</span>{' '}
            <span className="text-[13px] leading-[17px] text-muted">{card.description}</span>
          </button>
        ))}
      </div>

      {failed && (
        <Alert variant="error" icon={false} title="Something went wrong" className="w-full text-left">
          We couldn’t save your answers. Check your connection and try again.
        </Alert>
      )}

      <Button size="blockLg" loading={saving} loadingText="Saving…" onClick={handleChoice}>
        Go to my dashboard
      </Button>
      <Button variant="ghostBrand" size="text" disabled={saving} onClick={handleChoice}>
        Take the one-minute tour
      </Button>
      <p className="text-[13px] leading-[17px] text-muted">You can replay the tour any time from Settings.</p>
    </div>
  );
}
