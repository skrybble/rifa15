import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Ticket, User, Plus } from 'lucide-react';

const BottomNav = ({ user, onCreatePost }) => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route) => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 sm:hidden">
      <div className="flex items-center justify-around py-2">
        <Link 
          to="/" 
          className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <Home className="w-6 h-6" />
        </Link>
        <Link 
          to="/explore" 
          className={`flex flex-col items-center p-2 ${isActive('/explore') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <Compass className="w-6 h-6" />
        </Link>
        {user && user.role === 'creator' && onCreatePost && (
          <button 
            onClick={onCreatePost}
            className="flex flex-col items-center p-2"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>
        )}
        <Link 
          to="/my-tickets" 
          className={`flex flex-col items-center p-2 ${isActive('/my-tickets') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <Ticket className="w-6 h-6" />
        </Link>
        <Link 
          to={user ? "/dashboard" : "/login"} 
          className={`flex flex-col items-center p-2 ${isActive('/dashboard') || isActive('/profile') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <User className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
