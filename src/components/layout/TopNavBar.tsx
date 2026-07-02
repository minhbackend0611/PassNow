import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { auth } from '../../lib/firebase';
import { useDebounce } from '../../hooks/useDebounce';

export default function TopNavBar() {
  const { user } = useAuthStore();
  const { totalUnreadCount } = useChatStore();
  const { actionRequiredCount } = useTransactionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(localQuery, 400);

  const localQueryRef = useRef(localQuery);
  localQueryRef.current = localQuery;
  const debouncedQueryRef = useRef(debouncedQuery);
  debouncedQueryRef.current = debouncedQuery;

  // Sync state if URL changes from somewhere else (e.g., "Clear search" clicked in HomePage, or Back button)
  const queryParam = searchParams.get('q') || '';
  useEffect(() => {
    if (queryParam === '') {
      setLocalQuery('');
    } else if (localQueryRef.current === debouncedQueryRef.current) {
      setLocalQuery(queryParam);
    }
  }, [queryParam]);

  // Update URL when user types (debounced)
  useEffect(() => {
    if (debouncedQuery === (searchParams.get('q') || '')) return;

    if (debouncedQuery.trim()) {
      if (location.pathname !== '/') {
        navigate(`/?q=${encodeURIComponent(debouncedQuery)}`);
      } else {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('q', debouncedQuery);
        setSearchParams(newParams);
      }
    } else {
      if (location.pathname === '/') {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('q');
        setSearchParams(newParams);
      }
    }
  }, [debouncedQuery, location.pathname, navigate, searchParams, setSearchParams]);

  const handleSignOut = () => {
    auth.signOut();
    navigate('/');
  };

  const isBrowseMode = location.pathname === '/' && (
    searchParams.has('q') || 
    searchParams.has('category') || 
    searchParams.has('condition') || 
    searchParams.has('minPrice') || 
    searchParams.has('maxPrice') || 
    searchParams.has('school') ||
    searchParams.has('radiusKm') ||
    searchParams.get('browse') === 'true'
  );

  const showBackButton = location.pathname !== '/' || isBrowseMode;

  const handleBack = () => {
    if (location.pathname === '/' && isBrowseMode) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div className="flex items-center justify-between px-gutter py-stack-sm w-full">
        <div className="flex items-center gap-stack-lg">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button 
                onClick={handleBack}
                className="p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center text-on-surface-variant hover:text-primary"
                title="Go Back"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
            )}
            <Link to="/" className="text-headline-lg font-headline-lg font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              PassNow
            </Link>
          </div>
        <nav className="hidden lg:flex items-center gap-stack-md">
          <Link 
            to="/" 
            className={`pb-1 hover:-translate-y-0.5 transition-transform ${
              location.pathname === '/' || location.pathname === '/browse' 
                ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed' 
                : 'text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary relative group'
            }`}
          >
            Browse
            {location.pathname !== '/' && location.pathname !== '/browse' && (
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
            )}
          </Link>
          <Link 
            to="/how-it-works" 
            className={`pb-1 hover:-translate-y-0.5 transition-transform ${
              location.pathname === '/how-it-works' 
                ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed' 
                : 'text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary relative group'
            }`}
          >
            How it Works
            {location.pathname !== '/how-it-works' && (
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
            )}
          </Link>
          <Link 
            to="/about" 
            className={`pb-1 hover:-translate-y-0.5 transition-transform ${
              location.pathname === '/about' 
                ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed' 
                : 'text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary relative group'
            }`}
          >
            About
            {location.pathname !== '/about' && (
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full"></span>
            )}
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-stack-md">
        <div className="relative hidden xl:block group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary group-hover:scale-110 group-hover:text-primary transition-all duration-300" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          <input 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (localQuery.trim()) {
                  if (location.pathname !== '/') {
                    navigate(`/?q=${encodeURIComponent(localQuery)}`);
                  } else {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('q', localQuery);
                    setSearchParams(newParams);
                  }
                } else if (location.pathname === '/') {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }
              }
            }}
            className="pl-11 pr-8 py-2.5 bg-surface-variant/30 backdrop-blur-sm rounded-full border border-outline-variant/50 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 focus:border-primary focus:ring-4 focus:ring-primary/20 text-body-md font-body-md w-64 focus:w-80 transition-all duration-300 outline-none shadow-sm text-left" 
            placeholder="Search items, categories..." 
            type="text" 
          />
          {localQuery && (
            <button 
              onClick={() => setLocalQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        
        <Link to="/list">
          <button className="relative overflow-hidden group bg-gradient-to-r from-primary to-secondary text-white text-label-md font-bold px-5 py-2.5 rounded-full hover:shadow-[0_8px_20px_rgba(0,166,126,0.25)] hover:-translate-y-0.5 transition-all duration-300 hidden sm:flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300">add</span>
            <span>List an Item</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </button>
        </Link>

        {user ? (
          <div className="flex items-center gap-stack-sm">
            <Link to="/chat" className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:-translate-y-0.5 hover:shadow-md transition-all" title="Messages">
              <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              {totalUnreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
              )}
            </Link>
            <Link to="/transactions" className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:-translate-y-0.5 hover:shadow-md transition-all" title="Transactions">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              {actionRequiredCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>
              )}
            </Link>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/50 flex-shrink-0 block hover:ring-2 hover:ring-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" title="Profile">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center font-bold text-primary text-lg bg-primary/5">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <button 
              onClick={handleSignOut} 
              className="text-on-surface-variant hover:text-error hover:bg-error/10 hover:-translate-y-0.5 hover:shadow-md transition-all p-2 rounded-full flex items-center justify-center" 
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </button>
          </div>
        ) : (
          <Link to="/login">
            <button className="text-on-surface border border-outline-variant text-label-md font-bold px-5 py-2 rounded-full hover:bg-surface-container-high hover:border-primary/50 hover:text-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hidden sm:block">
              Log In
            </button>
          </Link>
        )}
      </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-gutter pb-3 block xl:hidden w-full">
        <div className="relative group w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          <input 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (localQuery.trim()) {
                  if (location.pathname !== '/') {
                    navigate(`/?q=${encodeURIComponent(localQuery)}`);
                  } else {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('q', localQuery);
                    setSearchParams(newParams);
                  }
                } else if (location.pathname === '/') {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }
              }
            }}
            className="pl-11 pr-8 py-2.5 bg-surface-variant/30 backdrop-blur-sm rounded-full border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/20 text-body-md font-body-md w-full transition-all duration-300 outline-none shadow-sm text-left" 
            placeholder="Search..." 
            type="text" 
          />
          {localQuery && (
            <button 
              onClick={() => {
                setLocalQuery('');
                if (location.pathname === '/') {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
