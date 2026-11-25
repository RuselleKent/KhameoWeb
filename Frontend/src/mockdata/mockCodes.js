// Emailed 6-digit codes for the mock APIs (verify email, two-factor, two-factor log in, school email).
//   123456 is correct; 000000 acts as an expired code; 3 wrong tries locks it
//   codes expire after 10 minutes; a new one can be sent 60 seconds after the last
import { rateLimitError, validationError } from './mockServer';

const CORRECT_CODE = '123456';
const EXPIRED_CODE = '000000';
const CODE_TTL_SECONDS = 600;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODE_ATTEMPTS = 3;

/** A separate set of codes, keyed by email. */
export function createMockCodes() {
  const codes = new Map(); // email → { attemptsLeft, expiresAt, resendAt }

  return {
    has: (email) => codes.has(email),

    /** Sends a code (replacing any old one). With `force`, ignores the cooldown. */
    send(email, { cooldown = RESEND_COOLDOWN_SECONDS, force = false } = {}) {
      const now = Date.now();
      const current = codes.get(email);
      if (!force && current && now < current.resendAt) {
        throw rateLimitError('Please wait before asking for another code.', Math.ceil((current.resendAt - now) / 1000));
      }
      codes.set(email, {
        attemptsLeft: MAX_CODE_ATTEMPTS,
        expiresAt: now + CODE_TTL_SECONDS * 1000,
        resendAt: now + cooldown * 1000,
      });
      return { expires_in: CODE_TTL_SECONDS, resend_in: RESEND_COOLDOWN_SECONDS };
    },

    /** Uses up the code if it's right, otherwise throws the 422 from docs/api-auth.md section 3. */
    check(email, code) {
      const state = codes.get(email);
      const fail = (message, extra) => validationError(message, { code: [message] }, extra);

      if (!state || code === EXPIRED_CODE || Date.now() > state.expiresAt) {
        throw fail('This code has expired.', { code: 'code_expired' });
      }
      if (state.attemptsLeft > 0 && code === CORRECT_CODE) {
        codes.delete(email);
        return;
      }
      state.attemptsLeft = Math.max(0, state.attemptsLeft - 1);
      if (state.attemptsLeft === 0) throw fail('Too many tries.', { code: 'too_many_attempts', attempts_left: 0 });
      throw fail('That code isn’t right.', { code: 'code_invalid', attempts_left: state.attemptsLeft });
    },
  };
}
