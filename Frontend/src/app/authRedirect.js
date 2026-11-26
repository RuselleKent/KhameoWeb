/**
 * Where a signed-in user belongs right now (docs/api-auth.md → "Session and redirect rules"):
 * 1. email not verified          → /verify-email
 * 2. no recording consent        → /onboarding/consent (unless they picked "Not now" since logging in)
 * 3. onboarding not finished     → /onboarding
 * 4. otherwise                   → /home
 *
 * `consentSkipped` comes from AuthProvider (useAuth().consentSkipped).
 */
export function nextStepFor(user, { consentSkipped = false } = {}) {
  if (!user.email_verified_at) return '/verify-email';
  if (!user.recording_consent_at && !consentSkipped) return '/onboarding/consent';
  if (!user.onboarded_at) return '/onboarding';
  return '/home';
}
