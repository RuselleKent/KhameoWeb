import api, { getCsrfCookie } from '../../lib/api';
import { mockAccounts } from '../../mockdata/user';

// Flip to false once POST /api/login is ready (see docs/api-auth.md).
const USE_MOCK = true;
const MOCK_DELAY_MS = 700;

const LOGIN_ERRORS = {
  noAccount: 'We couldn’t find an account with this email.',
  wrongPassword: 'That password isn’t right. Try again, or reset it.',
};

/**
 * Log in with email + password.
 * Resolves with the user. Rejects with an axios-style error:
 * 422 → err.response.data = { message, errors: { email?: [msg], password?: [msg] } }
 *   - errors.email    → no account with this email
 *   - errors.password → wrong password
 * 429 → too many attempts (Laravel throttle)
 */
export async function login({ email, password, remember = false }) {
  if (USE_MOCK) return mockLogin({ email, password });

  await getCsrfCookie();
  const { data } = await api.post('/api/login', { email, password, remember });
  return data;
}

/**
 * Create an account.
 * Payload: { name, email, password, password_confirmation, confirmed_age, accepted_terms }
 * Resolves with the new user (email not verified yet). Rejects with an axios-style error:
 * 422 → err.response.data.errors keyed by the payload field names
 *   - errors.email → this email is already registered
 */
export async function register(payload) {
  if (USE_MOCK) return mockRegister(payload);

  await getCsrfCookie();
  const { data } = await api.post('/api/register', payload);
  return data;
}

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

// ---- Mock --------------------------------------------------------------------

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validationError(message, errors) {
  const error = new Error(message);
  error.response = { status: 422, data: { message, errors } };
  return error;
}

async function mockLogin({ email, password }) {
  await wait(MOCK_DELAY_MS);

  const account = mockAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!account) {
    throw validationError('No account found', { email: [LOGIN_ERRORS.noAccount] });
  }
  if (account.password !== password) {
    throw validationError('Wrong password', { password: [LOGIN_ERRORS.wrongPassword] });
  }
  return account.user;
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

  const normalizedEmail = email.trim().toLowerCase();
  if (mockAccounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    errors.email = ['This email is already registered.'];
  }
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  const now = new Date().toISOString();
  const user = {
    id: mockAccounts.length + 1,
    name: name.trim(),
    email: normalizedEmail,
    email_verified_at: null,
    created_at: now,
    updated_at: now,
  };
  // Keep it for this browser session so the new account can log in.
  mockAccounts.push({ email: normalizedEmail, password, user });
  return user;
}
