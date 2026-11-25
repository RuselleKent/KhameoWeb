import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clockIcon from '../../../assets/onboarding/icon-clock.svg';
import micIcon from '../../../assets/onboarding/icon-mic.svg';
import refreshIcon from '../../../assets/onboarding/icon-refresh.svg';
import sparkIcon from '../../../assets/onboarding/icon-spark.svg';
import usersIcon from '../../../assets/onboarding/icon-users.svg';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import { useAuth } from '../../../hooks/useAuth';
import AuthLayout from '../../auth/components/AuthLayout';
import { saveConsent } from '../onboarding.api';
import { useOnboarding } from '../useOnboarding';

const POINTS = [
  {
    icon: micIcon,
    title: 'What we record',
    body: 'Solo sessions, group submissions and Real Time Rehearsals.',
  },
  {
    icon: sparkIcon,
    title: 'How AI is used',
    body: 'Only to transcribe and evaluate. Never used to train models. AI feedback can be wrong.',
  },
  {
    icon: usersIcon,
    title: 'Who can see it',
    body: 'You, and in groups only your Hosts and Coaches.',
  },
  {
    icon: clockIcon,
    title: 'How long we keep it',
    body: 'Stream-only. Deleted 90 days after the study period.',
  },
  {
    icon: refreshIcon,
    title: 'Your choice',
    body: 'Taking part is voluntary. You can withdraw any time in Settings.',
  },
];

export default function ConsentPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { updateAnswers } = useOnboarding();

  // Coming back with the browser's Back button after agreeing: show it as agreed, don't ask twice.
  const alreadyAgreed = Boolean(user.recording_consent_at);
  const [understood, setUnderstood] = useState(alreadyAgreed);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleAgree(e) {
    e.preventDefault();
    if (saving) return;
    if (alreadyAgreed) {
      navigate('/onboarding');
      return;
    }
    if (!understood) return;

    setSaving(true);
    setFailed(false);
    try {
      setUser(await saveConsent({ recording_consent: true }));
      navigate('/onboarding');
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  function handleNotNow() {
    updateAnswers({ consentSkipped: true });
    navigate('/onboarding');
  }

  return (
    <AuthLayout>
      <title>Before you record · Khameo</title>

      <form noValidate onSubmit={handleAgree} className="flex flex-col gap-4">
        <h1 className="text-[32px] leading-[1.2] text-ink">Before you record</h1>
        <p className="text-sm leading-[21px] text-muted">
          Your voice recordings are personal data. Here’s how Khameo uses them.
        </p>

        <ul className="flex flex-col gap-3.5 rounded-xl border border-divider bg-white p-[18px]">
          {POINTS.map(({ icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <img src={icon} alt="" width="18" height="18" className="shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h2 className="font-sans text-sm leading-[21px] font-semibold text-ink">{title}</h2>
                <p className="text-[13px] leading-[1.5] text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <Checkbox
          size="soft"
          checked={understood}
          disabled={saving || alreadyAgreed}
          onChange={(e) => setUnderstood(e.target.checked)}
        >
          I understand how my recordings are used, including for the KHAMEO thesis study, and I agree.
        </Checkbox>

        {failed && (
          <Alert variant="error" icon={false} title="Something went wrong">
            We couldn’t save your choice. Check your connection and try again.
          </Alert>
        )}

        <Button type="submit" size="block" disabled={!understood} loading={saving} loadingText="Saving…">
          {alreadyAgreed ? 'Continue' : 'Agree and continue'}
        </Button>
        {!alreadyAgreed && (
          <Button variant="ghostBrand" size="block" disabled={saving} onClick={handleNotNow}>
            Not now
          </Button>
        )}
      </form>
    </AuthLayout>
  );
}
