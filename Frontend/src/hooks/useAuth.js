import { useContext } from 'react';
import { AuthContext } from '../app/authContext';

/** { user, login, loginTwoFactor, register, logout, setUser } — see src/app/AuthProvider.jsx. */
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth() must be used inside <AuthProvider>.');
  return auth;
}

export default useAuth;
