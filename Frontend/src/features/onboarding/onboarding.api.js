import api, { getCsrfCookie } from '../../lib/api';
import { createMockCodes } from '../../mockdata/mockCodes';
import { apiError, validationError, wait } from '../../mockdata/mockServer';
import { connectMockUser, requireUser, updateUser, withMockFields } from '../../mockdata/mockUserStore';
import {
  CONSENT_VERSION,
  mockAiAudiences,
  mockHostApplications,
  mockInvites,
  ONBOARDING_GOALS,
  ONBOARDING_PATHS,
} from '../../mockdata/onboarding';
import { mockAccounts } from '../../mockdata/user';
import { MAX_AUDIENCE_NAME, MAX_CHECKED_AUDIENCES, MAX_ROLE_NAME, MAX_ROLES } from './audiences';
import { MAX_GOALS } from './goals';
import { HOST_MESSAGES, isValidProof, isValidProofLink, schoolEmailError } from './hostRules';
import {
  AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  MAX_BIO,
  MAX_DISPLAY_NAME,
  MESSAGES,
  USERNAME_PATTERN,
} from './profileRules';
import { sameName } from './roles';

// Real (Laravel): consent, avatar, username check, finish onboarding. Set USE_MOCK = true to mock them
// too (no Laravel needed).
const USE_MOCK = false;
// Waits for: the Groups module (Russel): invites, joining groups, two-factor setup, school email and
// host applications (host path).
const GROUPS_AND_HOSTS_USE_MOCK = true;
// Waits for: POST /api/ai/suggest-audiences. The profile step shows the button as "Soon" and doesn't call it.
const AI_USE_MOCK = true;
const MOCK_DELAY_MS = 700;

// ---- Mock wiring (AuthProvider) ----------------------------------------------
// The mocks read and change the signed-in user from AuthProvider (see mockdata/mockUserStore.js).
// Both are no-ops once nothing is mocked.

/** AuthProvider calls this once with a reader for the current user and its setUser. */
export function connectOnboardingMock(getUser, setUser) {
  if (USE_MOCK || GROUPS_AND_HOSTS_USE_MOCK) connectMockUser(getUser, setUser);
}

/** Puts back the fields the mocks saved for this account (the real API doesn't store them yet). */
export function withMockOnboardingFields(user) {
  return USE_MOCK || GROUPS_AND_HOSTS_USE_MOCK ? withMockFields(user) : user;
}

// ---- Requests ----------------------------------------------------------------
// Every function resolves with the response body and rejects with the axios error.

/**
 * PATCH /api/user/consent → user with recording_consent_at and consent_version. false withdraws consent.
 */
export async function saveConsent({ recording_consent }) {
  if (USE_MOCK) return mockSaveConsent({ recording_consent });

  await getCsrfCookie();
  const { data } = await api.patch('/api/user/consent', { recording_consent });
  return data;
}

/**
 * POST /api/user/avatar (multipart) → { avatar_url }. `avatar` is a File. 422: errors.avatar.
 */
export async function uploadAvatar({ avatar }) {
  if (USE_MOCK) return mockUploadAvatar({ avatar });

  await getCsrfCookie();
  const form = new FormData();
  form.append('avatar', avatar);
  const { data } = await api.post('/api/user/avatar', form);
  return data;
}

/**
 * DELETE /api/user/avatar → { avatar_url: null }.
 */
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
 * profile: { display_name, username, bio, roles: [{ name, audiences: [...] }] } (the photo goes through uploadAvatar)
 * 422: errors.path, errors.goals, errors['profile.username'], …
 */
export async function completeOnboarding({ path, goals, profile }) {
  if (USE_MOCK) return mockCompleteOnboarding({ path, goals, profile });

  await getCsrfCookie();
  const { data } = await api.patch('/api/user/onboarding', { path, goals, profile });
  return data;
}

/**
 * POST /api/ai/suggest-audiences → { audiences: [...] } for a speaking role, none of them in existing_audiences.
 * 503 code: 'ai_unavailable'. 429: retry_after (10 a minute).
 */
export async function suggestAudiences({ role, existing_audiences }) {
  if (AI_USE_MOCK) return mockSuggestAudiences({ role, existing_audiences });

  await getCsrfCookie();
  const { data } = await api.post('/api/ai/suggest-audiences', { role, existing_audiences });
  return data;
}

/**
 * GET /api/invites/{code} → { code, type: 'group' | 'coach', role, group, … }. 404: no such code.
 * Waits for: GET /api/invites/{code}
 */
export async function getInvite(code) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockGetInvite(code);

  const { data } = await api.get(`/api/invites/${encodeURIComponent(code.trim())}`);
  return data;
}

