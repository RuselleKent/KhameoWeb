import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorPage from './ErrorPage';
import RedirectIfAuthenticated from './RedirectIfAuthenticated';
import RequireAuth from './RequireAuth';
import RequireOnboarded from './RequireOnboarded';
import LandingPage from '../features/landing/LandingPage';
import WelcomePage from '../features/auth/pages/WelcomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import OnboardingRoot from '../features/onboarding/OnboardingRoot';
import OnboardingLayout from '../features/onboarding/components/OnboardingLayout';
import ConsentPage from '../features/onboarding/pages/ConsentPage';
import ChoosePathPage from '../features/onboarding/pages/ChoosePathPage';
import NextStepPage from '../features/onboarding/pages/NextStepPage';
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
              { path: 'consent', element: <ConsentPage /> },
              {
                element: <OnboardingLayout />,
                children: [
                  { index: true, element: <ChoosePathPage />, handle: { step: 1, totalSteps: 4 } },
                  // Step 2 of each path; placeholders for now.
                  ...PATHS.map(({ id }) => ({
                    path: id,
                    element: <NextStepPage pathId={id} />,
                    handle: { step: 2, totalSteps: 4 },
                  })),
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
