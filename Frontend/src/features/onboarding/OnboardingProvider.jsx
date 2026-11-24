import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingContext } from './onboardingContext';

// path, goals and profile match the PATCH /api/user/onboarding body (docs/api-onboarding.md).
const EMPTY_ANSWERS = {
  consentSkipped: false, // picked "Not now" on the consent screen
  path: null,
  // The path they began on before "Not yet" switched them to personal ('member' | 'coach'), so Back still works.
  startedAs: null,
  // Groups joined in this onboarding, per path: { member: { invite, membership } }. Already saved by the API.
  joined: {},
  goals: [],
  // The photo is uploaded on its own (uploadAvatar), so it isn't kept here.
  profile: { display_name: '', username: '', bio: '', occupation: '' },
};

// v2: bumped when the profile fields changed, so older drafts are ignored.
// created_at keeps two accounts apart if a mock id is ever reused.
const storageKeyFor = (user) => `khameo.onboarding.v2.${user.id}.${user.created_at}`;

function readAnswers(key, user) {
  const initial = { ...EMPTY_ANSWERS, profile: { ...EMPTY_ANSWERS.profile, display_name: user.name ?? '' } };
  try {
    return { ...initial, ...JSON.parse(sessionStorage.getItem(key) ?? '{}') };
  } catch {
    return initial;
  }
}

/**
 * Keeps the onboarding answers while the user moves between steps (including Back and reload:
 * they are saved in this tab's sessionStorage). Nothing is sent to the API from here.
 *
 * Context value: { answers, updateAnswers }
 * - updateAnswers({ path: 'member' }) merges the given fields
 */
export default function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const storageKey = storageKeyFor(user);
  const [answers, setAnswers] = useState(() => readAnswers(storageKey, user));

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // Storage blocked: answers still survive Back, just not a reload.
    }
  }, [storageKey, answers]);

  const updateAnswers = useCallback((changes) => setAnswers((current) => ({ ...current, ...changes })), []);
  const value = useMemo(() => ({ answers, updateAnswers }), [answers, updateAnswers]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
