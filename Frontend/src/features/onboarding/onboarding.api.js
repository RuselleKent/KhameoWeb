import api, { getCsrfCookie } from '../../lib/api';
import { apiError, requireSession, updateSessionUser, validationError, wait } from '../../mockdata/mockServer';
import { mockInvites, ONBOARDING_GOALS, ONBOARDING_PATHS } from '../../mockdata/onboarding';

// Flip to false once the endpoints in docs/api-onboarding.md are ready.
const USE_MOCK = true;
const MOCK_DELAY_MS = 700;

// ---- Requests ----------------------------------------------------------------
// Every function resolves with the response body and rejects with the axios error.

/** PATCH /api/user/consent → user with consent_at (null when research_consent is false). */
export async function saveConsent({ research_consent }) {
  if (USE_MOCK) return mockSaveConsent({ research_consent });

  await getCsrfCookie();
  const { data } = await api.patch('/api/user/consent', { research_consent });
  return data;
}

/** PATCH /api/user/onboarding → user with onboarded_at. 422: errors.path, errors.goals, errors['profile.display_name']. */
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

/** POST /api/host-applications (multipart) → { status: 'pending' }. `role_proof` is a File. */
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
// Memberships and host applications live in memory until a reload.

const MAX_GOALS = 3;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const memberships = [];
const pendingApplicants = new Set(); // user emails (mock ids can repeat after a reload)

function findInvite(code) {
  const wanted = (code ?? '').trim().toUpperCase();
  const invite = mockInvites.find((i) => i.code === wanted);
  if (!invite) throw apiError(404, { message: 'We couldn’t find that invite code.' });
  return invite;
}

async function mockSaveConsent({ research_consent }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  if (typeof research_consent !== 'boolean') {
    throw validationError('The given data was invalid.', { research_consent: ['Choose whether you agree.'] });
  }
  return updateSessionUser({
    consent_at: research_consent ? (user.consent_at ?? new Date().toISOString()) : null,
  });
}

async function mockCompleteOnboarding({ path, goals = [], profile = {} }) {
  await wait(MOCK_DELAY_MS);

  requireSession();
  const errors = {};
  if (!ONBOARDING_PATHS.includes(path)) errors.path = ['Choose how you want to use Khameo.'];
  if (goals.length > MAX_GOALS || goals.some((g) => !ONBOARDING_GOALS.includes(g))) errors.goals = ['Choose up to 3.'];
  if (!profile.display_name?.trim()) errors['profile.display_name'] = ['Enter a display name.'];
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);

  return updateSessionUser({ onboarded_at: new Date().toISOString() });
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
    throw apiError(409, { message: 'You’re already in this group.', error: 'already_member' });
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

async function mockApplyToHost({ school_email, school_code, role_proof }) {
  await wait(MOCK_DELAY_MS);

  const user = requireSession();
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(school_email ?? '')) errors.school_email = ['Enter a valid school email.'];
  if (!school_code?.trim()) errors.school_code = ['Enter your school code.'];
  if (!role_proof) errors.role_proof = ['Upload proof of your role.'];
  else if (!PROOF_TYPES.includes(role_proof.type) || role_proof.size > MAX_PROOF_BYTES) {
    errors.role_proof = ['Upload a JPG, PNG or PDF up to 5 MB.'];
  }
  if (Object.keys(errors).length > 0) throw validationError('The given data was invalid.', errors);
  if (pendingApplicants.has(user.email)) {
    throw apiError(409, { message: 'You already have an application under review.', error: 'already_pending' });
  }

  pendingApplicants.add(user.email);
  return { status: 'pending' };
}
