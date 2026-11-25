import { getErrorInfo } from '../../lib/apiErrors';

// What a user may do, from the user object (docs/api-onboarding.md). The API enforces the same rules.

/** Solo Practice, activity submissions and Real Time Rehearsal need recording consent. */
export function canRecord(user) {
  return Boolean(user?.recording_consent_at);
}

/** Only verified Hosts create groups. */
export function canCreateGroup(user) {
  return user?.host_status === 'verified';
}

/** The API refused a recording because consent is missing (403 consent_required), e.g. withdrawn in another tab. */
export function isConsentRequired(error) {
  const { status, code } = getErrorInfo(error);
  return status === 403 && code === 'consent_required';
}
