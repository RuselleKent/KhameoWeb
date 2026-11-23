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
import OnboardingPage from '../features/onboarding/pages/OnboardingPage';
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
          { path: 'onboarding', element: <OnboardingPage /> },
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
