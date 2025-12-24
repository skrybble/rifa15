import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Bell, X, Check, Ticket, MessageSquare, Trophy, Star, UserPlus, Gift } from 'lucide-react';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications`);
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${API}/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => axios.post(`${API}/notifications/${id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_raffle':
        return <Ticket className="w-4 h-4 text-sky-500" />;
      case 'winner':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'draw_result':
        return <Gift className="w-4 h-4 text-purple-500" />;
      case 'new_follower':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'new_rating':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'raffle_completed':
        return <Check className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
            <h3 className="font-bold text-slate-900">Notificaciones</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  Marcar todo leído
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mx-auto"></div>
                <p className="text-sm text-slate-500 mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Sin notificaciones</p>
                <p className="text-sm text-slate-400 mt-1">
                  Las notificaciones de rifas, ganadores y mensajes aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 20).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`px-4 py-3 flex items-start space-x-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !notif.read ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      !notif.read ? 'bg-sky-100' : 'bg-slate-100'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTimeAgo(notif.created_at)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notif.read && (
                      <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t text-center">
              <Link
                to="/notifications"
                onClick={() => setShowDropdown(false)}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
              >
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
