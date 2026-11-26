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

// What the mock "AI" suggests, for any role.
export const mockAiAudiences = [
  'Student Council',
  'Adviser',
  'Department Faculty',
  'Scholarship Committee',
  'Internship Interviewers',
  'Online Class',
  'Alumni',
  'Guest Speakers',
  'Barangay Officials',
  'Local Businesses',
  'Nonprofit Partners',
  'Press and Media',
  'Workshop Participants',
  'Podcast Listeners',
  'Contest Judges',
  'New Hires',
  'Board of Directors',
  'Startup Mentors',
  'Parents Association',
  'Community Leaders',
  'Book Club',
  'Youth Groups',
  'Sports Team',
  'Award Committee',
];

const speechCenter = {
  id: 1,
  name: 'ACLC Speech Center',
  unit: 'BSIT 4-A',
  visibility: 'private',
  members_count: 28,
  description: 'Speech practice and graded talks for BSIT 4-A.',
  cover_url: null,
};
const primaryHost = { id: 10, name: 'Maria Santos' };

export const mockInvites = [
  {
    code: 'ACLC-4A',
    type: 'group',
    role: 'member',
    group: speechCenter,
    invited_by: primaryHost,
    next_event: { title: 'Storytelling Night', starts_at: '2026-12-04T11:30:00.000000Z' },
    pending_reviews_count: null,
  },
  {
    code: 'COACH-RINA',
    type: 'coach',
    role: 'coach',
    group: speechCenter,
    invited_by: primaryHost,
    next_event: null,
    pending_reviews_count: 7,
  },
];

// Latest host application per user email (GET /api/host-applications/latest).
export const mockHostApplications = {
  'maria.santos@example.com': {
    status: 'verified',
    submitted_at: '2026-11-19T08:09:00.000000Z',
    rejection_reason: null,
  },
  'paolo.reyes@example.com': {
    status: 'rejected',
    submitted_at: '2026-11-18T08:09:00.000000Z',
    rejection_reason: 'Your faculty ID photo is too blurry to read. Please upload a clearer copy.',
  },
};
