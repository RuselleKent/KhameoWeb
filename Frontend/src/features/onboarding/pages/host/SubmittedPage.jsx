import { Navigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { cn } from '../../../../lib/utils';
import StepHeading from '../../components/StepHeading';
import { hostStepNote } from '../../hostSteps';
import { hasHostApplication } from '../../hostRules';
import { useOnboarding } from '../../useOnboarding';

const DONE = 'bg-success-soft text-success';
const IN_REVIEW = 'bg-[#FBEFCF] text-[#8A6100]';

function StatusRow({ title, description, done = false }) {
  const tone = done ? DONE : IN_REVIEW;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-field bg-white px-4 py-3.5">
      <span
        aria-hidden="true"
        className={cn('grid size-[22px] shrink-0 place-items-center rounded-full text-xs font-bold', tone)}
      >
        {done ? '✓' : '…'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5 font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[17px] break-words text-muted">{description}</p>
      </div>
      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs leading-4 font-semibold', tone)}>
        {done ? 'Done' : 'In review'}
      </span>
    </li>
  );
}

export default function SubmittedPage() {
  const { user } = useAuth();
  const { host } = useOnboarding().answers;

  if (!hasHostApplication(user)) return <Navigate to="/onboarding/host" replace />;

  // Null when the application was sent from another tab or device: then only its status is known.
  const { submitted } = host;
  const school = host.type === 'school';

  return (
    <div className="flex flex-col gap-6">
      <title>Application submitted · Khameo</title>

      <StepHeading
        pathId="host"
        note={submitted ? hostStepNote(host.type, 'Submitted') : 'Host verification · Submitted'}
        title="Your host application is in review"
        description={`An admin checks your ${submitted && school ? 'role proof' : 'proof'} within 1–2 school days. We’ll email you and send a notification.`}
      />

      <ul className="flex flex-col gap-4 sm:gap-6">
        {!submitted && <StatusRow title="Application sent" description="We have everything we need from you." />}
        {submitted && school && (
          <>
            <StatusRow done title="School email verified" description={host.school_email} />
            <StatusRow
              title="Role proof uploaded"
              description={[submitted.file_name, host.institution].filter(Boolean).join(' · ')}
            />
          </>
        )}
        {submitted && !school && (
          <>
            <StatusRow done title="Email verified" description={user.email} />
            <StatusRow
              title="Community proof sent"
              description={[host.organization_name, submitted.file_name ?? host.proof_link].filter(Boolean).join(' · ')}
            />
          </>
        )}
        <StatusRow
          done
          title="Two-factor authentication on"
          description="You’ll enter a code each time you log in."
        />
      </ul>

      <div className="rounded-[14px] border border-[#F6C9A8] bg-[#FFF4EC] px-[18px] py-4">
        <p className="text-[15px] leading-5 font-semibold text-ink">Wait for approval to create groups</p>
        <p className="mt-[3px] text-[13px] leading-[17px] text-muted">
          You can use Khameo now: practice on your own and join groups with invite codes. Creating groups unlocks after
          the Administrator approves you.
        </p>
      </div>

      <Button size="blockLg" to="/onboarding/host/profile">
        Continue to profile
      </Button>
    </div>
  );
}
