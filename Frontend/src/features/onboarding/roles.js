import {
  CUSTOM_ROLE_AUDIENCES,
  DEFAULT_AUDIENCES,
  MAX_AUDIENCE_NAME,
  MAX_CHECKED_AUDIENCES,
  PRESET_ROLES,
} from './audiences';

// While editing, a role is { name, audiences: [{ name, source, checked }] }, source 'default' | 'ai' | 'own'.
// toApiRoles() turns that into what is saved. Every function returns a new role; none change their input.

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Trims, collapses spaces and cuts to `max` characters. */
export const cleanName = (name, max) => name.trim().replace(/\s+/g, ' ').slice(0, max).trim();

export const checkedCount = (role) => role.audiences.filter((a) => a.checked).length;
export const isFull = (role) => checkedCount(role) >= MAX_CHECKED_AUDIENCES;

/** A new role with its default audiences, none checked. Typing a preset's name gives that preset. */
export function createRole(name) {
  const preset = PRESET_ROLES.find((p) => sameName(p, name));
  return {
    name: preset ?? name,
    audiences: (preset ? DEFAULT_AUDIENCES[preset] : CUSTOM_ROLE_AUDIENCES).map((audience) => ({
      name: audience,
      source: 'default',
      checked: false,
    })),
  };
}

export function setAudienceChecked(role, audienceName, checked) {
  if (checked && isFull(role)) return role;
  return { ...role, audiences: role.audiences.map((a) => (a.name === audienceName ? { ...a, checked } : a)) };
}

/** Adds the user's own audience, checked. One that is already listed is checked instead. */
export function addOwnAudience(role, audienceName) {
  if (isFull(role)) return role;
  const existing = role.audiences.find((a) => sameName(a.name, audienceName));
  if (existing) return setAudienceChecked(role, existing.name, true);
  return { ...role, audiences: [...role.audiences, { name: audienceName, source: 'own', checked: true }] };
}

/** The suggestions that would be new next to `role`'s audiences: cleaned, and without repeats. */
function newSuggestions(kept, names) {
  return names.reduce((fresh, raw) => {
    const name = typeof raw === 'string' ? cleanName(raw, MAX_AUDIENCE_NAME) : '';
    const known = [...kept, ...fresh].some((a) => sameName(a.name, name));
    return name && !known ? [...fresh, { name, source: 'ai', checked: false }] : fresh;
  }, []);
}

/**
 * Puts AI suggestions into the role. Earlier AI suggestions that aren't checked are replaced; checked ones,
 * defaults and the user's own stay. With nothing new, the role is returned unchanged.
 */
export function applySuggestions(role, names) {
  const kept = role.audiences.filter((a) => a.source !== 'ai' || a.checked);
  const fresh = newSuggestions(kept, names);
  return fresh.length > 0 ? { ...role, audiences: [...kept, ...fresh] } : role;
}

/** profile.roles for PATCH /api/user/onboarding: only checked audiences are saved. */
export function toApiRoles(roles) {
  return roles.map((role) => ({
    name: role.name,
    audiences: role.audiences.filter((a) => a.checked).map((a) => a.name),
  }));
}
