import { Outlet } from 'react-router';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F3F6F5]">
      <Outlet />   {/* the current page appears here */}
    </div>
  );
}