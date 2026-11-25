import { Navigate } from 'react-router-dom';
import Alert from '../../../../components/ui/Alert';
import Input from '../../../../components/ui/Input';
import { useAuth } from '../../../../hooks/useAuth';
import ProofUpload from '../../components/ProofUpload';
import StepActions from '../../components/StepActions';
import StepHeading from '../../components/StepHeading';
import { MAX_INSTITUTION, MAX_ROLE_TITLE } from '../../hostRules';
import { hostStepNote } from '../../hostSteps';
import { useHostApplication } from '../../useHostApplication';
import { useHostFlow } from '../../useHostFlow';
import { useOnboarding } from '../../useOnboarding';

export default function RoleProofPage() {
  const { user } = useAuth();
  const { answers, updateHost, proofFile, setProofFile } = useOnboarding();
  const { host } = answers;
  const { base } = useHostFlow();
  const { submit, submitting, failed, fieldErrors, clearFieldError } = useHostApplication();

  if (host.type !== 'school') return <Navigate to={base} replace />;
  if (!host.school_code) return <Navigate to={`${base}/school-email`} replace />;
  // Also how a 403 two_factor_required gets back there.
  if (!user.two_factor_confirmed_at) return <Navigate to={`${base}/two-factor`} replace />;

  const canSubmit = Boolean(host.institution.trim() && host.role_title.trim() && proofFile);

  function setField(field, value) {
    updateHost({ [field]: value });
    clearFieldError(field);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (canSubmit) submit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <title>Upload proof of your role · Khameo</title>

      <StepHeading
        pathId="host"
        note={hostStepNote(host.type, 'Role proof')}
        title="Upload proof of your role"
        description="A clear photo of your Faculty or Instructor ID, or an official letter from your school."
      />

      <Input
        label="Institution"
        autoComplete="organization"
        placeholder="ACLC College of Sta. Maria"
        maxLength={MAX_INSTITUTION}
        disabled={submitting}
        value={host.institution}
        onChange={(e) => setField('institution', e.target.value)}
        error={fieldErrors.institution}
      />
      <Input
        label="Your role"
        autoComplete="organization-title"
        placeholder="Instructor, thesis adviser"
        maxLength={MAX_ROLE_TITLE}
        disabled={submitting}
        value={host.role_title}
        onChange={(e) => setField('role_title', e.target.value)}
        error={fieldErrors.role_title}
      />
      <ProofUpload
        label="Proof of your role"
        file={proofFile}
        disabled={submitting}
        error={fieldErrors.role_proof}
        onChange={(file) => {
          setProofFile(file);
          clearFieldError('role_proof');
        }}
      />

      <p className="text-[13.5px] leading-[18px] text-muted">
        Only Khameo admins see this file. It is deleted after review.
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
