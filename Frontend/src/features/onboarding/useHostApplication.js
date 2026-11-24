import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getErrorInfo, getFieldErrors } from '../../lib/apiErrors';
import { applyToHost } from './onboarding.api';
import { useOnboarding } from './useOnboarding';

/**
 * Sends the host application. Once it's in, user.host_status is 'pending' and the host pages move on
 * by themselves (RequireNotSubmitted, TwoFactorPage).
 * - 403 two_factor_required: forgets the 2FA confirmation, so the page goes back to the 2FA step
 * - 409 already_pending / already_verified: there is one already, which is the same outcome
 * - 422 on the school email or code: forgets the verification, so the page goes back to it
 * Returns { submit, submitting, failed, fieldErrors, clearFieldError }.
 */
export function useHostApplication() {
  const { setUser } = useAuth();
  const { answers, updateHost, proofFile, setProofFile } = useOnboarding();
  const { host } = answers;
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // `submitted` is null when the application in review isn't this one, so its details aren't known here.
  function finish(hostStatus, submitted) {
    // The school code is used up; applying again needs a new one.
    updateHost({ submitted, school_code: null });
    setProofFile(null);
    setUser((user) => user && { ...user, host_status: hostStatus });
  }

  async function submit() {
    if (submitting) return;

    setSubmitting(true);
    setFailed(false);
    setFieldErrors({});
    try {
      await applyToHost(
        host.type === 'school'
          ? {
              host_type: 'school',
              school_email: host.school_email,
              school_code: host.school_code,
              institution: host.institution.trim(),
              role_title: host.role_title.trim(),
              role_proof: proofFile,
            }
          : {
              host_type: 'community',
              organization_name: host.organization_name.trim(),
              // At least one of these.
              ...(host.proof_link.trim() && { proof_link: host.proof_link.trim() }),
              ...(proofFile && { proof_file: proofFile }),
            },
      );
      finish('pending', { file_name: proofFile?.name ?? null });
    } catch (error) {
      const { code } = getErrorInfo(error);
      const errors = getFieldErrors(error);
      if (code === 'already_pending') {
        finish('pending', null);
      } else if (code === 'already_verified') {
        finish('verified', null);
      } else if (code === 'two_factor_required') {
        updateHost({ needs_two_factor: true });
        setUser((user) => user && { ...user, two_factor_confirmed_at: null });
      } else if (errors.school_email || errors.school_code) {
        updateHost({ school_code: null, school_email_error: errors.school_email ?? errors.school_code });
      } else if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        setFailed(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const clearFieldError = (field) => setFieldErrors((errors) => ({ ...errors, [field]: undefined }));

  return { submit, submitting, failed, fieldErrors, clearFieldError };
}
