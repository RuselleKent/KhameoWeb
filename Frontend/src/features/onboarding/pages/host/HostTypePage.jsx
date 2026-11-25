import { useNavigate } from 'react-router-dom';
import PathCard from '../../components/PathCard';
import StepActions from '../../components/StepActions';
import StepHeading from '../../components/StepHeading';
import { hostStepNote } from '../../hostSteps';
import { useHostFlow } from '../../useHostFlow';
import { useOnboarding } from '../../useOnboarding';

const TYPES = [
  {
    id: 'school',
    title: 'Institution host',
    description:
      'For schools and organizations. Create private groups for your own members over a school year or longer. Verify with your institution email and proof of your role.',
    next: 'school-email',
  },
  {
    id: 'community',
    title: 'Community host',
    description:
      'For clubs and short-term groups. You can create public groups. Turn on 2FA and share proof of your community.',
    next: 'two-factor',
  },
];

export default function HostTypePage() {
  const navigate = useNavigate();
  const { answers, updateHost, setProofFile } = useOnboarding();
  const { type } = answers.host;
  const { base, startFrom } = useHostFlow();

  function handleSubmit(e) {
    e.preventDefault();
    navigate(`${base}/${TYPES.find((option) => option.id === type).next}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>Verify that you can host · Khameo</title>

      <StepHeading
        pathId="host"
        note={hostStepNote(type, 'Host type')}
        title="Verify that you can host"
        description="Hosts create groups, share invite codes and run graded activities. We check every host to keep groups safe."
      />

      <div role="radiogroup" aria-label="Host type" className="flex flex-col gap-3">
        {TYPES.map((option) => (
          <PathCard
            key={option.id}
            name="host-type"
            value={option.id}
            title={option.title}
            description={option.description}
            checked={option.id === type}
            onChange={() => {
              updateHost({ type: option.id });
              // The proof differs per type, so a file chosen for the other one must not be sent.
              setProofFile(null);
            }}
          />
        ))}
      </div>

      <p className="text-[13.5px] leading-[18px] text-muted">
        Either way, you can practice and join groups while we review.
      </p>

      <StepActions backTo={startFrom} />
    </form>
  );
}
