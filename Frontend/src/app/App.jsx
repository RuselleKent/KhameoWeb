import { Outlet } from 'react-router-dom';
import AuthProvider from './AuthProvider';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {/* Inside the router so pages and guards can use both auth and navigation. */}
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </div>
  );
}
