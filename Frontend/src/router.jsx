import { createBrowserRouter, Navigate } from 'react-router';
import App from './App';
import ErrorPage from './ErrorPage';
import PingTest from './PingTest';
import Welcome from './Authentication/Welcome';
import Login from './Authentication/Login';
import CreateAccount from './Authentication/CreateAccount';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: <Welcome /> },
      { path: 'ping-test', element: <PingTest /> },
      { path: 'login', element: <Login /> },
      { path: 'create-account', element: <CreateAccount /> },
    ],
  },
]);