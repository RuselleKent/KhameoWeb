// Helpers shared by the mock APIs (auth.api.js, onboarding.api.js).
// Errors look like axios errors in Laravel's shapes, so pages can't tell mock from real.

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

// Mock auth only (auth.api.js with USE_MOCK): the signed-in user lives in localStorage (stands in for
// the session cookie), so a reload stays signed in. The onboarding mocks don't read this; they use the
// AuthProvider user (mockUserStore.js).
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
