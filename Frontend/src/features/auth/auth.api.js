import api, { getCsrfCookie } from '../../lib/api';
import { createMockCodes } from '../../mockdata/mockCodes';
import { apiError, rateLimitError, readSession, validationError, wait, writeSession } from '../../mockdata/mockServer';
import { blankUser, mockAccounts } from '../../mockdata/user';

// Flip to false once the endpoints in docs/api-auth.md are ready.
const USE_MOCK = true;
const MOCK_DELAY_MS = 700;

// ---- Requests ----------------------------------------------------------------
// Every function resolves with the response body. Failures reject with the axios error;
// read them with getFieldErrors() / getErrorInfo() below. Shapes: docs/api-auth.md.

/**
 * POST /api/login → user, or { two_factor_required: true } when two-factor is on (no session yet;
 * a code was emailed, see loginTwoFactor). 422: errors.email (no account) or errors.password.
 */
export async function login({ email, password, remember = false }) {
  if (USE_MOCK) return mockLogin({ email, password });

  await getCsrfCookie();
  const { data } = await api.post('/api/login', { email, password, remember });
  return data;
}

/**
 * POST /api/login/two-factor → user. Finishes a log in that answered two_factor_required.
 * 422 code: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
 * 401 code: 'login_expired' (start again at /login)
 */
export async function loginTwoFactor({ code }) {
  if (USE_MOCK) return mockLoginTwoFactor({ code });

  await getCsrfCookie();
  const { data } = await api.post('/api/login/two-factor', { code });
  return data;
}

/** POST /api/login/two-factor/resend → { expires_in, resend_in }. 429: retry_after. 401 code: 'login_expired'. */
export async function resendLoginCode() {
  if (USE_MOCK) return mockResendLoginCode();

  await getCsrfCookie();
  const { data } = await api.post('/api/login/two-factor/resend');
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
 * 422 code: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
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
 * POST /api/reset-password → { message }. Does not start a session: the user logs in next (2FA applies).
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

export { getErrorInfo, getFieldErrors } from '../../lib/apiErrors';

// ---- Mock --------------------------------------------------------------------
// Mock rules (handy for testing):
//   codes            see mockdata/mockCodes.js (123456 is correct)
//   two-factor       maria.santos@example.com has it on: logging in asks for a code
//   reset link       one request per email every 5 minutes, then 429
//   reset token      "expired" (or empty) is rejected; your current password is rejected
//   session          the signed-in user is kept in localStorage (stands in for the session cookie),
//                    so a reload stays signed in. Accounts created by sign-up live in memory only.

const RESET_LINK_COOLDOWN_SECONDS = 300;

const verificationCodes = createMockCodes();
const loginCodes = createMockCodes();
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
  if (account.user.two_factor_confirmed_at) {
    writePendingLogin(account.email);
    try {
      loginCodes.send(account.email);
    } catch {
      // A code went out less than a minute ago: that one still works, don't send another.
    }
    return { two_factor_required: true };
  }
  return writeSession({ ...account.user });
}

// The log in waiting for its two-factor code (stands in for Laravel's guest session).
const PENDING_LOGIN_KEY = 'khameo.mockPendingLogin';

function writePendingLogin(email) {
  try {
    if (email) sessionStorage.setItem(PENDING_LOGIN_KEY, email);
    else sessionStorage.removeItem(PENDING_LOGIN_KEY);
  } catch {
    // Storage blocked: the log in has to be started again.
  }
}

function requirePendingLogin() {
  let email = null;
  try {
    email = sessionStorage.getItem(PENDING_LOGIN_KEY);
  } catch {
    // Same as no pending log in.
  }
  const account = email && findAccount(email);
  if (!account) throw apiError(401, { message: 'Log in again.', code: 'login_expired' });
  return account;
}

async function mockLoginTwoFactor({ code }) {
  await wait(MOCK_DELAY_MS);

  const account = requirePendingLogin();
  // Codes live in memory: after a reload, behave as if one is still waiting.
  if (!loginCodes.has(account.email)) loginCodes.send(account.email, { cooldown: 0 });
  loginCodes.check(account.email, code);
  writePendingLogin(null);
  return writeSession({ ...account.user });
}

async function mockResendLoginCode() {
  await wait(MOCK_DELAY_MS);

  const account = requirePendingLogin();
  return { message: 'We sent a new code.', ...loginCodes.send(account.email) };
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
    ...blankUser,
    id: mockAccounts.length + 1,
    name: name.trim(),
    email: normalize(email),
    created_at: now,
    updated_at: now,
  };
  // Keep it for this browser session so the new account can log in.
  mockAccounts.push({ email: user.email, password, user });
  // Registering signs the user in (unverified).
  writeSession({ ...user });
  return { user: { ...user }, verification: verificationCodes.send(user.email, { force: true }) };
}

async function mockVerifyEmail({ email, code }) {
  await wait(MOCK_DELAY_MS);

  const key = normalize(email);
  // Opening the page directly (no sign-up this session) behaves as if a code is waiting.
  // We don't know when it was sent, so don't invent a resend cooldown.
  if (!verificationCodes.has(key)) verificationCodes.send(key, { cooldown: 0 });
  verificationCodes.check(key, code);

  const verifiedAt = new Date().toISOString();
  const account = findAccount(key);
  if (account) account.user.email_verified_at = verifiedAt;
  // After a reload the account may only exist in the stored session; verify that copy instead.
  const base = account?.user ?? readSession() ?? { ...blankUser, email: key };
  const user = writeSession({ ...base, email_verified_at: verifiedAt });
  return { user };
}

async function mockResendCode({ email }) {
  await wait(MOCK_DELAY_MS);

  return verificationCodes.send(normalize(email));
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
  return { message: 'Your password is updated.' };
}
