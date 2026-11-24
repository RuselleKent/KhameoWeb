// Mock users. Field names follow "The user object" in docs/api-auth.md and docs/api-onboarding.md.

// A brand-new account: nothing verified, agreed to or filled in yet.
export const blankUser = {
  id: 0,
  name: '',
  email: '',
  email_verified_at: null,
  recording_consent_at: null,
  consent_version: null,
  onboarded_at: null,
  onboarding_path: null,
  display_name: null,
  username: null,
  bio: null,
  occupation: null,
  avatar_url: null,
  two_factor_confirmed_at: null,
  host_status: 'none', // none | pending | verified | rejected
  created_at: null,
  updated_at: null,
};

export const mockUser = {
  ...blankUser,
  id: 1,
  name: 'Jane Cruz',
  email: 'jane.cruz@gmail.com',
  email_verified_at: '2026-11-20T08:00:00.000000Z',
  recording_consent_at: '2026-11-20T08:06:00.000000Z',
  consent_version: '2026-11',
  onboarded_at: '2026-11-20T08:10:00.000000Z',
  onboarding_path: 'personal',
  display_name: 'Jane Cruz',
  username: 'jane_cruz',
  occupation: 'Student',
  created_at: '2026-11-20T08:00:00.000000Z',
  updated_at: '2026-11-20T08:00:00.000000Z',
};

// Verified but hasn't finished onboarding: logging in lands on /onboarding.
const mockCoach = {
  ...blankUser,
  id: 2,
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@example.com',
  email_verified_at: '2026-11-21T09:30:00.000000Z',
  created_at: '2026-11-21T09:30:00.000000Z',
  updated_at: '2026-11-21T09:30:00.000000Z',
};

// A Host with two-factor on: logging in asks for an emailed code (123456) at /login/verify.
const mockHost = {
  ...blankUser,
  id: 10,
  name: 'Maria Santos',
  email: 'maria.santos@example.com',
  email_verified_at: '2026-11-19T08:00:00.000000Z',
  recording_consent_at: '2026-11-19T08:06:00.000000Z',
  consent_version: '2026-11',
  onboarded_at: '2026-11-19T08:10:00.000000Z',
  onboarding_path: 'host',
  display_name: 'Maria Santos',
  username: 'maria_santos',
  occupation: 'Teacher or faculty',
  two_factor_confirmed_at: '2026-11-19T08:08:00.000000Z',
  host_status: 'verified',
  created_at: '2026-11-19T08:00:00.000000Z',
  updated_at: '2026-11-19T08:10:00.000000Z',
};

// A Host whose application was rejected: /host-status shows the reason and Reapply.
const mockRejectedHost = {
  ...blankUser,
  id: 11,
  name: 'Paolo Reyes',
  email: 'paolo.reyes@example.com',
  email_verified_at: '2026-11-18T08:00:00.000000Z',
  onboarded_at: '2026-11-18T08:10:00.000000Z',
  onboarding_path: 'host',
  display_name: 'Paolo Reyes',
  username: 'paolo_reyes',
  occupation: 'Teacher or faculty',
  two_factor_confirmed_at: '2026-11-18T08:08:00.000000Z',
  host_status: 'rejected',
  created_at: '2026-11-18T08:00:00.000000Z',
  updated_at: '2026-11-20T08:00:00.000000Z',
};

// Login credentials for the mock API only (Jane: verified + onboarded → /home;
// Juan: verified, not onboarded → /onboarding; Maria and Paolo: two-factor, then /home).
// The password is never part of a user object; auth.api.js returns `user` on success.
export const mockAccounts = [
  { email: mockUser.email, password: 'Password123', user: mockUser },
  { email: mockCoach.email, password: 'Password123', user: mockCoach },
  { email: mockHost.email, password: 'Password123', user: mockHost },
  { email: mockRejectedHost.email, password: 'Password123', user: mockRejectedHost },
];

export default mockUser;