/**
 * POST /api/groups/join → membership. 404: no such code; 409 code 'already_member' with their membership.
 * `upgrade: true` lets a coach code turn a Member into a Coach (ask the user first).
 * Waits for: POST /api/groups/join
 */
export async function joinGroup({ code, upgrade = false }) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockJoinGroup({ code, upgrade });

  await getCsrfCookie();
  const { data } = await api.post('/api/groups/join', upgrade ? { code, upgrade } : { code });
  return data;
}

/**
 * POST /api/user/two-factor/send → { expires_in, resend_in }. Emails a code. 429: retry_after (seconds).
 * Waits for: POST /api/user/two-factor/send
 */
export async function sendTwoFactorCode() {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockSendTwoFactorCode();

  await getCsrfCookie();
  const { data } = await api.post('/api/user/two-factor/send');
  return data;
}

/**
 * POST /api/user/two-factor/confirm → user with two_factor_confirmed_at
 * 422 code: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
 * Waits for: POST /api/user/two-factor/confirm
 */
export async function confirmTwoFactor({ code }) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockConfirmTwoFactor({ code });

  await getCsrfCookie();
  const { data } = await api.post('/api/user/two-factor/confirm', { code });
  return data;
}

/**
 * POST /api/host-applications/school-email/send → { expires_in, resend_in }. Emails a code to the school address.
 * 422: errors.school_email. 429: retry_after (seconds).
 * Waits for: POST /api/host-applications/school-email/send
 */
export async function sendSchoolEmailCode({ school_email }) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockSendSchoolEmailCode({ school_email });

  await getCsrfCookie();
  const { data } = await api.post('/api/host-applications/school-email/send', { school_email });
  return data;
}

/**
 * POST /api/host-applications/school-email/verify → { school_email, verified }
 * 422 code: 'code_invalid' (with attempts_left) | 'code_expired' | 'too_many_attempts'
 * Waits for: POST /api/host-applications/school-email/verify
 */
export async function verifySchoolEmail({ school_email, code }) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockVerifySchoolEmail({ school_email, code });

  await getCsrfCookie();
  const { data } = await api.post('/api/host-applications/school-email/verify', { school_email, code });
  return data;
}

/**
 * POST /api/host-applications (multipart) → { status: 'pending' }.
 * application: { host_type: 'school', school_email, school_code, institution, role_title, role_proof }
 *           or { host_type: 'community', organization_name, proof_link and/or proof_file }
 * (role_proof and proof_file are Files.) 403 code: 'two_factor_required'.
 * 409 code: 'already_pending' | 'already_verified'.
 * Waits for: POST /api/host-applications
 */
export async function applyToHost(application) {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockApplyToHost(application);

  await getCsrfCookie();
  const form = new FormData();
  Object.entries(application).forEach(([field, value]) => form.append(field, value));
  // axios sets the multipart header (with its boundary) from the FormData.
  const { data } = await api.post('/api/host-applications', form);
  return data;
}

/**
 * GET /api/host-applications/latest → { status, submitted_at, rejection_reason }. status 'none': never applied.
 * Waits for: GET /api/host-applications/latest
 */
export async function getLatestHostApplication() {
  if (GROUPS_AND_HOSTS_USE_MOCK) return mockGetLatestHostApplication();

  const { data } = await api.get('/api/host-applications/latest');
  return data;
}

// ---- Mock --------------------------------------------------------------------
// Invite codes: ACLC-4A (group member), COACH-RINA (coach). Anything else is a 404.
// AI suggestions: localStorage.setItem('khameo.mockAiDown', '1') makes them answer 503; remove it to bring them back.
// Two-factor and school email codes: see mockdata/mockCodes.js (123456 is correct).
// Uploaded photos (resized) and host_status are kept in the mock session. Memberships, application details
// and codes live in memory until a reload. Nobody approves applications in the mock: log in as
// maria.santos@example.com (verified) or paolo.reyes@example.com (rejected) to see those.

const twoFactorCodes = createMockCodes();
const schoolEmailCodes = createMockCodes();
const memberships = [];

function findInvite(code) {
  const wanted = (code ?? '').trim().toUpperCase();
  const invite = mockInvites.find((i) => i.code === wanted);
  if (!invite) throw apiError(404, { message: 'We couldn’t find that invite code.' });
  return invite;
}

async function mockSaveConsent({ recording_consent }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  if (typeof recording_consent !== 'boolean') {
    throw validationError('The given data was invalid.', { recording_consent: ['Choose whether you agree.'] });
  }
  if (!recording_consent) return updateUser({ recording_consent_at: null });

  const stillCurrent = user.recording_consent_at && user.consent_version === CONSENT_VERSION;
  return updateUser({
    recording_consent_at: stillCurrent ? user.recording_consent_at : new Date().toISOString(),
    consent_version: CONSENT_VERSION,
  });
}

