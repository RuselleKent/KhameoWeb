// Mock users for the auth screens.
// TODO: docs/api-auth.md is still empty. These fields come from the Laravel
// users table (Backend/database/migrations) as returned by GET /api/user.
// Update to the exact contract shape once api-auth.md is agreed with Russel.

export const mockUser = {
  id: 1,
  name: 'Jane Cruz',
  email: 'jane.cruz@gmail.com',
  email_verified_at: '2026-11-20T08:00:00.000000Z',
  onboarded_at: '2026-11-20T08:10:00.000000Z',
  created_at: '2026-11-20T08:00:00.000000Z',
  updated_at: '2026-11-20T08:00:00.000000Z',
};

// Verified but hasn't finished onboarding: logging in lands on /onboarding.
const mockCoach = {
  id: 2,
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@example.com',
  email_verified_at: '2026-11-21T09:30:00.000000Z',
  onboarded_at: null,
  created_at: '2026-11-21T09:30:00.000000Z',
  updated_at: '2026-11-21T09:30:00.000000Z',
};

// Login credentials for the mock API only (Jane: verified + onboarded → /home;
// Juan: verified, not onboarded → /onboarding). The password is never part of a user
// object; auth.api.js returns `user` on success.
export const mockAccounts = [
  { email: mockUser.email, password: 'Password123', user: mockUser },
  { email: mockCoach.email, password: 'Password123', user: mockCoach },
];

export default mockUser;
