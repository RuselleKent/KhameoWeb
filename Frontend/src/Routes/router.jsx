import { createBrowserRouter, Navigate } from 'react-router';
import App from '../App';
import ErrorPage from '../Shared/ErrorPage';
import PingTest from '../Shared/PingTest';
import Welcome from '../Authentication/Welcome';
import Login from '../Authentication/Login';
import CreateAccount from '../Authentication/CreateAccount';
import VerifyEmail from '../Authentication/VerifyEmail';
import Consent from '../Authentication/Consent';

  	export const router = createBrowserRouter([
    {
      	path: '/',
      	element: <App />,
      	errorElement: <ErrorPage />,
      	children: [
        	{ index: true, element: <Navigate to="/welcome" replace /> },
        	{ path: 'welcome', element: <Welcome /> },
        	{ path: 'login', element: <Login /> },
        	{ path: 'create-account', element: <CreateAccount /> },
        	{ path: 'ping-test', element: <PingTest /> },
			{ path: 'verify-email', element: <VerifyEmail /> },
			{ path: 'consent', element: <Consent /> },
      	],
    },
]);