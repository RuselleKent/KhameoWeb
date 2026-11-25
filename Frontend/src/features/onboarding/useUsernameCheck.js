import { useEffect, useState } from 'react';
import { checkUsername } from './onboarding.api';
import { USERNAME_PATTERN } from './profileRules';

const DEBOUNCE_MS = 400;

/**
 * Live availability of a username, checked 400 ms after typing stops.
 * Returns 'empty' | 'invalid' | 'checking' | 'available' | 'taken' | 'error' (the check itself failed).
 */
export function useUsernameCheck(username) {
  // The last answer, and which username it was for.
  const [result, setResult] = useState({ username: null, status: null });
  const valid = USERNAME_PATTERN.test(username);

  useEffect(() => {
    if (!valid) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let status;
      try {
        const { available } = await checkUsername({ username, signal: controller.signal });
        status = available ? 'available' : 'taken';
      } catch {
        status = 'error';
      }
      // Ignore an answer for something the user has since changed.
      if (!controller.signal.aborted) setResult({ username, status });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [username, valid]);

  if (!username) return 'empty';
  if (!valid) return 'invalid';
  return result.username === username ? result.status : 'checking';
}
