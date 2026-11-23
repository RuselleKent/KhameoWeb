import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <Outlet />
    </div>
  );
}
