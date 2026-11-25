import InviteStep from '../../components/InviteStep';
import { groupLabel } from '../../groupLabel';
import { formatEventTime } from '../../../../lib/formatDate';

const COPY = {
  title: 'Do you have an invite code?',
  description: 'Members join a class, team or community with a code or link from its host.',
  yesTitle: 'Yes, I have an invite code',
  yesDescription: 'Enter the code from your host.',
  notYetDescription: 'Start with personal practice. You can join a group later from Groups.',
  notYetFooter: 'You can enter a code later from Groups → Join with code.',
  codeLabel: 'Invite code',
  codeHint: 'Ask your host if you don’t have one.',
  notFound: 'We couldn’t find a group with this code. Check it with your host, or ask for a new invite.',
  wrongType: 'This is a coach invite code. Go back and choose “Join as a coach” to use it.',
  joinLabel: (invite) => `Join ${groupLabel(invite.group)}`,
};

function preview({ group, invited_by, next_event }, joined) {
  const role = joined ? 'You joined as a Member.' : 'You’ll join as a Member.';
  return {
    title: groupLabel(group),
    host: [`Host: ${invited_by.name}`, group.description].filter(Boolean).join(' · '),
    note: next_event
      ? `${role} Next event: ${next_event.title} · ${formatEventTime(next_event.starts_at)}.`
      : role,
  };
}

export default function InvitePage() {
  return <InviteStep role="member" copy={COPY} preview={preview} />;
}
