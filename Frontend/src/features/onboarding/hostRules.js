// Host application rules from docs/api-onboarding.md section 8, used by the pages and the mock API.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A hint for the form only; the API decides which domains are accepted.
const FREE_PROVIDERS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.ph',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
];

export const PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const MAX_INSTITUTION = 120;
export const MAX_ROLE_TITLE = 80;
export const MAX_ORGANIZATION = 120;

export const HOST_MESSAGES = {
  schoolEmail: 'Enter a valid school email.',
  freeProvider: 'Use your school or organization email, not a free provider.',
  schoolCode: 'Verify your school email first.',
  institution: 'Enter your institution.',
  roleTitle: 'Enter your role.',
  organization: 'Enter your organization or community name.',
  proofLink: 'Enter a link that starts with https://.',
  communityProof: 'Add a link or upload a file.',
  proofMissing: 'Upload proof of your role.',
  proofInvalid: 'Upload a JPG, PNG or PDF up to 5 MB.',
};

/** Message for a school email that can't be used, or undefined. */
export function schoolEmailError(email) {
  if (!EMAIL_PATTERN.test(email)) return HOST_MESSAGES.schoolEmail;
  if (FREE_PROVIDERS.includes(email.split('@')[1].toLowerCase())) return HOST_MESSAGES.freeProvider;
  return undefined;
}

export function isValidProofLink(link) {
  try {
    const { protocol, hostname } = new URL(link);
    return protocol === 'https:' && hostname.includes('.');
  } catch {
    return false;
  }
}

/** The application can't be changed: it is being reviewed, or was approved. */
export function hasHostApplication(user) {
  return user.host_status === 'pending' || user.host_status === 'verified';
}

export function isValidProof(file) {
  return PROOF_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_PROOF_BYTES;
}