async function mockUploadAvatar({ avatar }) {
  await wait(MOCK_DELAY_MS);

  requireUser();
  if (!avatar) throw validationError('The given data was invalid.', { avatar: ['Choose a photo.'] });
  const invalid = () => validationError('The given data was invalid.', { avatar: [MESSAGES.avatar] });
  if (!AVATAR_TYPES.includes(avatar.type) || avatar.size > MAX_AVATAR_BYTES) throw invalid();
  try {
    const avatar_url = await resizeToDataUrl(avatar);
    updateUser({ avatar_url });
    return { avatar_url };
  } catch {
    // Not really an image, whatever its type says.
    throw invalid();
  }
}

/** A small square copy as a data URL (stands in for the stored photo's public URL). */
async function resizeToDataUrl(file, size = 256) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext('2d')
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

async function mockRemoveAvatar() {
  await wait(MOCK_DELAY_MS);

  updateUser({ avatar_url: null });
  return { avatar_url: null };
}

function isUsernameTaken(username, user) {
  const wanted = username.toLowerCase();
  return mockAccounts.some((a) => a.user.email !== user.email && a.user.username?.toLowerCase() === wanted);
}

async function mockCheckUsername({ username }) {
  await wait(300);

  const user = requireUser();
  const wanted = username?.trim() ?? '';
  if (!USERNAME_PATTERN.test(wanted)) {
    throw validationError('The given data was invalid.', { username: [MESSAGES.usernameFormat] });
  }
  return { available: !isUsernameTaken(wanted, user) };
}

async function mockCompleteOnboarding({ path, goals = [], profile = {} }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  const displayName = profile.display_name?.trim() ?? '';
  const username = profile.username?.trim() ?? '';
  const bio = profile.bio?.trim() || null;
  const roles = profile.roles ?? [];

  const errors = {};
  if (!ONBOARDING_PATHS.includes(path)) errors.path = ['Choose how you want to use Khameo.'];
  if (goals.length > MAX_GOALS || goals.some((g) => !ONBOARDING_GOALS.includes(g))) errors.goals = ['Choose up to 3.'];
  if (!displayName) errors['profile.display_name'] = [MESSAGES.displayName];
  else if (displayName.length > MAX_DISPLAY_NAME) errors['profile.display_name'] = ['Use up to 80 characters.'];
  if (!USERNAME_PATTERN.test(username)) {
    errors['profile.username'] = [MESSAGES.usernameFormat];
  } else if (isUsernameTaken(username, user)) {
    errors['profile.username'] = [MESSAGES.usernameTaken];
  }
  if (bio?.length > MAX_BIO) errors['profile.bio'] = ['Use up to 160 characters.'];
  Object.assign(errors, roleErrors(roles));
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  return updateUser({
    onboarded_at: new Date().toISOString(),
    onboarding_path: path,
    display_name: displayName,
    username,
    bio,
    roles,
  });
}

function roleErrors(roles) {
  const errors = {};
  if (roles.length > MAX_ROLES) errors['profile.roles'] = ['Add up to 5 roles.'];
  roles.forEach(({ name, audiences = [] }, i) => {
    if (!name?.trim() || name.length > MAX_ROLE_NAME) {
      errors[`profile.roles.${i}.name`] = ['Use 1–40 characters for a role.'];
    } else if (roles.slice(0, i).some((other) => sameName(other.name ?? '', name))) {
      errors[`profile.roles.${i}.name`] = ['You already added this role.'];
    }
    if (audiences.length > MAX_CHECKED_AUDIENCES) {
      errors[`profile.roles.${i}.audiences`] = ['Check up to 20 audiences per role.'];
    } else if (audiences.some((a) => !a?.trim() || a.length > MAX_AUDIENCE_NAME)) {
      errors[`profile.roles.${i}.audiences`] = ['Use 1–40 characters for an audience.'];
    }
  });
  return errors;
}

const AI_CALLS_PER_MINUTE = 10;
const AI_SUGGESTIONS = 4;
let aiCalls = []; // timestamps

async function mockSuggestAudiences({ existing_audiences = [] }) {
  await wait(1000);

  requireUser();
  if (localStorage.getItem('khameo.mockAiDown')) {
    throw apiError(503, { message: 'AI suggestions aren’t available right now.', code: 'ai_unavailable' });
  }
  const now = Date.now();
  aiCalls = aiCalls.filter((time) => now - time < 60_000);
  if (aiCalls.length >= AI_CALLS_PER_MINUTE) {
    throw apiError(429, { message: 'Too many requests.', retry_after: Math.ceil((aiCalls[0] + 60_000 - now) / 1000) });
  }
  aiCalls.push(now);

  return {
    audiences: mockAiAudiences
      .filter((audience) => !existing_audiences.some((existing) => sameName(existing, audience)))
      .slice(0, AI_SUGGESTIONS),
  };
}

