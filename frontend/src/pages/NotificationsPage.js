import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Bell, ArrowLeft, Check, CheckCheck, Ticket, MessageSquare, 
  Trophy, Star, UserPlus, Gift, Trash2, RefreshCw 
} from 'lucide-react';

const NotificationsPage = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Fetch notifications
  const fetchNotifications = async () => {
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

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

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

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_raffle':
        return <Ticket className="w-5 h-5 text-sky-500" />;
      case 'winner':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'draw_result':
        return <Gift className="w-5 h-5 text-purple-500" />;
      case 'new_follower':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'new_rating':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'raffle_completed':
        return <Check className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  // Get icon background color
  const getIconBg = (type, isRead) => {
    if (isRead) return 'bg-slate-100';
    switch (type) {
      case 'new_raffle': return 'bg-sky-100';
      case 'winner': return 'bg-amber-100';
      case 'draw_result': return 'bg-purple-100';
      case 'new_follower': return 'bg-green-100';
      case 'new_rating': return 'bg-yellow-100';
      case 'message': return 'bg-blue-100';
      case 'raffle_completed': return 'bg-green-100';
      default: return 'bg-slate-100';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
    const date = new Date(notif.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Ayer';
    } else {
      groupKey = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notif);
    return groups;
  }, {});

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Inicia sesión para ver tus notificaciones</p>
          <Link to="/login" className="mt-4 inline-block px-4 py-2 bg-sky-600 text-white rounded-lg">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">Notificaciones</h1>
            <button
              onClick={fetchNotifications}
              className="p-2 hover:bg-slate-100 rounded-full"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Filters and Actions */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${
                filter === 'unread' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              No leídas
              {unreadCount > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'read' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leídas
            </button>
          </div>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todo leído</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4">
        {loading && notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto"></div>
            <p className="text-slate-500 mt-3">Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 
               filter === 'read' ? 'No tienes notificaciones leídas' : 
               'No tienes notificaciones'}
            </h3>
            <p className="text-slate-500">
              {filter === 'all' ? 'Las notificaciones sobre rifas, ganadores y actividad aparecerán aquí.' : 
               'Cambia el filtro para ver otras notificaciones.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-slate-500 mb-2 px-1">{date}</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {notifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={`p-4 flex items-start space-x-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notif.read ? 'bg-sky-50/30' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconBg(notif.type, notif.read)}`}>
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 ml-2 mt-1.5"></div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {formatDate(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
