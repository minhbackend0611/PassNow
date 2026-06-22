import { Link, useLocation } from 'react-router-dom';
import { useChatStore } from '../../store/useChatStore';
import { useTransactionStore } from '../../store/useTransactionStore';

export default function BottomNavBar() {
  const location = useLocation();
  const { totalUnreadCount } = useChatStore();
  const { actionRequiredCount } = useTransactionStore();

  const isBrowseActive = location.pathname === '/browse' || (location.pathname === '/' && location.search !== '');
  const isHomeActive = location.pathname === '/' && location.search === '';

  const getLinkClass = (isActive: boolean) => {
    if (isActive) {
      return "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-2xl px-4 py-1 scale-90 transition-transform duration-150";
    }
    return "flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 active:bg-surface-container-highest rounded-2xl transition-colors";
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-2 pb-safe bg-surface dark:bg-inverse-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-xl">
      <Link to="/" className={getLinkClass(isHomeActive)}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="text-label-sm font-label-sm mt-1">Home</span>
      </Link>
      <Link to="/browse" className={getLinkClass(isBrowseActive)}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        <span className="text-label-sm font-label-sm mt-1">Browse</span>
      </Link>
      <Link to="/list" className={getLinkClass(location.pathname === '/list')}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>add_circle</span>
        <span className="text-label-sm font-label-sm mt-1">List</span>
      </Link>
      <Link to="/chat" className={`relative ${getLinkClass(location.pathname.startsWith('/chat'))}`}>
        <div className="relative">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>chat_bubble</span>
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
          )}
        </div>
        <span className="text-label-sm font-label-sm mt-1">Chats</span>
      </Link>
      <Link to="/profile" className={`relative ${getLinkClass(location.pathname.startsWith('/profile'))}`}>
        <div className="relative">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
          {actionRequiredCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
          )}
        </div>
        <span className="text-label-sm font-label-sm mt-1">Profile</span>
      </Link>
    </nav>
  );
}
