import api, { getCsrfCookie } from '../../lib/api';
import { apiError, rateLimitError, readSession, validationError, wait, writeSession } from '../../mockdata/mockServer';
import { mockAccounts } from '../../mockdata/user';

// Flip to false once the endpoints in docs/api-auth.md are ready.
const USE_MOCK = true;
const MOCK_DELAY_MS = 700;

// ---- Requests ----------------------------------------------------------------
// Every function resolves with the response body. Failures reject with the axios error;
// read them with getFieldErrors() / getErrorInfo() below. Shapes: docs/api-auth.md.

/** POST /api/login → user. 422: errors.email (no account) or errors.password (wrong password). */
export async function login({ email, password, remember = false }) {
  if (USE_MOCK) return mockLogin({ email, password });

  await getCsrfCookie();
  const { data } = await api.post('/api/login', { email, password, remember });
  return data;
}

/**
 * POST /api/register → { user, verification: { expires_in, resend_in } }
 * Payload: { name, email, password, password_confirmation, confirmed_age, accepted_terms }
 * 422: errors keyed by payload field; errors.email = already registered.
 */
export async function register(payload) {
  if (USE_MOCK) return mockRegister(payload);

  await getCsrfCookie();
  const { data } = await api.post('/api/register', payload);
  return data;
}

/**
 * POST /api/email/verify → { user }
 * 422 error: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
 */
export async function verifyEmail({ email, code }) {
  if (USE_MOCK) return mockVerifyEmail({ email, code });

  await getCsrfCookie();
  const { data } = await api.post('/api/email/verify', { email, code });
  return data;
}

/** POST /api/email/resend → { expires_in, resend_in }. 429: retry_after (seconds). */
export async function resendVerificationCode({ email }) {
  if (USE_MOCK) return mockResendCode({ email });

  await getCsrfCookie();
  const { data } = await api.post('/api/email/resend', { email });
  return data;
}

/** POST /api/forgot-password → { message }. Always succeeds for a valid email. 429: retry_after. */
export async function forgotPassword({ email }) {
  if (USE_MOCK) return mockForgotPassword({ email });

  await getCsrfCookie();
  const { data } = await api.post('/api/forgot-password', { email });
  return data;
}

/**
 * POST /api/reset-password → { user } (and signs the user in)
 * Payload: { token, email, password, password_confirmation }
 * 422: errors.token (link expired or invalid) or errors.password.
 */
export async function resetPassword(payload) {
  if (USE_MOCK) return mockResetPassword(payload);

  await getCsrfCookie();
  const { data } = await api.post('/api/reset-password', payload);
  return data;
}

/** GET /api/user → the signed-in user. 401 when nobody is signed in. */
export async function getUser() {
  if (USE_MOCK) return mockGetUser();

  const { data } = await api.get('/api/user');
  return data;
}

/** POST /api/logout → 204. Ends the session. */
export async function logout() {
  if (USE_MOCK) return mockLogout();

  await getCsrfCookie();
  await api.post('/api/logout');
}

// ---- Error helpers -----------------------------------------------------------

/**
 * Pull the first message per field out of a Laravel 422 error.
 * Returns {} for anything that isn't a validation error.
 */
export function getFieldErrors(error) {
  if (error?.response?.status !== 422) return {};
  const errors = error.response.data?.errors ?? {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, [].concat(messages)[0]]),
  );
}

/** { status, code, retryAfter, attemptsLeft } from an API error; status is undefined for network errors. */
export function getErrorInfo(error) {
  const response = error?.response;
  const data = response?.data ?? {};
  return {
    status: response?.status,
    code: data.error,
    retryAfter: data.retry_after,
    attemptsLeft: data.attempts_left,
  };
}

// ---- Mock --------------------------------------------------------------------
// Mock rules (handy for testing):
//   verify code      123456 is correct; 000000 acts as an expired code; 3 wrong tries locks it
//   codes            expire after 10 minutes; "resend" unlocks 60 seconds after the last send
//   reset link       one request per email every 5 minutes, then 429
//   reset token      "expired" (or empty) is rejected; your current password is rejected
//   session          the signed-in user is kept in localStorage (stands in for the session cookie),
//                    so a reload stays signed in. Accounts created by sign-up live in memory only.

export const MOCK_VERIFY_CODE = '123456';
const CODE_TTL_SECONDS = 600;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODE_ATTEMPTS = 3;
const RESET_LINK_COOLDOWN_SECONDS = 300;

const verificationByEmail = new Map(); // email → { attemptsLeft, expiresAt, resendAt }
const resetRequestedAt = new Map(); // email → timestamp

const normalize = (email) => email.trim().toLowerCase();
const findAccount = (email) => mockAccounts.find((a) => a.email.toLowerCase() === normalize(email));

async function mockGetUser() {
  await wait(300);
  const user = readSession();
  if (!user) throw apiError(401, { message: 'Unauthenticated.' });
  return user;
}

async function mockLogout() {
  await wait(300);
  writeSession(null);
}

function sendCode(email, { cooldown = RESEND_COOLDOWN_SECONDS } = {}) {
  const now = Date.now();
  verificationByEmail.set(normalize(email), {
    attemptsLeft: MAX_CODE_ATTEMPTS,
    expiresAt: now + CODE_TTL_SECONDS * 1000,
    resendAt: now + cooldown * 1000,
  });
  return { expires_in: CODE_TTL_SECONDS, resend_in: RESEND_COOLDOWN_SECONDS };
}

