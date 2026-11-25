import InviteStep from '../../components/InviteStep';

const COPY = {
  title: 'Do you have a coach invite?',
  description: 'Coaches join a host’s group with a coach code or link. The code gives you the Coach role.',
  yesTitle: 'Yes, I have a coach invite code',
  yesDescription: 'Your host shares it from Group settings → Staff.',
  notYetDescription: 'Coaches need an invite from a host. You can practice on your own meanwhile.',
  notYetFooter: 'When a host sends you a coach invite, open it or enter the code in Groups.',
  codeLabel: 'Coach invite code',
  codeHint: 'Ask the group’s host for a coach code.',
  notFound: 'We couldn’t find a coach invite with this code. Check it with your host, or ask for a new invite.',
  wrongType: 'This is a member invite code. Go back and choose “Join as a member” to use it.',
  joinLabel: () => 'Join as coach',
};

function preview({ group, invited_by, pending_reviews_count: pending }) {
  const unit = group.unit && `Unit ${group.unit}`;
  return {
    title: group.name,
    host: [
      `Primary Host: ${invited_by.name}`,
      unit,
      pending > 0 && `${pending} ${pending === 1 ? 'submission' : 'submissions'} waiting for review.`,
    ]
      .filter(Boolean)
      .join(' · '),
    note:
      `${invited_by.name} invited you as a Coach${unit ? ` for ${unit}` : ''}. ` +
      'You’ll review submissions, give feedback, and add private notes.',
  };
}

export default function InvitePage() {
  return <InviteStep role="coach" copy={COPY} preview={preview} />;
}
