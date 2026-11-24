import api, { getCsrfCookie } from '../../lib/api';
import { createMockCodes } from '../../mockdata/mockCodes';
import { apiError, requireSession, updateSessionUser, validationError, wait } from '../../mockdata/mockServer';
import { CONSENT_VERSION, mockInvites, ONBOARDING_GOALS, ONBOARDING_PATHS } from '../../mockdata/onboarding';
import { mockAccounts } from '../../mockdata/user';

// Flip to false once the endpoints in docs/api-onboarding.md are ready.
const USE_MOCK = true;
const MOCK_DELAY_MS = 700;

// ---- Requests ----------------------------------------------------------------
// Every function resolves with the response body and rejects with the axios error.

/** PATCH /api/user/consent → user with recording_consent_at and consent_version. false withdraws consent. */
export async function saveConsent({ recording_consent }) {
  if (USE_MOCK) return mockSaveConsent({ recording_consent });

  await getCsrfCookie();
  const { data } = await api.patch('/api/user/consent', { recording_consent });
  return data;
}

/** POST /api/user/avatar (multipart) → { avatar_url }. `avatar` is a File. 422: errors.avatar. */
export async function uploadAvatar({ avatar }) {
  if (USE_MOCK) return mockUploadAvatar({ avatar });

  await getCsrfCookie();
  const form = new FormData();
  form.append('avatar', avatar);
  const { data } = await api.post('/api/user/avatar', form);
  return data;
}

/** DELETE /api/user/avatar → { avatar_url: null }. */
export async function removeAvatar() {
  if (USE_MOCK) return mockRemoveAvatar();

  await getCsrfCookie();
  const { data } = await api.delete('/api/user/avatar');
  return data;
}

/**
 * GET /api/usernames/check → { available }. 422: errors.username (wrong length or characters).
 * The profile step calls this 400 ms after typing stops.
 */
export async function checkUsername({ username, signal }) {
  if (USE_MOCK) return mockCheckUsername({ username });

  const { data } = await api.get('/api/usernames/check', { params: { username }, signal });
  return data;
}

/**
 * PATCH /api/user/onboarding → user with onboarded_at and onboarding_path.
 * profile: { display_name, username, bio, occupation } (the photo goes through uploadAvatar)
 * 422: errors.path, errors.goals, errors['profile.username'], …
 */
export async function completeOnboarding({ path, goals, profile }) {
  if (USE_MOCK) return mockCompleteOnboarding({ path, goals, profile });

  await getCsrfCookie();
  const { data } = await api.patch('/api/user/onboarding', { path, goals, profile });
  return data;
}

/** GET /api/invites/{code} → { code, type: 'group' | 'coach', role, group, invited_by }. 404: no such code. */
export async function getInvite(code) {
  if (USE_MOCK) return mockGetInvite(code);

  const { data } = await api.get(`/api/invites/${encodeURIComponent(code.trim())}`);
  return data;
}

/** POST /api/groups/join → membership. 404: no such code; 409: already in the group. */
export async function joinGroup({ code }) {
  if (USE_MOCK) return mockJoinGroup({ code });

  await getCsrfCookie();
  const { data } = await api.post('/api/groups/join', { code });
  return data;
}

/** POST /api/user/two-factor/send → { expires_in, resend_in }. Emails a code. 429: retry_after (seconds). */
export async function sendTwoFactorCode() {
  if (USE_MOCK) return mockSendTwoFactorCode();

  await getCsrfCookie();
  const { data } = await api.post('/api/user/two-factor/send');
  return data;
}

/**
 * POST /api/user/two-factor/confirm → user with two_factor_confirmed_at
 * 422 code: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
 */
export async function confirmTwoFactor({ code }) {
  if (USE_MOCK) return mockConfirmTwoFactor({ code });

  await getCsrfCookie();
  const { data } = await api.post('/api/user/two-factor/confirm', { code });
  return data;
}

/**
 * POST /api/host-applications (multipart) → { status: 'pending' }. `role_proof` is a File.
 * 403 code: 'two_factor_required' when two-factor isn't confirmed.
 */
export async function applyToHost({ school_email, school_code, role_proof }) {
  if (USE_MOCK) return mockApplyToHost({ school_email, school_code, role_proof });

  await getCsrfCookie();
  const form = new FormData();
  form.append('school_email', school_email);
  form.append('school_code', school_code);
  form.append('role_proof', role_proof);
  // axios sets the multipart header (with its boundary) from the FormData.
  const { data } = await api.post('/api/host-applications', form);
  return data;
}

// ---- Mock --------------------------------------------------------------------
// Invite codes: SPEAK-2026 (group member), COACH-2026 (coach). Anything else is a 404.
// Two-factor codes: see mockdata/mockCodes.js (123456 is correct).
// Uploaded photos, memberships, host applications and codes live in memory until a reload.

const MAX_GOALS = 3;
const MAX_DISPLAY_NAME = 80;
const MAX_BIO = 160;
const MAX_OCCUPATION = 60;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const twoFactorCodes = createMockCodes();
const memberships = [];
const pendingApplicants = new Set(); // user emails (mock ids can repeat after a reload)

function findInvite(code) {
  const wanted = (code ?? '').trim().toUpperCase();
  const invite = mockInvites.find((i) => i.code === wanted);
  if (!invite) throw apiError(404, { message: 'We couldn’t find that invite code.' });
  return invite;
}

