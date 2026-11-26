import { useNavigate } from 'react-router-dom';
import { nextStepFor } from '../../../app/authRedirect';
import { useAuth } from '../../../hooks/useAuth';
import ConsentScreen from '../components/ConsentScreen';

/**
 * The consent step (nextStepFor). Agree saves consent; "Not now" saves nothing and is remembered until the
 * next log in. Both go on to the next step: /onboarding for a new account, /home once onboarded.
 */
export default function ConsentPage() {
  const navigate = useNavigate();
  const { user, consentSkipped, skipConsent } = useAuth();

  return (
    <ConsentScreen
      onAgreed={(saved) => navigate(nextStepFor(saved, { consentSkipped }))}
      onNotNow={() => {
        skipConsent();
        navigate(nextStepFor(user, { consentSkipped: true }));
      }}
    />
  );
}
