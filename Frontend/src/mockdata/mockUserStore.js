// Mock only: the signed-in user for the mocked endpoints that aren't built yet (onboarding).
//
// The user comes from AuthProvider (real API or mock auth), not from the mock auth session, so the
// mocks work on top of the real Laravel log in. AuthProvider connects itself with connectMockUser().
//
// Fields only a mock changes (MOCKED_FIELDS) are also saved per account in localStorage ("overlay"),
// because the real API doesn't store them yet. withMockFields() puts them back on every user that comes
// from the API, so a reload or a new log in still sees them. Every other field always comes from the API.
import { apiError } from './mockServer';

// v2: only MOCKED_FIELDS. Overlays from when onboarding was mocked (v1) are ignored.
const OVERLAY_PREFIX = 'khameo.mockUserFields.v2.';

// Still mocked: two-factor setup and host applications (host path). Remove a field once its endpoint is real.
const MOCKED_FIELDS = ['two_factor_confirmed_at', 'host_status'];

const onlyMocked = (fields) => Object.fromEntries(Object.entries(fields).filter(([key]) => MOCKED_FIELDS.includes(key)));

let source = { get: () => null, set: () => {} };

/** Called by AuthProvider: how to read the current user and how to store a changed one. */
export function connectMockUser(get, set) {
  source = { get, set };
}

const overlayKey = (user) => `${OVERLAY_PREFIX}${user.id}|${user.email}`;

function readOverlay(user) {
  try {
    return JSON.parse(localStorage.getItem(overlayKey(user)) ?? '{}');
  } catch {
    return {};
  }
}

function writeOverlay(user, changes) {
  try {
    localStorage.setItem(overlayKey(user), JSON.stringify({ ...readOverlay(user), ...onlyMocked(changes) }));
  } catch {
    // Storage blocked: the changes last until a reload.
  }
}

/** The signed-in user, or a 401 like the real API. */
export function requireUser() {
  const user = source.get();
  if (!user) throw apiError(401, { message: 'Unauthenticated.' });
  return user;
}

/** Changes the signed-in user (AuthProvider's user and the saved overlay) and returns the new user. */
export function updateUser(changes) {
  const user = { ...requireUser(), ...changes, updated_at: new Date().toISOString() };
  writeOverlay(user, changes);
  source.set(user);
  return user;
}

/** The user with the fields earlier mocks changed for this account. */
export function withMockFields(user) {
  return user ? { ...user, ...onlyMocked(readOverlay(user)) } : user;
}
