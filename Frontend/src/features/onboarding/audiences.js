// Speaking roles and their default audiences on the profile step. Static: they work without AI.

export const MAX_ROLES = 5;
export const MAX_ROLE_NAME = 40;
export const MAX_AUDIENCE_NAME = 40;
export const MAX_CHECKED_AUDIENCES = 20;

/** Preset role → its default audiences. The keys, in this order, are the role chips. */
export const DEFAULT_AUDIENCES = {
  Student: [
    'Classmates',
    'Professors',
    'Thesis Panel',
    'Org Members',
    'Job Interviewers',
    'Scholarship Panel',
    'Debate Judges',
    'Freshmen',
  ],
  'Teacher or faculty': [
    'Students',
    'Parents',
    'Fellow Faculty',
    'School Administrators',
    'Seminar Attendees',
    'Accreditation Panel',
  ],
  'Working professional': [
    'Clients',
    'Team Members',
    'Managers',
    'Job Interviewers',
    'Conference Audience',
    'Investors',
  ],
  Researcher: ['Research Panel', 'Conference Audience', 'Funding Committee', 'Peer Reviewers', 'Community Partners'],
  'Event host or emcee': [
    'Event Guests',
    'Wedding Guests',
    'Corporate Audience',
    'School Assembly',
    'Livestream Viewers',
  ],
};

export const PRESET_ROLES = Object.keys(DEFAULT_AUDIENCES);

/** Default audiences of a role the user typed. */
export const CUSTOM_ROLE_AUDIENCES = [
  'General Audience',
  'Colleagues',
  'Friends and Family',
  'Online Audience',
  'Interview Panel',
];