async function mockSaveConsent({ recording_consent }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  if (typeof recording_consent !== 'boolean') {
    throw validationError('The given data was invalid.', { recording_consent: ['Choose whether you agree.'] });
  }
  if (!recording_consent) return updateSessionUser({ recording_consent_at: null });

  const stillCurrent = user.recording_consent_at && user.consent_version === CONSENT_VERSION;
  return updateSessionUser({
    recording_consent_at: stillCurrent ? user.recording_consent_at : new Date().toISOString(),
    consent_version: CONSENT_VERSION,
  });
}

async function mockUploadAvatar({ avatar }) {
  await wait(MOCK_DELAY_MS);

  requireSession();
  if (!avatar) throw validationError('The given data was invalid.', { avatar: ['Choose a photo.'] });
  if (!AVATAR_TYPES.includes(avatar.type) || avatar.size > MAX_AVATAR_BYTES) {
    throw validationError('The given data was invalid.', { avatar: ['Upload a JPG, PNG or WEBP up to 5 MB.'] });
  }
  // Not stored on the session user: this URL stops working after a reload.
  return { avatar_url: URL.createObjectURL(avatar) };
}

async function mockRemoveAvatar() {
  await wait(MOCK_DELAY_MS);

  updateSessionUser({ avatar_url: null });
  return { avatar_url: null };
}

const USERNAME_FORMAT_MESSAGE = 'Use 3–20 letters, numbers or underscores.';

function isUsernameTaken(username, user) {
  const wanted = username.toLowerCase();
  return mockAccounts.some((a) => a.user.email !== user.email && a.user.username?.toLowerCase() === wanted);
}

async function mockCheckUsername({ username }) {
  await wait(300);

  const user = requireSession();
  const wanted = username?.trim() ?? '';
  if (!USERNAME_PATTERN.test(wanted)) {
    throw validationError('The given data was invalid.', { username: [USERNAME_FORMAT_MESSAGE] });
  }
  return { available: !isUsernameTaken(wanted, user) };
}

async function mockCompleteOnboarding({ path, goals = [], profile = {} }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  const displayName = profile.display_name?.trim() ?? '';
  const username = profile.username?.trim() ?? '';
  const bio = profile.bio?.trim() || null;
  const occupation = profile.occupation?.trim() || null;

  const errors = {};
  if (!ONBOARDING_PATHS.includes(path)) errors.path = ['Choose how you want to use Khameo.'];
  if (goals.length > MAX_GOALS || goals.some((g) => !ONBOARDING_GOALS.includes(g))) errors.goals = ['Choose up to 3.'];
  if (!displayName) errors['profile.display_name'] = ['Enter a display name.'];
  else if (displayName.length > MAX_DISPLAY_NAME) errors['profile.display_name'] = ['Use up to 80 characters.'];
  if (!USERNAME_PATTERN.test(username)) {
    errors['profile.username'] = [USERNAME_FORMAT_MESSAGE];
  } else if (isUsernameTaken(username, user)) {
    errors['profile.username'] = ['That username is taken.'];
  }
  if (bio?.length > MAX_BIO) errors['profile.bio'] = ['Use up to 160 characters.'];
  if (occupation?.length > MAX_OCCUPATION) errors['profile.occupation'] = ['Use up to 60 characters.'];
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  return updateSessionUser({
    onboarded_at: new Date().toISOString(),
    onboarding_path: path,
    display_name: displayName,
    username,
    bio,
    occupation,
  });
}

async function mockGetInvite(code) {
  await wait(MOCK_DELAY_MS);

  requireSession();
  return structuredClone(findInvite(code));
}

async function mockJoinGroup({ code }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  if (!code?.trim()) throw validationError('The given data was invalid.', { code: ['Enter your invite code.'] });
  const { group, role } = findInvite(code);
  if (memberships.some((m) => m.email === user.email && m.group.id === group.id)) {
    throw apiError(409, { message: 'You’re already in this group.', code: 'already_member' });
  }

  const membership = {
    id: memberships.length + 1,
    group: { id: group.id, name: group.name },
    user_id: user.id,
    role,
    joined_at: new Date().toISOString(),
  };
  memberships.push({ ...membership, email: user.email });
  return membership;
}

async function mockSendTwoFactorCode() {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  return { message: 'We sent a code.', ...twoFactorCodes.send(user.email) };
}

async function mockConfirmTwoFactor({ code }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  if (user.two_factor_confirmed_at) return user;
  twoFactorCodes.check(user.email, code);
  return updateSessionUser({ two_factor_confirmed_at: new Date().toISOString() });
}

async function mockApplyToHost({ school_email, school_code, role_proof }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  if (!user.two_factor_confirmed_at) {
    throw apiError(403, { message: 'Confirm two-factor first.', code: 'two_factor_required' });
  }
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(school_email ?? '')) errors.school_email = ['Enter a valid school email.'];
  if (!school_code?.trim()) errors.school_code = ['Enter your school code.'];
  if (!role_proof) errors.role_proof = ['Upload proof of your role.'];
  else if (!PROOF_TYPES.includes(role_proof.type) || role_proof.size > MAX_PROOF_BYTES) {
    errors.role_proof = ['Upload a JPG, PNG or PDF up to 5 MB.'];
  }
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);
  if (pendingApplicants.has(user.email)) {
    throw apiError(409, { message: 'You already have an application under review.', code: 'already_pending' });
  }

  pendingApplicants.add(user.email);
  return { status: 'pending' };
}
