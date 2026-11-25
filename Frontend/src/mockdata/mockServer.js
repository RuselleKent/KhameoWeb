// Helpers shared by the mock APIs (auth.api.js, onboarding.api.js).
// Errors look like axios errors in Laravel's shapes, so pages can't tell mock from real.
import { mockAccounts } from './user';

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function apiError(status, data) {
  const error = new Error(data.message);
  error.response = { status, data };
  return error;
}

export const validationError = (message, errors, extra = {}) => apiError(422, { message, errors, ...extra });
export const rateLimitError = (message, retryAfter) => apiError(429, { message, retry_after: retryAfter });

// The signed-in user lives in localStorage (stands in for the session cookie), so a reload stays signed in.
const SESSION_KEY = 'khameo.mockSession';

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(user) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked (private mode etc.): the session just won't survive a reload.
  }
  return user;
}

/** The signed-in user, or a 401 like the real API. */
export function requireSession() {
  const user = readSession();
  if (!user) throw apiError(401, { message: 'Unauthenticated.' });
  return user;
}

/** Change the signed-in user, in the session and in the mock "database" (until a reload). */
export function updateSessionUser(changes) {
  const user = { ...requireSession(), ...changes, updated_at: new Date().toISOString() };
  const account = mockAccounts.find((a) => a.user.email === user.email);
  if (account) Object.assign(account.user, user);
  return writeSession(user);
}
