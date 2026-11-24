import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Alert from '../../../../components/ui/Alert';
import Button from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { formatDay } from '../../../../lib/formatDate';
import { cn } from '../../../../lib/utils';
import { getLatestHostApplication } from '../../onboarding.api';

const STATUSES = {
  none: {
    title: 'You haven’t applied yet',
    body: 'Verified Hosts create groups, share invite codes and run graded activities.',
    action: 'Apply as a host',
  },
  pending: {
    chip: 'In review',
    chipClass: 'bg-[#FBEFCF] text-[#8A6100]',
    title: 'Your host application is in review',
    body: 'An admin checks it within 1–2 school days. You can use Khameo now, and create groups after the Administrator approves you.',
  },
  verified: {
    chip: 'Verified',
    chipClass: 'bg-success-soft text-success',
    title: 'You’re a verified Host',
    body: 'You can create groups and share invite codes.',
  },
  rejected: {
    chip: 'Not approved',
    chipClass: 'bg-[#FBE9E7] text-danger',
    title: 'Your application wasn’t approved',
    body: 'You can fix this and apply again.',
    action: 'Reapply',
  },
};

/** "Check host status". No Figma frame yet. */
export default function HostStatusPage() {
  const { setUser } = useAuth();
  // 'loading' | 'error' | 'ready'
  const [state, setState] = useState('loading');
  const [application, setApplication] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getLatestHostApplication().then(
      (latest) => {
        if (cancelled) return;
        setApplication(latest);
        setState('ready');
        // An admin may have decided since the app loaded.
        setUser((user) => user && { ...user, host_status: latest.status });
      },
      () => {
        if (!cancelled) setState('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, setUser]);

  const retry = useCallback(() => {
    setState('loading');
    setAttempt((n) => n + 1);
  }, []);

  const status = STATUSES[application?.status] ?? STATUSES.none;

  return (
    <div className="flex flex-col gap-6">
      <title>Host status · Khameo</title>
      <h1 className="text-[28px] leading-tight text-ink sm:text-[36px]">Host status</h1>

      {state === 'loading' && (
        <div role="status" className="grid place-items-center rounded-card border border-field bg-white py-16">
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-brand" />
          <span className="sr-only">Loading your host status</span>
        </div>
      )}

      {state === 'error' && (
        <>
          <Alert variant="error" icon={false} title="We couldn’t load your host status">
            Check your connection and try again.
          </Alert>
          <Button size="blockLg" onClick={retry}>
            Retry
          </Button>
        </>
      )}

      {state === 'ready' && (
        <>
          <section className="flex flex-col gap-3 rounded-card border border-field bg-white p-5 sm:p-6">
            {status.chip && (
              <span
                className={cn('w-fit rounded-full px-2.5 py-1 text-xs leading-4 font-semibold', status.chipClass)}
              >
                {status.chip}
              </span>
            )}
            <h2 className="text-xl leading-6 text-ink">{status.title}</h2>
            {application.rejection_reason && (
              <div className="rounded-xl border border-[#F3B7B1] bg-[#F1F1F1] px-4 py-3 text-sm leading-[21px]">
                <p className="font-bold text-danger">Reason</p>
                <p className="break-words text-ink">{application.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm leading-[21px] text-muted">{status.body}</p>
            {application.submitted_at && (
              <p className="text-[13px] leading-[17px] text-muted">
                Submitted {formatDay(application.submitted_at)}
              </p>
            )}
          </section>

          <div className="flex gap-3">
            <Button variant="secondary" size="lg" to="/home" className={status.action ? 'shrink-0' : 'flex-1'}>
              {status.action ? 'Home' : 'Go to my dashboard'}
            </Button>
            {status.action && (
              <Button size="blockLg" to="/host-application">
                {status.action}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
