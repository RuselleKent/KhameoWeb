// Profile rules from docs/api-onboarding.md sections 2 and 3, used by the form and the mock API.
export const MAX_DISPLAY_NAME = 80;
export const MAX_USERNAME = 20;
export const MAX_BIO = 160;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const MESSAGES = {
  displayName: 'Enter a display name.',
  usernameFormat: 'Use 3–20 letters, numbers or underscores.',
  usernameTaken: 'That username is taken.',
  avatar: 'Upload a JPG, PNG or WEBP up to 5 MB.',
};

/** Both required fields are filled in (whether the username is free is the API's call). */
export function isProfileComplete(profile) {
  return Boolean(profile.display_name.trim()) && USERNAME_PATTERN.test(profile.username);
}
