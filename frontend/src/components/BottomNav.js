import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Ticket, User, Gift } from 'lucide-react';

const BottomNav = ({ user }) => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route) => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  };

  const isCreator = user && (user.role === 'creator' || user.role === 'admin' || user.role === 'super_admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 sm:hidden">
      <div className="flex items-center justify-around py-2">
        <Link 
          to="/" 
          className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Inicio</span>
        </Link>
        <Link 
          to="/explore" 
          className={`flex flex-col items-center p-2 ${isActive('/explore') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <Compass className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Explorar</span>
        </Link>
        
        {/* Center Button - Mis Rifas for creators, My Tickets for users */}
        {isCreator ? (
          <Link 
            to="/my-raffles" 
            className="flex flex-col items-center -mt-4"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
              isActive('/my-raffles') 
                ? 'bg-sky-600' 
                : 'bg-gradient-to-r from-sky-500 to-blue-600'
            }`}>
              <Gift className="w-7 h-7 text-white" />
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${isActive('/my-raffles') ? 'text-sky-600' : 'text-slate-600'}`}>
              Mis Rifas
            </span>
          </Link>
        ) : (
          <Link 
            to="/my-tickets" 
            className={`flex flex-col items-center p-2 ${isActive('/my-tickets') ? 'text-sky-600' : 'text-slate-500'}`}
          >
            <Ticket className="w-6 h-6" />
            <span className="text-[10px] mt-0.5">Mis Tickets</span>
          </Link>
        )}
        
        {/* My Tickets for creators (moved to regular position) */}
        {isCreator && (
          <Link 
            to="/my-tickets" 
            className={`flex flex-col items-center p-2 ${isActive('/my-tickets') ? 'text-sky-600' : 'text-slate-500'}`}
          >
            <Ticket className="w-6 h-6" />
            <span className="text-[10px] mt-0.5">Tickets</span>
          </Link>
        )}
        
        <Link 
          to={user ? "/dashboard" : "/login"} 
          className={`flex flex-col items-center p-2 ${isActive('/dashboard') || isActive('/profile') ? 'text-sky-600' : 'text-slate-500'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
