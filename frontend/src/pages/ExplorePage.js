import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { Ticket, LogOut, User, Bell, LayoutDashboard, Heart, Calendar, DollarSign, Mail, Settings, Menu, X } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import LanguageSelector from '../components/LanguageSelector';

const ExplorePage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState([]);
  const [creators, setCreators] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const rafflesRes = await axios.get(`${API}/raffles?status=active`);
      const creatorsRes = await axios.get(`${API}/creators`);
      
      setRaffles(rafflesRes.data);
      setCreators(creatorsRes.data);
      
      if (user) {
        const notifRes = await axios.get(`${API}/notifications`);
        setNotifications(notifRes.data);
        
        // Get unread messages count
        try {
          const messagesCountRes = await axios.get(`${API}/messages/unread-count`);
          setUnreadMessagesCount(messagesCountRes.data.count);
        } catch (error) {
          console.error('Error loading messages count:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Ticket className="w-8 h-8 text-sky-600" />
              <span className="text-2xl font-bold text-slate-900">RafflyWin</span>
            </Link>

            {user ? (
              <>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <nav className="hidden md:flex items-center space-x-6">
                  <Link
                    to="/explore"
                    className="text-sky-700 font-semibold"
                  >
                    {t('nav.explore')}
                  </Link>
                  <Link
                    to="/my-tickets"
                    data-testid="my-tickets-nav"
                    className="text-slate-700 hover:text-sky-700 font-medium"
                  >
                    {t('nav.myTickets')}
                  </Link>
                  <Link
                    to="/messages"
                    data-testid="messages-nav"
                    className="text-slate-700 hover:text-sky-700 font-medium flex items-center space-x-1 relative"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{t('nav.messages')}</span>
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  {(user?.role === 'creator' || user?.role === 'super_admin') && (
                    <Link
                      to="/dashboard"
                      data-testid="dashboard-nav"
                      className="text-slate-700 hover:text-sky-700 font-medium flex items-center space-x-1"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>{t('nav.dashboard')}</span>
                    </Link>
                  )}
                  <LanguageSelector />
                </nav>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    data-testid="notifications-btn"
                    className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Bell className="w-6 h-6 text-slate-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <Link
                    to="/profile-settings"
                    data-testid="profile-settings-btn"
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Mi Perfil"
                  >
                    <Settings className="w-6 h-6 text-slate-700" />
                  </Link>
                  <button
                    onClick={onLogout}
                    data-testid="logout-btn"
                    className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('auth.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-sky-700 font-semibold transition-colors"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-20 right-4 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">{t('nav.notifications')}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {t('messages.noMessages')}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    !notif.read ? 'bg-sky-50' : ''
                  }`}
                >
                  <h4 className="font-semibold text-slate-900 text-sm">{notif.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <span className="text-xs text-slate-400 mt-2 block">
                    {new Date(notif.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && user && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <Link
              to="/explore"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-4 py-3 text-sky-700 font-semibold bg-sky-50 rounded-lg"
            >
              <Ticket className="w-5 h-5" />
              <span>{t('nav.explore')}</span>
            </Link>
            <Link
              to="/my-tickets"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Heart className="w-5 h-5" />
              <span>{t('nav.myTickets')}</span>
            </Link>
            <Link
              to="/messages"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Mail className="w-5 h-5" />
              <span>{t('nav.messages')}</span>
              {unreadMessagesCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile-settings"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Settings className="w-5 h-5" />
              <span>{t('nav.profile')}</span>
            </Link>
            {(user?.role === 'creator' || user?.role === 'super_admin') && (
              <Link
                to="/dashboard"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}
            <button
              onClick={() => { onLogout(); setShowMobileMenu(false); }}
              className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('auth.logout')}</span>
            </button>
            <LanguageSelector variant="mobile" />
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {user ? `¡Hola, ${user.full_name}!` : '¡Hola!'}
          </h1>
          <p className="text-lg text-slate-600">
            Descubre rifas emocionantes de tus creadores favoritos
          </p>
        </div>

        {/* Featured Creators */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('home.featuredCreators')}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {creators.slice(0, 8).map((creator) => (
                <div
                  key={creator.id}
                  data-testid={`creator-card-${creator.id}`}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <Link to={`/creator/${creator.id}`} className="block">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-7">
                        {creator.full_name.charAt(0)}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{creator.full_name}</h3>
                      <div className="flex items-center space-x-1 text-sm text-amber-600 mb-2">
                        <span>★</span>
                        <span className="font-semibold">{creator.rating.toFixed(1)}</span>
                        <span className="text-slate-400">({creator.rating_count})</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-slate-500 mb-3">
                        <Heart className="w-4 h-4" />
                        <span>{creator.followers?.length || 0} {t('profile.followers').toLowerCase()}</span>
                      </div>
                    </div>
                  </Link>
                  {user && user.id !== creator.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/messages', { state: { startConversationWith: creator.id } });
                      }}
                      className="w-full mt-3 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors flex items-center justify-center space-x-2"
                      title="Enviar mensaje"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('nav.messages')}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Raffles */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('home.activeRaffles')}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : raffles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-500">No hay rifas activas en este momento</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  to={`/raffle/${raffle.id}`}
                  data-testid={`raffle-card-${raffle.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {raffle.images && raffle.images.length > 0 ? (
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}`}
                      alt={raffle.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                      <Ticket className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{raffle.title}</h3>
                    <p className="text-slate-600 mb-4 line-clamp-2">{raffle.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1 text-sky-700 font-semibold">
                        <DollarSign className="w-5 h-5" />
                        <span>${raffle.ticket_price}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-sm">
                        <Ticket className="w-4 h-4" />
                        <span>{raffle.tickets_sold}/{raffle.ticket_range}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <ShareButton raffle={raffle} small={true} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;