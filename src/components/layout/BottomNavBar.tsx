import { Link, useLocation } from 'react-router-dom';

export default function BottomNavBar() {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    if (isActive) {
      return "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-2xl px-4 py-1 scale-90 transition-transform duration-150";
    }
    return "flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 active:bg-surface-container-highest rounded-2xl transition-colors";
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-2 pb-safe bg-surface dark:bg-inverse-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-xl">
      <Link to="/" className={getLinkClass('/')}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="text-label-sm font-label-sm mt-1">Home</span>
      </Link>
      <Link to="/browse" className={getLinkClass('/browse')}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        <span className="text-label-sm font-label-sm mt-1">Browse</span>
      </Link>
      <Link to="/list" className={getLinkClass('/list')}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>add_circle</span>
        <span className="text-label-sm font-label-sm mt-1">List</span>
      </Link>
      <Link to="/profile" className={getLinkClass('/profile')}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
        <span className="text-label-sm font-label-sm mt-1">Profile</span>
      </Link>
    </nav>
  );
}
