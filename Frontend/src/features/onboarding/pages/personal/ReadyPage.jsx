import ReadyStep from '../../components/ReadyStep';

const CARDS = [
  { title: 'Start a solo session', description: 'Practice any scenario now.' },
  { title: 'Join a group later', description: 'Use an invite code any time from Groups.' },
  { title: 'Explore your dashboard', description: 'See your home and schedule.' },
];

export default function ReadyPage() {
  return (
    <ReadyStep
      pathId="personal"
      description="Your practice space is set. Where to first?"
      cards={CARDS}
      profileTo="/onboarding/personal/profile"
      tourTo="/onboarding/personal/tour"
    />
  );
}
