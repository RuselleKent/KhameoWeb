import { useEffect, useRef, useState } from 'react';
import { checkUsername } from './onboarding.api';
import { MAX_USERNAME, USERNAME_PATTERN } from './profileRules';

const MAX_TRIES = 12;

/** "Jenny Angeles" → ['jenny', 'angeles']: lowercase, accents dropped, only letters and numbers. */
function nameWords(name) {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** `base` plus `suffix`, cut so the whole fits in MAX_USERNAME (trailing underscores dropped). */
function fit(base, suffix = '') {
  return base.slice(0, MAX_USERNAME - suffix.length).replace(/_+$/, '') + suffix;
}

/**
 * Usernames to try, in order, for a real name:
 * "Jenny Angeles" → jenny_angeles, jenny_angeles2, jennyangeles, jennyangeles2, jenny_angeles3 … jenny_angeles9,
 * jennyangeles3 … Every one matches USERNAME_PATTERN; empty when the name has no letters or numbers.
 */
export function usernameCandidates(name) {
  const words = nameWords(name);
  if (words.length === 0) return [];

  // Short names ("Al") get padded to reach the 3-character minimum: al_user.
  const pad = (base) => (base.length >= 3 ? base : `${base}_user`);
  // Long names that wouldn't fit use the first and last name (José María de la Cruz → jose_cruz).
  const fitting = words.join('_').length > MAX_USERNAME && words.length > 2 ? [words[0], words.at(-1)] : words;
  const underscored = pad(fitting.join('_'));
  const joined = pad(fitting.join(''));

  const candidates = [fit(underscored), fit(underscored, '2'), fit(joined), fit(joined, '2')];
  for (let n = 3; n <= 9; n += 1) candidates.push(fit(underscored, String(n)));
  for (let n = 3; n <= 9; n += 1) candidates.push(fit(joined, String(n)));

  return [...new Set(candidates)].filter((c) => USERNAME_PATTERN.test(c));
}

/**
 * Fills in a free username suggested from the real name, once, while the username field is still empty.
 * Tries usernameCandidates(name) one by one with the availability check and calls `onFound(username)` with
 * the first free one. Returns { searching, suggested }: `suggested` is the username it filled in.
 */
export function useUsernameSuggestion(name, username, onFound) {
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState(null);
  // Only when the field was empty on arrival; never over something the user typed. Fixed at mount, so
  // StrictMode's second effect run (after aborting the first) searches again.
  const [startedEmpty] = useState(!username);
  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  });

  useEffect(() => {
    if (!startedEmpty) return undefined;
    const candidates = usernameCandidates(name).slice(0, MAX_TRIES);
    if (candidates.length === 0) return undefined;

    const controller = new AbortController();
    (async () => {
      setSearching(true);
      for (const candidate of candidates) {
        try {
          const { available } = await checkUsername({ username: candidate, signal: controller.signal });
          if (controller.signal.aborted) return;
          if (available) {
            setSuggested(candidate);
            onFoundRef.current(candidate);
            break;
          }
        } catch {
          // The check failed (offline, server error): leave the field for the user.
          break;
        }
      }
      if (!controller.signal.aborted) setSearching(false);
    })();

    return () => controller.abort();
  }, [name, startedEmpty]);

  return { searching, suggested };
}
