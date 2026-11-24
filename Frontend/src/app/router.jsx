import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorPage from './ErrorPage';
import RedirectIfAuthenticated from './RedirectIfAuthenticated';
import RequireAuth from './RequireAuth';
import RequireOnboarded from './RequireOnboarded';
import LandingPage from '../features/landing/LandingPage';
import WelcomePage from '../features/auth/pages/WelcomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import LoginVerifyPage from '../features/auth/pages/LoginVerifyPage';
import SignupPage from '../features/auth/pages/SignupPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import OnboardingRoot from '../features/onboarding/OnboardingRoot';
import OnboardingLayout from '../features/onboarding/components/OnboardingLayout';
import ConsentPage from '../features/onboarding/pages/ConsentPage';
import ChoosePathPage from '../features/onboarding/pages/ChoosePathPage';
import NextStepPage from '../features/onboarding/pages/NextStepPage';
import RequirePath from '../features/onboarding/components/RequirePath';
import TourPage from '../features/onboarding/pages/TourPage';
import TwoFactorPage from '../features/onboarding/pages/TwoFactorPage';
import GoalsPage from '../features/onboarding/pages/personal/GoalsPage';
import ProfilePage from '../features/onboarding/pages/personal/ProfilePage';
import ReadyPage from '../features/onboarding/pages/personal/ReadyPage';
import { PATHS } from '../features/onboarding/paths';
import HomePage from '../features/home/pages/HomePage';

// Redirect rules: docs/api-auth.md → "Session and redirect rules".
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      // Public: signed-in users are sent on to their next step (verify email, onboarding or /home).
      {
        element: <RedirectIfAuthenticated />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'welcome', element: <WelcomePage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'login/verify', element: <LoginVerifyPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
      // Signed in with a verified email.
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'onboarding',
            element: <OnboardingRoot />,
            children: [
              // Full-page screens with the auth split panel.
              { path: 'consent', element: <ConsentPage /> },
              { path: 'host/two-factor', element: <TwoFactorPage /> },
              {
                element: <OnboardingLayout />,
                children: [
                  { index: true, element: <ChoosePathPage />, handle: { step: 1, totalSteps: 4 } },
                  {
                    path: 'personal',
                    element: <RequirePath pathId="personal" />,
                    children: [
                      {
                        index: true,
                        element: <GoalsPage />,
                        handle: {
                          step: 2,
                          totalSteps: 4,
                          skip: { to: '/onboarding/personal/profile', clear: { goals: [] } },
                        },
                      },
                      { path: 'profile', element: <ProfilePage />, handle: { step: 3, totalSteps: 4 } },
                      {
                        path: 'ready',
                        element: <ReadyPage />,
                        handle: { step: 4, totalSteps: 4, wide: true, afterOnboarding: true },
                      },
                      {
                        path: 'tour',
                        element: <TourPage readyTo="/onboarding/personal/ready" />,
                        handle: { step: 4, totalSteps: 4, afterOnboarding: true },
                      },
                    ],
                  },
                  // Step 2 of the other paths; placeholders for now.
                  ...PATHS.filter(({ id }) => id !== 'personal').map(({ id }) => ({
                    path: id,
                    element: (
                      <NextStepPage
                        pathId={id}
                        continueTo={id === 'host' ? '/onboarding/host/two-factor' : undefined}
                      />
                    ),
                    handle: { step: 2, totalSteps: 4 },
                  })),
                  // H3, after two-factor; placeholder for now.
                  {
                    path: 'host/role-proof',
                    element: (
                      <NextStepPage
                        pathId="host"
                        title="Role proof"
                        backTo="/onboarding/host/two-factor"
                        requireTwoFactor
                      />
                    ),
                    handle: { step: 3, totalSteps: 4 },
                  },
                ],
              },
            ],
          },
          // Onboarding finished.
          {
            element: <RequireOnboarded />,
            children: [{ path: 'home', element: <HomePage /> }],
          },
        ],
      },
    ],
  },
]);