async function mockGetInvite(code) {
  await wait(MOCK_DELAY_MS);

  requireUser();
  return structuredClone(findInvite(code));
}

async function mockJoinGroup({ code, upgrade }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  if (!code?.trim()) throw validationError('The given data was invalid.', { code: ['Enter your invite code.'] });
  const { group, role } = findInvite(code);
  const existing = memberships.find((m) => m.email === user.email && m.membership.group.id === group.id);
  if (existing && upgrade && role === 'coach' && existing.membership.role === 'member') {
    existing.membership = { ...existing.membership, role };
    return existing.membership;
  }
  if (existing) {
    throw apiError(409, {
      message: 'You’re already in this group.',
      code: 'already_member',
      membership: existing.membership,
    });
  }

  const membership = {
    id: memberships.length + 1,
    group: { id: group.id, name: group.name, unit: group.unit },
    user_id: user.id,
    role,
    joined_at: new Date().toISOString(),
  };
  memberships.push({ email: user.email, membership });
  return membership;
}

async function mockSendTwoFactorCode() {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  return { message: 'We sent a code.', ...twoFactorCodes.send(user.email) };
}

async function mockConfirmTwoFactor({ code }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  if (user.two_factor_confirmed_at) return user;
  twoFactorCodes.check(user.email, code);
  return updateUser({ two_factor_confirmed_at: new Date().toISOString() });
}

const schoolCodeKey = (user, schoolEmail) => `${user.email}|${schoolEmail.trim().toLowerCase()}`;

async function mockSendSchoolEmailCode({ school_email = '' }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  const error = schoolEmailError(school_email.trim());
  if (error) throw validationError('The given data was invalid.', { school_email: [error] });
  return { message: 'We sent a code.', ...schoolEmailCodes.send(schoolCodeKey(user, school_email)) };
}

async function mockVerifySchoolEmail({ school_email = '', code }) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  schoolEmailCodes.check(schoolCodeKey(user, school_email), code);
  return { school_email: school_email.trim(), verified: true };
}

async function mockApplyToHost(application) {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  if (!user.two_factor_confirmed_at) {
    throw apiError(403, { message: 'Confirm two-factor first.', code: 'two_factor_required' });
  }
  const errors = hostApplicationErrors(application);
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);
  if (user.host_status === 'pending') {
    throw apiError(409, { message: 'You already have an application under review.', code: 'already_pending' });
  }
  if (user.host_status === 'verified') {
    throw apiError(409, { message: 'You’re already a verified Host.', code: 'already_verified' });
  }

  mockHostApplications[user.email] = {
    status: 'pending',
    submitted_at: new Date().toISOString(),
    rejection_reason: null,
  };
  updateUser({ host_status: 'pending' });
  return { status: 'pending' };
}

function hostApplicationErrors({
  host_type,
  school_email,
  school_code,
  institution,
  role_title,
  role_proof,
  organization_name,
  proof_link,
  proof_file,
}) {
  const errors = {};
  if (host_type === 'school') {
    const emailError = schoolEmailError(school_email ?? '');
    if (emailError) errors.school_email = [emailError];
    // The real API checks this is the code that verified school_email.
    if (!/^\d{6}$/.test(school_code ?? '')) errors.school_code = [HOST_MESSAGES.schoolCode];
    if (!institution?.trim()) errors.institution = [HOST_MESSAGES.institution];
    if (!role_title?.trim()) errors.role_title = [HOST_MESSAGES.roleTitle];
    if (!role_proof) errors.role_proof = [HOST_MESSAGES.proofMissing];
    else if (!isValidProof(role_proof)) errors.role_proof = [HOST_MESSAGES.proofInvalid];
  } else if (host_type === 'community') {
    if (!organization_name?.trim()) errors.organization_name = [HOST_MESSAGES.organization];
    if (!proof_link && !proof_file) errors.proof_file = [HOST_MESSAGES.communityProof];
    if (proof_link && !isValidProofLink(proof_link)) errors.proof_link = [HOST_MESSAGES.proofLink];
    if (proof_file && !isValidProof(proof_file)) errors.proof_file = [HOST_MESSAGES.proofInvalid];
  } else {
    errors.host_type = ['Choose a host type.'];
  }
  return errors;
}

async function mockGetLatestHostApplication() {
  await wait(MOCK_DELAY_MS);

  const user = requireUser();
  return (
    mockHostApplications[user.email] ?? {
      // After a reload only the status is left, on the mock session.
      status: user.host_status ?? 'none',
      submitted_at: null,
      rejection_reason: null,
    }
  );
}
