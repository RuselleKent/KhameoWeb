/**
 * Where a signed-in user belongs right now (redirect rules in docs/api-auth.md):
 * email not verified → /verify-email, not onboarded → /onboarding, otherwise /home.
 */
export function nextStepFor(user) {
  if (!user.email_verified_at) return '/verify-email';
  if (!user.onboarded_at) return '/onboarding';
  return '/home';
}