async function mockLogin({ email, password }) {
  await wait(MOCK_DELAY_MS);

  const account = findAccount(email);
  if (!account) {
    throw validationError('No account found', {
      email: ['We couldn’t find an account with this email.'],
    });
  }
  if (account.password !== password) {
    throw validationError('Wrong password', {
      password: ['That password isn’t right. Try again, or reset it.'],
    });
  }
  return writeSession({ ...account.user });
}

async function mockRegister({ name, email, password, password_confirmation, confirmed_age, accepted_terms }) {
  await wait(MOCK_DELAY_MS);

  // Mirror the server-side checks the backend is expected to run.
  const errors = {};
  if (!name?.trim()) errors.name = ['Enter your full name.'];
  if (!password || password.length < 8) errors.password = ['Use at least 8 characters.'];
  if (password !== password_confirmation) errors.password_confirmation = ['Passwords don’t match.'];
  if (confirmed_age !== true) errors.confirmed_age = ['You must be 18 or older to use Khameo.'];
  if (accepted_terms !== true) errors.accepted_terms = ['Please accept the terms to continue.'];
  if (findAccount(email)) errors.email = ['This email is already registered.'];
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  const now = new Date().toISOString();
  const user = {
    id: mockAccounts.length + 1,
    name: name.trim(),
    email: normalize(email),
    email_verified_at: null,
    consent_at: null,
    onboarded_at: null,
    created_at: now,
    updated_at: now,
  };
  // Keep it for this browser session so the new account can log in.
  mockAccounts.push({ email: user.email, password, user });
  // Registering signs the user in (unverified).
  writeSession({ ...user });
  return { user: { ...user }, verification: sendCode(user.email) };
}

async function mockVerifyEmail({ email, code }) {
  await wait(MOCK_DELAY_MS);

  const key = normalize(email);
  // Opening the page directly (no sign-up this session) behaves as if a code is waiting.
  // We don't know when it was sent, so don't invent a resend cooldown.
  if (!verificationByEmail.has(key)) sendCode(key, { cooldown: 0 });
  const state = verificationByEmail.get(key);

  if (code === '000000' || Date.now() > state.expiresAt) {
    throw validationError('This code has expired.', { code: ['This code has expired.'] }, { error: 'code_expired' });
  }
  if (state.attemptsLeft <= 0) {
    throw validationError('Too many tries.', { code: ['Too many tries.'] }, { error: 'too_many_attempts', attempts_left: 0 });
  }
  if (code !== MOCK_VERIFY_CODE) {
    state.attemptsLeft -= 1;
    if (state.attemptsLeft <= 0) {
      throw validationError('Too many tries.', { code: ['Too many tries.'] }, { error: 'too_many_attempts', attempts_left: 0 });
    }
    throw validationError(
      'That code isn’t right.',
      { code: ['That code isn’t right.'] },
      { error: 'code_invalid', attempts_left: state.attemptsLeft },
    );
  }

  verificationByEmail.delete(key);
  const verifiedAt = new Date().toISOString();
  const account = findAccount(key);
  if (account) account.user.email_verified_at = verifiedAt;
  // After a reload the account may only exist in the stored session; verify that copy instead.
  const base = account?.user ?? readSession() ?? { id: 0, name: '', email: key, consent_at: null, onboarded_at: null };
  const user = writeSession({ ...base, email_verified_at: verifiedAt });
  return { user };
}

async function mockResendCode({ email }) {
  await wait(MOCK_DELAY_MS);

  const state = verificationByEmail.get(normalize(email));
  if (state && Date.now() < state.resendAt) {
    throw rateLimitError('Please wait before asking for another code.', Math.ceil((state.resendAt - Date.now()) / 1000));
  }
  return sendCode(email);
}

async function mockForgotPassword({ email }) {
  await wait(MOCK_DELAY_MS);

  const key = normalize(email);
  const last = resetRequestedAt.get(key);
  if (last && Date.now() - last < RESET_LINK_COOLDOWN_SECONDS * 1000) {
    const retryAfter = Math.ceil((last + RESET_LINK_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
    throw rateLimitError('Too many requests.', retryAfter);
  }
  resetRequestedAt.set(key, Date.now());

  // Same reply whether or not the account exists, so the form can't be used to find accounts.
  // demo_reset_url only exists in the mock; the real link arrives by email.
  return {
    message: 'If that email has an account, we sent a reset link.',
    demo_reset_url: `/reset-password?token=demo-token&email=${encodeURIComponent(key)}`,
  };
}

async function mockResetPassword({ token, email, password, password_confirmation }) {
  await wait(MOCK_DELAY_MS);

  if (!token || token === 'expired') {
    throw validationError('This reset link has expired.', { token: ['This reset link has expired. Ask for a new one.'] });
  }
  const account = findAccount(email);
  const errors = {};
  if (!password || password.length < 8) errors.password = ['Use at least 8 characters.'];
  else if (account && account.password === password) {
    errors.password = ['Choose a password you haven’t used on Khameo before.'];
  }
  if (password !== password_confirmation) errors.password_confirmation = ['Passwords don’t match.'];
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  if (account) account.password = password;
  // Resetting signs the user in on this device.
  const user = writeSession({ ...(account?.user ?? { id: 0, name: '', email: normalize(email), email_verified_at: null, consent_at: null, onboarded_at: null }) });
  return { user };
}
