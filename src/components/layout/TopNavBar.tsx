import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LogOut, Search, Menu } from 'lucide-react';

export default function TopNavBar() {
  const { user } = useAuthStore();

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 w-full bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold text-primary dark:text-primary-fixed">
          PassNow
        </Link>
        <nav className="hidden md:flex items-center gap-4">
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

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <Input 
            className="pl-9 pr-4 py-1.5 h-9 bg-surface-container rounded-full border-outline-variant focus-visible:border-primary w-64 transition-all" 
            placeholder="Search items..." 
            type="text" 
          />
        </div>
        
        <Button className="hidden sm:flex" variant="default" size="sm">
          List an Item
        </Button>

        {user ? (
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant flex-shrink-0 flex items-center justify-center font-bold text-primary">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="w-4 h-4 text-on-surface-variant hover:text-error" />
            </Button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
          </div>
        )}

        <button className="md:hidden text-on-surface p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
