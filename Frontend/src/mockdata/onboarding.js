// Mock data for onboarding. Field names follow docs/api-onboarding.md.

export const CONSENT_VERSION = '2026-11';

export const ONBOARDING_PATHS = ['personal', 'member', 'coach', 'host'];

export const ONBOARDING_GOALS = [
  'fewer_filler_words',
  'steady_pace',
  'confident_tone',
  'clear_opening',
  'strong_closing',
  'stay_on_time',
];

export const mockInvites = [
  {
    code: 'SPEAK-2026',
    type: 'group',
    role: 'member',
    group: { id: 1, name: 'BSCS 4A Public Speaking', members_count: 24 },
    invited_by: { id: 10, name: 'Maria Santos' },
  },
  {
    code: 'COACH-2026',
    type: 'coach',
    role: 'coach',
    group: { id: 1, name: 'BSCS 4A Public Speaking', members_count: 24 },
    invited_by: { id: 10, name: 'Maria Santos' },
  },
];
