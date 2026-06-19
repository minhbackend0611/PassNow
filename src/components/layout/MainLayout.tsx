import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';

export default function MainLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden relative max-w-7xl mx-auto w-full">
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
