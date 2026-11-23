// Mock authenticated user.
// TODO: docs/api-auth.md was empty when this was written. These fields come
// from the Laravel users table (Backend/database/migrations) as returned by
// GET /api/user. Update to the exact contract shape once api-auth.md is filled.
export const mockUser = {
  id: 1,
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@example.com',
  email_verified_at: '2026-11-20T08:00:00.000000Z',
  created_at: '2026-11-20T08:00:00.000000Z',
  updated_at: '2026-11-20T08:00:00.000000Z',
};

export default mockUser;
