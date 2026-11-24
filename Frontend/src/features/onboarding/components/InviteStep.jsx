import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../../components/ui/Alert';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import { getErrorInfo } from '../../../lib/apiErrors';
import { getInvite, joinGroup } from '../onboarding.api';
import { useOnboarding } from '../useOnboarding';
import InvitePreview from './InvitePreview';
import PathCard from './PathCard';
import StepActions from './StepActions';
import StepHeading from './StepHeading';

// 4–12 letters, numbers and hyphens (docs/api-onboarding.md section 4).
const MIN_CODE_LENGTH = 4;
const MAX_CODE_LENGTH = 12;
const ROLE_NAMES = { member: 'a Member', coach: 'a Coach', co_host: 'a Co-Host', primary_host: 'the Primary Host' };

/**
 * "Do you have an invite code?", shared by the member and coach paths.
 * Yes: look the code up, preview the group, join it. Not yet: continue on the personal path.
 * - `role` is the role this path's codes give ('member' | 'coach'); it's also the path's id
 * - `copy` holds the texts that differ; `preview(invite, joined)` returns InvitePreview's title, host and note
 */
export default function InviteStep({ role, copy, preview }) {
  const navigate = useNavigate();
  const { answers, updateAnswers } = useOnboarding();
  const joined = answers.joined[role];

  const [hasCode, setHasCode] = useState(answers.startedAs !== role);
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [codeError, setCodeError] = useState(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  // "You're a Member … Join as Coach instead?"
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);

  const invite = joined?.invite ?? found;

  function handleCodeChange(e) {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, MAX_CODE_LENGTH));
    setFound(null);
    setCodeError(null);
    setFailed(false);
  }

  function goToProfile() {
    navigate(`/onboarding/${role}/profile`);
  }

  function saveJoined(membership) {
    updateAnswers({
      path: role,
      startedAs: null,
      // A Member who became a Coach is no longer a Member of that group.
      joined: {
        ...(answers.joined.member?.invite.group.id === found.group.id ? {} : answers.joined),
        [role]: { invite: found, membership },
      },
    });
    goToProfile();
  }

  async function lookUp() {
    const result = await getInvite(code);
    if (result.role === role) setFound(result);
    else setCodeError(copy.wrongType);
  }

  async function join() {
    try {
      saveJoined(await joinGroup({ code: found.code }));
    } catch (error) {
      if (getErrorInfo(error).code !== 'already_member') throw error;
      const { membership } = error.response.data;
      if (membership?.role === role) {
        // Already in with this role, e.g. joined earlier, then reloaded.
        saveJoined(membership);
      } else if (role === 'coach' && membership?.role === 'member') {
        // A coach code can upgrade a Member, but only once they say so.
        setConfirmingUpgrade(true);
      } else {
        setFound(null);
        setCodeError(`You’re already in this group as ${ROLE_NAMES[membership?.role] ?? 'a member'}.`);
      }
    }
  }

  async function handleUpgrade() {
    setBusy(true);
    setFailed(false);
    try {
      saveJoined(await joinGroup({ code: found.code, upgrade: true }));
    } catch (error) {
      setConfirmingUpgrade(false);
      if (getErrorInfo(error).status === 404) {
        setFound(null);
        setCodeError(copy.notFound);
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;

    if (joined) {
      updateAnswers({ path: role, startedAs: null });
      goToProfile();
      return;
    }
    if (!hasCode) {
      updateAnswers({ path: 'personal', startedAs: role });
      navigate('/onboarding/personal/profile');
      return;
    }

    setBusy(true);
    setFailed(false);
    try {
      await (found ? join() : lookUp());
    } catch (error) {
      if (getErrorInfo(error).status === 404) {
        setFound(null);
        setCodeError(copy.notFound);
      } else {
        setFailed(true);
      }
    } finally {
      setBusy(false);
    }
  }

  function continueLabel() {
    if (joined) return 'Continue';
    if (!hasCode) return 'Continue with personal practice';
    return found ? copy.joinLabel(found) : 'Find group';
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>{`${copy.title} · Khameo`}</title>

      <StepHeading pathId={role} title={copy.title} description={copy.description} />

      {!joined && (
        <div role="radiogroup" aria-label={copy.title} className="flex flex-col gap-3">
          <PathCard
            name="has-code"
            value="yes"
            title={copy.yesTitle}
            description={copy.yesDescription}
            checked={hasCode}
            disabled={busy}
            onChange={() => setHasCode(true)}
          />
          <PathCard
            name="has-code"
            value="not-yet"
            title="Not yet"
            description={copy.notYetDescription}
            checked={!hasCode}
            disabled={busy}
            onChange={() => setHasCode(false)}
          />
        </div>
      )}

      {!joined && hasCode && (
        <Input
          label={copy.codeLabel}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={busy}
          value={code}
          onChange={handleCodeChange}
          error={codeError}
          hint={codeError ? undefined : copy.codeHint}
          inputClassName="font-semibold tracking-[0.12em]"
        />
      )}

      <div aria-live="polite" className="empty:hidden">
        {(joined || (hasCode && found)) && (
          <InvitePreview invite={invite} badge={joined ? 'Joined' : 'Code matched'} {...preview(invite, Boolean(joined))} />
        )}
      </div>

      {failed && (
        <Alert variant="error" icon={false} title="Something went wrong">
          Check your connection and try again.
        </Alert>
      )}

      <StepActions
        backTo="/onboarding"
        continueLabel={continueLabel()}
        continueDisabled={!joined && hasCode && !found && (code.length < MIN_CODE_LENGTH || Boolean(codeError))}
        loading={busy}
        loadingText={found ? 'Joining…' : 'Checking…'}
      />

      <ConfirmDialog
        open={confirmingUpgrade}
        variant="primary"
        title="Join as Coach instead?"
        confirmLabel="Join as Coach"
        loading={busy}
        loadingText="Joining…"
        onConfirm={handleUpgrade}
        onCancel={() => setConfirmingUpgrade(false)}
      >
        {found && `You’re a Member of ${found.group.unit ?? found.group.name}. As a Coach you’ll review submissions and give feedback there.`}
      </ConfirmDialog>

      {!joined && !hasCode && <p className="text-[13.5px] leading-[18px] text-muted">{copy.notYetFooter}</p>}
    </form>
  );
}
