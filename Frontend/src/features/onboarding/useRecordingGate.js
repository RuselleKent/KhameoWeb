import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { canRecord } from './permissions';

/**
 * For every button that starts a recording:
 *
 *   const { guardRecording, openConsent } = useRecordingGate();
 *   <Button onClick={() => guardRecording(startRecording)}>Record</Button>
 *
 * Without recording consent, guardRecording opens the consent screen instead; the user comes back to this
 * page afterwards. If an upload fails with isConsentRequired(error), call openConsent().
 */
export function useRecordingGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const allowed = canRecord(user);

  const openConsent = useCallback(
    () => navigate('/recording-consent', { state: { from: pathname + search } }),
    [navigate, pathname, search],
  );
  const guardRecording = useCallback(
    (start) => {
      if (allowed) start();
      else openConsent();
    },
    [allowed, openConsent],
  );

  return { canRecord: allowed, guardRecording, openConsent };
}
