import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useTransactionStore } from '../../store/useTransactionStore';

export default function MainLayout() {
  const { user } = useAuthStore();
  const { initializeChatListener } = useChatStore();
  const { initializeTransactionListener } = useTransactionStore();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const unsubChat = initializeChatListener(user.uid);
      const unsubTx = initializeTransactionListener(user.uid);
      return () => {
        unsubChat();
        unsubTx();
      };
    }
  }, [user, initializeChatListener, initializeTransactionListener]);

  const isFullWidthPage = ['/how-it-works', '/about'].includes(location.pathname);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar />
      <div className={`flex flex-1 overflow-hidden relative w-full ${!isFullWidthPage ? 'max-w-7xl mx-auto' : ''}`}>
        <Outlet />
      </div>
      <BottomNavBar />
    </div>
  );
}
