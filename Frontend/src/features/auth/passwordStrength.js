export const MIN_PASSWORD_LENGTH = 8;

/**
 * Rough strength for the sign-up meter. Only the 8-character minimum blocks sign-up;
 * the level is guidance.
 * - weak:   under 8 characters, or only one kind of character
 * - fair:   8+ characters with two kinds (lowercase, uppercase, digits, symbols)
 * - strong: 8+ with three or more kinds, or 12+ with two
 * Returns { level: 'none' | 'weak' | 'fair' | 'strong', label }.
 */
export function getPasswordStrength(password) {
  if (!password) return { level: 'none', label: 'Use at least 8 characters.' };
  if (password.length < MIN_PASSWORD_LENGTH) return { level: 'weak', label: 'Too short' };

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;

  if (kinds >= 3 || (kinds >= 2 && password.length >= 12)) return { level: 'strong', label: 'Strong' };
  if (kinds >= 2) return { level: 'fair', label: 'Fair' };
  return { level: 'weak', label: 'Weak' };
}
