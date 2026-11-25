import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import ConsentScreen from '../components/ConsentScreen';

/**
 * The consent screen for users who finished onboarding without agreeing; record buttons open it
 * (useRecordingGate). Both choices go back to the page they came from.
 */
export default function RecordingConsentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { skipConsent } = useAuth();
  const goBack = () => navigate(location.state?.from ?? '/home', { replace: true });

  // "Not now" is remembered until the next log in, so RequireOnboarded doesn't ask again right away.
  return (
    <ConsentScreen
      onAgreed={goBack}
      onNotNow={() => {
        skipConsent();
        goBack();
      }}
    />
  );
}
