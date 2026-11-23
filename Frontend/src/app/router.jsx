import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorPage from './ErrorPage';
import LandingPage from '../features/landing/LandingPage';
import PingTest from '../features/dev/PingTest';

// Auth routes (welcome, login, create-account) were removed with the old
// src/Authentication/ files. Re-add them here from src/features/auth/pages/.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'ping-test', element: <PingTest /> },
    ],
  },
]);
