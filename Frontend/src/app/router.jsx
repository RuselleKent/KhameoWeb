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
import HostApplicationRoot from '../features/onboarding/HostApplicationRoot';
import OnboardingRoot from '../features/onboarding/OnboardingRoot';
import OnboardingLayout from '../features/onboarding/components/OnboardingLayout';
import ConsentPage from '../features/onboarding/pages/ConsentPage';
import ChoosePathPage from '../features/onboarding/pages/ChoosePathPage';
import RequireNotSubmitted from '../features/onboarding/components/RequireNotSubmitted';
import RequirePath from '../features/onboarding/components/RequirePath';
import TourPage from '../features/onboarding/pages/TourPage';
import TwoFactorPage from '../features/onboarding/pages/TwoFactorPage';
import GoalsPage from '../features/onboarding/pages/personal/GoalsPage';
import ProfilePage from '../features/onboarding/pages/personal/ProfilePage';
import ReadyPage from '../features/onboarding/pages/personal/ReadyPage';
import MemberInvitePage from '../features/onboarding/pages/member/InvitePage';
import MemberProfilePage from '../features/onboarding/pages/member/ProfilePage';
import MemberReadyPage from '../features/onboarding/pages/member/ReadyPage';
import CoachInvitePage from '../features/onboarding/pages/coach/InvitePage';
import CoachProfilePage from '../features/onboarding/pages/coach/ProfilePage';
import CoachReadyPage from '../features/onboarding/pages/coach/ReadyPage';
import HostTypePage from '../features/onboarding/pages/host/HostTypePage';
import SchoolEmailPage from '../features/onboarding/pages/host/SchoolEmailPage';
import RoleProofPage from '../features/onboarding/pages/host/RoleProofPage';
import CommunityProofPage from '../features/onboarding/pages/host/CommunityProofPage';
import HostStatusPage from '../features/onboarding/pages/host/HostStatusPage';
import HostSubmittedPage from '../features/onboarding/pages/host/SubmittedPage';
import HostProfilePage from '../features/onboarding/pages/host/ProfilePage';
import HostReadyPage from '../features/onboarding/pages/host/ReadyPage';
import HomePage from '../features/home/pages/HomePage';

// The member and coach paths have the same steps: invite code, profile, ready, tour.
function invitePathRoutes(pathId, invitePage, profilePage, readyPage) {
  return {
    path: pathId,
    element: <RequirePath pathId={pathId} />,
    children: [
      {
        index: true,
        element: invitePage,
        handle: {
          step: 2,
          totalSteps: 4,
          // Same as "Not yet".
          skip: {
            to: '/onboarding/personal/profile',
            clear: { path: 'personal', startedAs: pathId },
            hidden: (answers) => Boolean(answers.joined[pathId]),
          },
        },
      },
      { path: 'profile', element: profilePage, handle: { step: 3, totalSteps: 4 } },
      { path: 'ready', element: readyPage, handle: { step: 4, totalSteps: 4, wide: true, afterOnboarding: true } },
      {
        path: 'tour',
        element: <TourPage readyTo={`/onboarding/${pathId}/ready`} />,
        handle: { step: 4, totalSteps: 4, afterOnboarding: true },
      },
    ],
  };
}

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
                  invitePathRoutes('member', <MemberInvitePage />, <MemberProfilePage />, <MemberReadyPage />),
                  invitePathRoutes('coach', <CoachInvitePage />, <CoachProfilePage />, <CoachReadyPage />),
                  {
                    path: 'host',
                    element: <RequirePath pathId="host" />,
                    children: [
                      {
                        element: <RequireNotSubmitted />,
                        children: [
                          { index: true, element: <HostTypePage />, handle: { step: 2, totalSteps: 4 } },
                          { path: 'school-email', element: <SchoolEmailPage />, handle: { step: 2, totalSteps: 4 } },
                          // host/two-factor (above) comes between these.
                          { path: 'role-proof', element: <RoleProofPage />, handle: { step: 2, totalSteps: 4 } },
                          {
                            path: 'community-proof',
                            element: <CommunityProofPage />,
                            handle: { step: 2, totalSteps: 4 },
                          },
                        ],
                      },
                      { path: 'submitted', element: <HostSubmittedPage />, handle: { step: 2, totalSteps: 4 } },
                      { path: 'profile', element: <HostProfilePage />, handle: { step: 3, totalSteps: 4 } },
                      {
                        path: 'ready',
                        element: <HostReadyPage />,
                        handle: { step: 4, totalSteps: 4, wide: true, afterOnboarding: true },
                      },
                      {
                        path: 'tour',
                        element: <TourPage readyTo="/onboarding/host/ready" />,
                        handle: { step: 4, totalSteps: 4, afterOnboarding: true },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          // Onboarding finished.
          {
            element: <RequireOnboarded />,
            children: [
              { path: 'home', element: <HomePage /> },
              // Apply (or reapply) as a Host later; the same pages as in onboarding.
              {
                element: <HostApplicationRoot />,
                children: [
                  { path: 'host-application/two-factor', element: <TwoFactorPage /> },
                  {
                    element: <OnboardingLayout />,
                    children: [
                      { path: 'host-status', element: <HostStatusPage /> },
                      {
                        path: 'host-application',
                        element: <RequireNotSubmitted />,
                        children: [
                          { index: true, element: <HostTypePage /> },
                          { path: 'school-email', element: <SchoolEmailPage /> },
                          { path: 'role-proof', element: <RoleProofPage /> },
                          { path: 'community-proof', element: <CommunityProofPage /> },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
