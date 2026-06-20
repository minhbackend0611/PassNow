import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../lib/firebase';

export default function TopNavBar() {
  const { user } = useAuthStore();

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-gutter py-stack-sm w-full bg-surface/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-stack-lg">
        <Link to="/" className="text-headline-lg font-headline-lg font-bold text-primary dark:text-primary-fixed">
          PassNow
        </Link>
        <nav className="hidden md:flex items-center gap-stack-md">
          <Link to="/" className="text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed pb-1">
            Browse
          </Link>
          <Link to="#" className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary transition-colors">
            How it Works
          </Link>
          <Link to="#" className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary transition-colors">
            About
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-stack-md">
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          <input className="pl-10 pr-4 py-2 bg-surface-container rounded-full border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-body-sm font-body-sm w-64 transition-all" placeholder="Search items..." type="text" />
        </div>
        
        <Link to="/list">
          <button className="bg-primary text-on-primary text-label-md font-label-md px-4 py-2 rounded-lg hover:bg-surface-tint transition-colors hidden sm:block">
            List an Item
          </button>
        </Link>

        {user ? (
          <div className="flex items-center gap-stack-sm">
            <Link to="/transactions" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all" title="Transactions">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </Link>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex-shrink-0 block hover:ring-2 hover:ring-primary transition-all" title="Profile">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center font-bold text-primary text-lg">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <button 
              onClick={handleSignOut} 
              className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container-high flex items-center justify-center" 
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </button>
          </div>
        ) : (
          <Link to="/login">
            <button className="text-on-surface-variant border border-outline-variant text-label-md font-label-md px-4 py-2 rounded-lg hover:bg-surface-container transition-colors hidden sm:block">
              Log In
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}
