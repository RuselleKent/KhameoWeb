import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorPage from './ErrorPage';
import LandingPage from '../features/landing/LandingPage';
import PingTest from '../features/dev/PingTest';
import WelcomePage from '../features/auth/pages/WelcomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'welcome', element: <WelcomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'ping-test', element: <PingTest /> },
    ],
  },
]);
