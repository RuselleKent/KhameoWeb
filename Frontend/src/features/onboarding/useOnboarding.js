import { useContext } from 'react';
import { OnboardingContext } from './onboardingContext';

/** { answers, updateAnswers, updateProfile, updateHost, proofFile, setProofFile } — see OnboardingProvider.jsx. */
export function useOnboarding() {
  const onboarding = useContext(OnboardingContext);
  if (!onboarding) throw new Error('useOnboarding() must be used inside <OnboardingProvider>.');
  return onboarding;
}

export default useOnboarding;
