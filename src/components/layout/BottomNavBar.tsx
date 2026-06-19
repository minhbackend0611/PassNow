import { Home, Search, PlusCircle, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNavBar() {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition-all ${
      isActive 
        ? 'bg-secondary-container text-on-secondary-container scale-90 duration-150' 
        : 'text-on-surface-variant active:bg-surface-container-highest hover:text-primary'
    }`;
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex md:hidden justify-around items-center px-4 py-2 pb-safe bg-surface dark:bg-inverse-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-xl border-t border-outline-variant/20">
      <Link to="/" className={getLinkClass('/')}>
        <Home className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link to="/browse" className={getLinkClass('/browse')}>
        <Search className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Browse</span>
      </Link>
      <Link to="/list" className={getLinkClass('/list')}>
        <PlusCircle className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">List</span>
      </Link>
      <Link to="/profile" className={getLinkClass('/profile')}>
        <UserIcon className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </nav>
  );
}
