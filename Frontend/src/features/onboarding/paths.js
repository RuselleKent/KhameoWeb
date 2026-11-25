/** The four ways to use Khameo. `id` is the API value and the step 2 URL: /onboarding/{id}. */
export const PATHS = [
  {
    id: 'personal',
    title: 'Personal use',
    description: 'Practice on your own to improve your speaking.',
  },
  {
    id: 'member',
    title: 'Join as a member',
    description: 'Join a class, team, or community with an invite code.',
    next: 'Next: we’ll ask for your invite code.',
  },
  {
    id: 'coach',
    title: 'Join as a coach',
    description: 'Review and guide members’ progress in a host’s group.',
    next: 'Next: we’ll ask for your coach invite code.',
  },
  {
    id: 'host',
    title: 'Join as a host',
    description: 'Create and run your own group. Needs host verification.',
    next: 'Next: verify that you can host (school email, role proof, 2FA).',
  },
];
