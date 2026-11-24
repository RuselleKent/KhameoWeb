import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Alert from '../../../../components/ui/Alert';
import Divider from '../../../../components/ui/Divider';
import Input from '../../../../components/ui/Input';
import { useAuth } from '../../../../hooks/useAuth';
import ProofUpload from '../../components/ProofUpload';
import StepActions from '../../components/StepActions';
import StepHeading from '../../components/StepHeading';
import { HOST_MESSAGES, isValidProofLink, MAX_ORGANIZATION } from '../../hostRules';
import { hostStepNote } from '../../hostSteps';
import { useHostApplication } from '../../useHostApplication';
import { useHostFlow } from '../../useHostFlow';
import { useOnboarding } from '../../useOnboarding';

/** Community hosts: name of the organization, and a link or a file as proof. No Figma frame; based on H3. */
export default function CommunityProofPage() {
  const { user } = useAuth();
  const { answers, updateHost, proofFile, setProofFile } = useOnboarding();
  const { host } = answers;
  const { base } = useHostFlow();
  const { submit, submitting, failed, fieldErrors, clearFieldError } = useHostApplication();
  const [linkTouched, setLinkTouched] = useState(false);

  if (host.type !== 'community') return <Navigate to={base} replace />;
  // Also how a 403 two_factor_required gets back there.
  if (!user.two_factor_confirmed_at) return <Navigate to={`${base}/two-factor`} replace />;

  const link = host.proof_link.trim();
  const linkInvalid = link !== '' && !isValidProofLink(link);
  const canSubmit = Boolean(host.organization_name.trim() && (link || proofFile) && !linkInvalid);

  function setField(field, value) {
    updateHost({ [field]: value });
    clearFieldError(field);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLinkTouched(true);
    if (canSubmit) submit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>Proof of your community · Khameo</title>

      <StepHeading
        pathId="host"
        note={hostStepNote(host.type, 'Community proof')}
        title="Tell us about your community"
        description="Share a page or an organization ID that shows you run it. A link or a file is enough."
      />

      <Input
        label="Organization or community name"
        autoComplete="organization"
        placeholder="Open Mic Mondays"
        maxLength={MAX_ORGANIZATION}
        disabled={submitting}
        value={host.organization_name}
        onChange={(e) => setField('organization_name', e.target.value)}
        error={fieldErrors.organization_name}
      />

      <div className="flex flex-col gap-3">
        <Input
          label="Link to your page"
          type="url"
          inputMode="url"
          placeholder="https://facebook.com/openmicmondays"
          disabled={submitting}
          value={host.proof_link}
          onChange={(e) => setField('proof_link', e.target.value)}
          onBlur={() => setLinkTouched(true)}
          error={linkTouched && linkInvalid ? HOST_MESSAGES.proofLink : fieldErrors.proof_link}
        />
        <Divider />
        <ProofUpload
          label="Proof of your community"
          file={proofFile}
          disabled={submitting}
          error={fieldErrors.proof_file}
          onChange={(file) => {
            setProofFile(file);
            clearFieldError('proof_file');
          }}
        />
      </div>

      <p className="text-[13.5px] leading-[18px] text-muted">
        Only Khameo admins see this. Files are deleted after review.
      </p>

      {failed && (
        <Alert variant="error" icon={false} title="Something went wrong">
          We couldn’t send your application. Check your connection and try again.
        </Alert>
      )}

      <StepActions
        backTo={`${base}/two-factor`}
        continueLabel="Submit application"
        continueDisabled={!canSubmit}
        loading={submitting}
        loadingText="Submitting…"
      />
    </form>
  );
}
