import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Ticket, ArrowLeft, Plus, TrendingUp, DollarSign, Users, Calendar, X,
  Search, ChevronLeft, ChevronRight, Mail, Ban, Trash2, RefreshCw, Settings,
  AlertTriangle, BarChart3, Play, Shield, Home, Globe, Eye, ExternalLink,
  MessageSquare, Image, Star, ThumbsUp, ThumbsDown, UserCheck, Clock, Filter
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import UserDetailModal from '../components/UserDetailModal';

const DashboardPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Tab state - super_admin starts with admin-overview, creators with mi-dashboard
  const [activeTab, setActiveTab] = useState(user?.role === 'super_admin' ? 'admin-overview' : 'mi-dashboard');
  
  // Creator state
  const [stats, setStats] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_range: 100,
    ticket_price: '',
    raffle_date: '',
    categories: ''
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateWarning, setDateWarning] = useState('');

  // Admin state
  const [adminStats, setAdminStats] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [statisticsPeriod, setStatisticsPeriod] = useState('month');
  
  // Admin - Creators
  const [creators, setCreators] = useState([]);
  const [creatorsTotal, setCreatorsTotal] = useState(0);
  const [creatorsPage, setCreatorsPage] = useState(1);
  const [creatorsPerPage, setCreatorsPerPage] = useState(10);
  const [creatorsSearch, setCreatorsSearch] = useState('');
  const [creatorsSortBy, setCreatorsSortBy] = useState('created_at');
  const [creatorsSortOrder, setCreatorsSortOrder] = useState('desc');
  
  // Admin - Raffles
  const [adminRaffles, setAdminRaffles] = useState([]);
  const [adminRafflesTotal, setAdminRafflesTotal] = useState(0);
  const [rafflesPage, setRafflesPage] = useState(1);
  const [rafflesPerPage, setRafflesPerPage] = useState(10);
  const [rafflesSearch, setRafflesSearch] = useState('');
  const [rafflesSortBy, setRafflesSortBy] = useState('created_at');
  const [rafflesSortOrder, setRafflesSortOrder] = useState('desc');
  const [rafflesStatus, setRafflesStatus] = useState('');
  const [expandedRaffle, setExpandedRaffle] = useState(null);
  
  // Admin - Users
  const [allUsers, setAllUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersStatus, setUsersStatus] = useState('');
  
  // Admin - Reviews
  const [reviewAlerts, setReviewAlerts] = useState([]);
  const [usersByReviews, setUsersByReviews] = useState([]);
  const [alertThreshold, setAlertThreshold] = useState(3);
  
  // Admin - Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [suspendReason, setSuspendReason] = useState('');
  const [messageContent, setMessageContent] = useState('');
  
  // User Detail Modal
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [userMessages, setUserMessages] = useState([]);
  const [userRaffles, setUserRaffles] = useState([]);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  
  // Reviews - Enhanced
  const [reviewsFilter, setReviewsFilter] = useState('all'); // all, positive, negative
  const [reviewsSortBy, setReviewsSortBy] = useState('total'); // total, positive, negative
  const [minNegativeReviews, setMinNegativeReviews] = useState(0);
  
  // Statistics - User History
  const [userHistory, setUserHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(20);

  // Load data on mount
  useEffect(() => {
    loadDashboard();
    if (isSuperAdmin) {
      loadAdminData();
    }
  }, []);

  // Admin effects
  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-creators') loadCreators();
  }, [activeTab, creatorsPage, creatorsPerPage, creatorsSearch, creatorsSortBy, creatorsSortOrder]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-raffles') loadAdminRaffles();
  }, [activeTab, rafflesPage, rafflesPerPage, rafflesSearch, rafflesSortBy, rafflesSortOrder, rafflesStatus]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-statistics') {
      loadStatistics();
      loadUserHistory();
    }
  }, [activeTab, statisticsPeriod, historyPage, historyPerPage]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-users') loadAllUsers();
  }, [activeTab, usersPage, usersPerPage, usersSearch, usersRole, usersStatus]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-reviews') {
      loadReviewAlerts();
      loadUsersByReviews();
    }
  }, [activeTab, reviewsFilter, reviewsSortBy, minNegativeReviews]);

  // Creator functions
  const loadDashboard = async () => {
    try {
      const [statsRes, rafflesRes] = await Promise.all([
        axios.get(`${API}/dashboard/creator-stats`),
        axios.get(`${API}/raffles?creator_id=${user.id}`)
      ]);
      setStats(statsRes.data);
      setRaffles(rafflesRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleDateChange = async (dateValue) => {
    setFormData({ ...formData, raffle_date: dateValue });
    setDateWarning('');
    
    if (dateValue) {
      try {
        const response = await axios.get(`${API}/raffles/check-date/${dateValue}`);
        if (!response.data.available) {
          setDateWarning(`⚠️ ${response.data.message} Máximo 3 rifas por día.`);
        } else if (response.data.raffles_count > 0) {
          setDateWarning(`ℹ️ ${response.data.message}`);
        }
      } catch (error) {
        console.error('Error checking date:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('ticket_range', formData.ticket_range);
      formDataToSend.append('ticket_price', formData.ticket_price);
      formDataToSend.append('raffle_date', formData.raffle_date);
      formDataToSend.append('categories', formData.categories);
      
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await axios.post(`${API}/raffles`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('¡Rifa creada exitosamente!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        ticket_range: 100,
        ticket_price: '',
        raffle_date: '',
        categories: ''
      });
      setImages([]);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la rifa');
    }
  };

  // Admin functions
  const loadAdminData = async () => {
    try {
      const statsRes = await axios.get(`${API}/dashboard/admin-stats`);
      setAdminStats(statsRes.data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadCreators = async () => {
    try {
      const params = new URLSearchParams({
        page: creatorsPage,
        per_page: creatorsPerPage,
        sort_by: creatorsSortBy,
        sort_order: creatorsSortOrder,
        ...(creatorsSearch && { search: creatorsSearch })
      });
      const res = await axios.get(`${API}/admin/creators?${params}`);
      setCreators(res.data.data);
      setCreatorsTotal(res.data.total);
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const loadAdminRaffles = async () => {
    try {
      const params = new URLSearchParams({
        page: rafflesPage,
        per_page: rafflesPerPage,
        sort_by: rafflesSortBy,
        sort_order: rafflesSortOrder,
        ...(rafflesSearch && { search: rafflesSearch }),
        ...(rafflesStatus && { status: rafflesStatus })
      });
      const res = await axios.get(`${API}/admin/raffles?${params}`);
      setAdminRaffles(res.data.data);
      setAdminRafflesTotal(res.data.total);
    } catch (error) {
      console.error('Error loading raffles:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const res = await axios.get(`${API}/admin/statistics?period=${statisticsPeriod}`);
      setStatistics(res.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: usersPage,
        per_page: usersPerPage,
        ...(usersSearch && { search: usersSearch }),
        ...(usersRole && { role: usersRole }),
        ...(usersStatus && { status: usersStatus })
      });
      const res = await axios.get(`${API}/admin/all-users?${params}`);
      setAllUsers(res.data.data);
      setUsersTotal(res.data.total);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadReviewAlerts = async () => {
    try {
      const res = await axios.get(`${API}/admin/review-alerts`);
      setReviewAlerts(res.data.alerts);
      setAlertThreshold(res.data.threshold);
    } catch (error) {
      console.error('Error loading review alerts:', error);
    }
  };

  const loadUsersByReviews = async () => {
    try {
      const params = new URLSearchParams({
        filter: reviewsFilter,
        sort_by: reviewsSortBy,
        ...(minNegativeReviews > 0 && { min_negative: minNegativeReviews })
      });
      const res = await axios.get(`${API}/admin/users-by-reviews?${params}`);
      setUsersByReviews(res.data.data || res.data);
    } catch (error) {
      console.error('Error loading users by reviews:', error);
    }
  };

  const loadUserHistory = async () => {
    try {
      const params = new URLSearchParams({
        page: historyPage,
        per_page: historyPerPage
      });
      const res = await axios.get(`${API}/admin/user-history?${params}`);
      setUserHistory(res.data.data || []);
      setHistoryTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error loading user history:', error);
    }
  };

  const openUserDetail = (userId) => {
    setSelectedUser({ id: userId });
    setShowUserDetailModal(true);
  };

  const handleUserModalSuspend = (userFromModal) => {
    setSelectedUser(userFromModal);
    setShowUserDetailModal(false);
    setShowSuspendModal(true);
  };

  const handleUserModalMessage = (userFromModal) => {
    setSelectedUser(userFromModal);
    setShowUserDetailModal(false);
    setShowMessageModal(true);
  };

  const handleManualDraw = async () => {
    if (!confirm('¿Ejecutar sorteo manual?')) return;
    try {
      await axios.post(`${API}/admin/draw`);
      alert('Sorteo ejecutado');
      loadAdminData();
    } catch (error) {
      alert('Error al ejecutar sorteo');
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspendReason) {
      alert('Completa todos los campos');
      return;
    }
    try {
      const durationHours = suspendDuration === 'permanent' ? null : parseInt(suspendDuration);
      await axios.post(`${API}/admin/users/${selectedUser.id}/suspend`, {
        duration_hours: durationHours,
        reason: suspendReason
      });
      alert('Usuario suspendido');
      setShowSuspendModal(false);
      setSelectedUser(null);
      setSuspendReason('');
      loadAllUsers();
    } catch (error) {
      alert('Error al suspender usuario');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/unsuspend`);
      alert('Suspensión removida');
      loadAllUsers();
    } catch (error) {
      alert('Error al quitar suspensión');
    }
  };

  const handleToggleFeatured = async (creatorId, currentStatus) => {
    try {
      const res = await axios.post(`${API}/admin/creators/${creatorId}/toggle-featured`);
      alert(res.data.message);
      loadCreators();
    } catch (error) {
      alert('Error al cambiar estado destacado');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent) {
      alert('Escribe un mensaje');
      return;
    }
    try {
      await axios.post(`${API}/messages`, {
        to_user_id: selectedUser.id,
        content: messageContent
      });
      alert('Mensaje enviado');
      setShowMessageModal(false);
      setSelectedUser(null);
      setMessageContent('');
    } catch (error) {
      alert('Error al enviar mensaje');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      alert('Usuario eliminado');
      loadAllUsers();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const handleUpdateThreshold = async () => {
    try {
      await axios.put(`${API}/admin/settings`, {
        negative_review_alert_threshold: alertThreshold
      });
      alert('Configuración guardada');
    } catch (error) {
      alert('Error al guardar');
    }
  };

  // Pagination component
  const Pagination = ({ page, setPage, total, perPage, setPerPage }) => {
    const totalPages = Math.ceil(total / perPage);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Mostrar:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm text-slate-600">de {total}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded hover:bg-slate-100 disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">Página {page} de {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded hover:bg-slate-100 disabled:opacity-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  // Define tabs - admin tabs only for super_admin, creator tabs for creators
  const adminTabs = [
    { id: 'admin-overview', label: t('dashboard.overview'), icon: BarChart3 },
    { id: 'admin-creators', label: t('dashboard.creators'), icon: Users },
    { id: 'admin-raffles', label: t('dashboard.allRaffles'), icon: Ticket },
    { id: 'admin-users', label: t('dashboard.users'), icon: Users },
    { id: 'admin-reviews', label: t('dashboard.reviews'), icon: AlertTriangle },
    { id: 'admin-statistics', label: t('dashboard.statistics'), icon: TrendingUp },
    { id: 'admin-earnings', label: t('dashboard.earnings'), icon: DollarSign },
  ];

  const allTabs = isSuperAdmin ? adminTabs : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 pb-20">
      {/* Header - Mobile optimized */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900">Mi Perfil</h1>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full flex items-center">
                  <Shield className="w-3 h-3 mr-1" />Admin
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <LanguageSelector />
              <Link to="/profile-settings" className="p-2 hover:bg-slate-100 rounded-full">
                <Settings className="w-5 h-5 text-slate-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Only show if super admin */}
      {isSuperAdmin && (
        <div className="bg-white border-b sticky top-[52px] z-30 overflow-x-auto scrollbar-hide">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex space-x-1">
              {allTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'text-sky-600 border-b-2 border-sky-600' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        
        {/* ==================== MI DASHBOARD (Creator View - only for non-super_admin) ==================== */}
        {!isSuperAdmin && (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
              <div className="h-20 bg-gradient-to-r from-sky-400 to-blue-600"></div>
              <div className="px-4 pb-4">
                <div className="flex items-end -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3 mb-1">
                    <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full font-medium capitalize">{user?.role}</span>
                  {user?.is_featured && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">⭐ Destacado</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.total_raffles}</p>
                      <p className="text-xs text-slate-500">Total Rifas</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.active_raffles}</p>
                      <p className="text-xs text-slate-500">Activas</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.total_tickets_sold}</p>
                      <p className="text-xs text-slate-500">Tickets</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${stats.net_earnings?.toFixed(0) || '0'}</p>
                      <p className="text-xs text-slate-500">Ingresos</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Acciones rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/my-raffles" className="flex items-center space-x-2 p-3 bg-sky-50 rounded-lg text-sky-700 hover:bg-sky-100 transition-colors">
                  <Ticket className="w-5 h-5" />
                  <span className="text-sm font-medium">Mis Rifas</span>
                </Link>
                <Link to="/messages" className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-medium">Mensajes</span>
                </Link>
                <Link to="/profile-settings" className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm font-medium">Configuración</span>
                </Link>
                <button onClick={onLogout} className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Cerrar sesión</span>
                </button>
              </div>
            </div>

            {/* Recent Raffles Preview */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Mis Rifas Recientes</h3>
                <Link to="/my-raffles" className="text-sky-600 text-sm font-medium">Ver todas →</Link>
              </div>
              {raffles.length === 0 ? (
                <div className="p-8 text-center">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No tienes rifas aún</p>
                  <Link to="/my-raffles" className="inline-block mt-3 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium">
                    Crear primera rifa
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {raffles.slice(0, 3).map(raffle => (
                    <Link key={raffle.id} to={`/raffle/${raffle.id}`} className="flex items-center p-3 hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white mr-3 flex-shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{raffle.title}</p>
                        <p className="text-xs text-slate-500">{raffle.tickets_sold}/{raffle.ticket_range} vendidos</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        raffle.status === 'active' ? 'bg-green-100 text-green-700' : 
                        raffle.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {raffle.status === 'active' ? 'Activa' : raffle.status === 'pending_payment' ? 'Pendiente' : raffle.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== ADMIN SECTIONS ==================== */}
        
        {/* Admin Overview */}
        {activeTab === 'admin-overview' && adminStats && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-purple-600" />
              {t('dashboard.adminPanel')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow">
                <Users className="w-8 h-8 text-sky-600 mb-2" />
                <p className="text-3xl font-bold">{adminStats.total_users}</p>
                <p className="text-slate-600">{t('dashboard.totalUsers')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-3xl font-bold">{adminStats.total_creators}</p>
                <p className="text-slate-600">{t('dashboard.totalCreators')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <Ticket className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-3xl font-bold">{adminStats.active_raffles}</p>
                <p className="text-slate-600">{t('dashboard.activeRaffles')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                <p className="text-3xl font-bold">${adminStats.commission_revenue?.toFixed(2)}</p>
                <p className="text-slate-600">{t('dashboard.commissions')}</p>
              </div>
            </div>
            
            {/* Manual Draw Section - Hidden in collapsible */}
            <details className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <summary className="cursor-pointer font-semibold text-amber-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {t('admin.configuration')} - {t('dashboard.manualDraw')}
              </summary>
              <div className="mt-4 pt-4 border-t border-amber-200">
                <p className="text-sm text-amber-700 mb-4">
                  ⚠️ Esta acción ejecutará el sorteo de todas las rifas que terminan hoy. Esta acción no se puede deshacer.
                </p>
                <button 
                  onClick={handleManualDraw} 
                  className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
                >
                  <Play className="w-4 h-4" />
                  <span>{t('dashboard.manualDraw')}</span>
                </button>
              </div>
            </details>
          </div>
        )}

        {/* Admin Creators */}
        {activeTab === 'admin-creators' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">{t('admin.manageCreators')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder={t('admin.searchCreators')} value={creatorsSearch}
                  onChange={(e) => { setCreatorsSearch(e.target.value); setCreatorsPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <select value={`${creatorsSortBy}-${creatorsSortOrder}`}
                onChange={(e) => { const [f, o] = e.target.value.split('-'); setCreatorsSortBy(f); setCreatorsSortOrder(o); setCreatorsPage(1); }}
                className="border rounded-lg px-3 py-2">
                <option value="created_at-desc">Fecha (reciente)</option>
                <option value="created_at-asc">Fecha (antiguo)</option>
                <option value="followers_count-desc">Popularidad</option>
                <option value="full_name-asc">Nombre (A-Z)</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Creador</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-center p-3">Seguidores</th>
                    <th className="text-center p-3">Rifas</th>
                    <th className="text-center p-3">Destacado</th>
                    <th className="text-center p-3">Estado</th>
                    <th className="text-center p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(c => (
                    <tr key={c.id} className="border-t hover:bg-slate-50">
                      <td className="p-3">
                        <button 
                          onClick={() => openUserDetail(c.id)}
                          className="font-medium text-sky-600 hover:text-sky-700 hover:underline flex items-center space-x-1"
                        >
                          <span>{c.full_name}</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3 text-slate-600">{c.email}</td>
                      <td className="p-3 text-center">{c.followers_count || 0}</td>
                      <td className="p-3 text-center">{c.total_raffles || 0}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleToggleFeatured(c.id, c.is_featured)}
                          className={`px-2 py-1 rounded text-xs font-medium ${c.is_featured ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {c.is_featured ? '⭐ Destacado' : 'Destacar'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.is_active ? t('common.active') : t('admin.suspended')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => { setSelectedUser(c); setShowMessageModal(true); }} className="p-1 hover:bg-sky-100 rounded" title={t('admin.sendMessage')}>
                            <Mail className="w-4 h-4 text-sky-600" />
                          </button>
                          <button onClick={() => { setSelectedUser(c); setShowSuspendModal(true); }} className="p-1 hover:bg-amber-100 rounded" title={t('admin.suspend')}>
                            <Ban className="w-4 h-4 text-amber-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={creatorsPage} setPage={setCreatorsPage} total={creatorsTotal} perPage={creatorsPerPage} setPerPage={setCreatorsPerPage} />
          </div>
        )}

        {/* Admin Raffles */}
        {activeTab === 'admin-raffles' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.allRaffles')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder={t('admin.searchRaffles')} value={rafflesSearch}
                  onChange={(e) => { setRafflesSearch(e.target.value); setRafflesPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <select value={rafflesStatus} onChange={(e) => { setRafflesStatus(e.target.value); setRafflesPage(1); }} className="border rounded-lg px-3 py-2">
                <option value="">{t('common.all')}</option>
                <option value="active">{t('raffle.active')}</option>
                <option value="completed">{t('raffle.completed')}</option>
              </select>
            </div>
            <div className="space-y-3">
              {adminRaffles.map(r => (
                <div key={r.id} className="border rounded-lg overflow-hidden">
                  <div 
                    onClick={() => setExpandedRaffle(expandedRaffle === r.id ? null : r.id)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{r.title}</h3>
                      <p className="text-sm text-slate-500">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openUserDetail(r.creator_id); }}
                          className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
                        >
                          {r.creator_name}
                        </button>
                        {' '} • ${r.prize_value}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.status === 'active' ? t('raffle.active') : t('raffle.completed')}
                        </span>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedRaffle === r.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {expandedRaffle === r.id && (
                    <div className="p-4 bg-white border-t">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-green-600 font-medium">{t('raffle.ticketsSold')}</p>
                          <p className="text-2xl font-bold text-green-700">{r.tickets_sold}</p>
                        </div>
                        <div className="bg-sky-50 rounded-lg p-4">
                          <p className="text-sm text-sky-600 font-medium">{t('raffle.ticketsAvailable')}</p>
                          <p className="text-2xl font-bold text-sky-700">{r.ticket_range - r.tickets_sold}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-purple-600 font-medium">{t('raffle.ticketRange')}</p>
                          <p className="text-2xl font-bold text-purple-700">{r.ticket_range}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4">
                          <p className="text-sm text-amber-600 font-medium">{t('raffle.endDate')}</p>
                          <p className="text-lg font-bold text-amber-700">{new Date(r.raffle_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">{t('raffle.progress')}</span>
                          <span className="text-sm font-medium">{((r.tickets_sold / r.ticket_range) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-sky-500 to-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min((r.tickets_sold / r.ticket_range) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={rafflesPage} setPage={setRafflesPage} total={adminRafflesTotal} perPage={rafflesPerPage} setPerPage={setRafflesPerPage} />
          </div>
        )}

        {/* Admin Users */}
        {activeTab === 'admin-users' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">{t('admin.manageUsers')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder={t('admin.searchUsers')} value={usersSearch}
                  onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <select value={usersRole} onChange={(e) => { setUsersRole(e.target.value); setUsersPage(1); }} className="border rounded-lg px-3 py-2">
                <option value="">Todos</option>
                <option value="user">Usuario</option>
                <option value="creator">Creador</option>
              </select>
              <select value={usersStatus} onChange={(e) => { setUsersStatus(e.target.value); setUsersPage(1); }} className="border rounded-lg px-3 py-2">
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-center p-3">Rol</th>
                    <th className="text-center p-3">Estado</th>
                    <th className="text-center p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} className="border-t hover:bg-slate-50">
                      <td className="p-3">
                        <button 
                          onClick={() => openUserDetail(u.id)}
                          className="font-medium text-sky-600 hover:text-sky-700 hover:underline flex items-center space-x-1"
                        >
                          <span>{u.full_name}</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-center capitalize">{u.role}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? t('common.active') : t('admin.suspended')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-1">
                          <button onClick={() => { setSelectedUser(u); setShowMessageModal(true); }} className="p-1 hover:bg-sky-100 rounded" title={t('admin.sendMessage')}><Mail className="w-4 h-4 text-sky-600" /></button>
                          {u.is_active ? (
                            <button onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }} className="p-1 hover:bg-amber-100 rounded" title={t('admin.suspend')}><Ban className="w-4 h-4 text-amber-600" /></button>
                          ) : (
                            <button onClick={() => handleUnsuspendUser(u.id)} className="p-1 hover:bg-green-100 rounded" title={t('admin.unsuspend')}><RefreshCw className="w-4 h-4 text-green-600" /></button>
                          )}
                          <button onClick={() => handleDeleteUser(u.id)} className="p-1 hover:bg-red-100 rounded" title={t('common.delete')}><Trash2 className="w-4 h-4 text-red-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={usersPage} setPage={setUsersPage} total={usersTotal} perPage={usersPerPage} setPerPage={setUsersPerPage} />
          </div>
        )}

        {/* Admin Reviews */}
        {activeTab === 'admin-reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center"><Settings className="w-5 h-5 mr-2" />Configuración</h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm">Alertar después de</label>
                <input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(parseInt(e.target.value))} className="w-20 border rounded px-3 py-2" min="1" />
                <span className="text-sm">reseñas negativas</span>
                <button onClick={handleUpdateThreshold} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Guardar</button>
              </div>
            </div>
            {reviewAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" />Alertas ({reviewAlerts.length})</h2>
                {reviewAlerts.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-lg border border-red-200 mb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <button 
                          onClick={() => openUserDetail(u.id)}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {u.full_name}
                        </button>
                        <p className="text-sm text-slate-600">{u.email}</p>
                      </div>
                      <button onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Suspender</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold flex items-center">
                  <Star className="w-5 h-5 mr-2 text-amber-500" />
                  Usuarios por Reseñas
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={reviewsFilter} 
                    onChange={(e) => setReviewsFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Todas las reseñas</option>
                    <option value="positive">Solo positivas (4-5⭐)</option>
                    <option value="negative">Solo negativas (1-2⭐)</option>
                  </select>
                  <select 
                    value={reviewsSortBy} 
                    onChange={(e) => setReviewsSortBy(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="total">Ordenar: Total</option>
                    <option value="negative">Ordenar: Negativas</option>
                    <option value="positive">Ordenar: Positivas</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">Min negativas:</span>
                    <input 
                      type="number" 
                      value={minNegativeReviews} 
                      onChange={(e) => setMinNegativeReviews(parseInt(e.target.value) || 0)}
                      className="w-16 border rounded-lg px-2 py-2 text-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              {usersByReviews.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay usuarios con reseñas</p>
              ) : (
                <div className="space-y-2">
                  {usersByReviews.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => openUserDetail(u.id)}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {u.full_name}
                        </button>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          u.role === 'creator' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {u.role === 'creator' ? 'Creador' : 'Usuario'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">{u.positive_reviews || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-600">{u.negative_reviews_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="font-medium">{u.avg_review_score || '-'}</span>
                        </div>
                        <span className="text-slate-500">({u.total_reviews || 0} total)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Statistics */}
        {activeTab === 'admin-statistics' && (
          <div className="space-y-6">
            <div className="flex space-x-2">
              {['day', 'week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setStatisticsPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${statisticsPeriod === p ? 'bg-purple-600 text-white' : 'bg-white hover:bg-slate-50'}`}>
                  {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
            {statistics && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold mb-4">Registros</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span>Usuarios</span><span className="font-bold">{statistics.registrations.users}</span></div>
                    <div className="flex justify-between"><span>Creadores</span><span className="font-bold">{statistics.registrations.creators}</span></div>
                    <div className="flex justify-between border-t pt-2"><span>Total</span><span className="font-bold text-purple-600">{statistics.registrations.total}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold mb-4">Ingresos</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span>Total Ventas</span><span className="font-bold">${statistics.revenue.total.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t pt-2"><span>Comisiones</span><span className="font-bold text-green-600">${statistics.revenue.commission.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* User Registration History */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Historial de Registros
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Usuario</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-center p-3">Rol</th>
                      <th className="text-center p-3">Estado</th>
                      <th className="text-left p-3">Fecha de Registro</th>
                      <th className="text-center p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHistory.length === 0 ? (
                      <tr><td colSpan="6" className="p-6 text-center text-slate-500">No hay registros</td></tr>
                    ) : (
                      userHistory.map(u => (
                        <tr key={u.id} className="border-t hover:bg-slate-50">
                          <td className="p-3 font-medium">{u.full_name}</td>
                          <td className="p-3 text-slate-600">{u.email}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.role === 'creator' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                              'bg-sky-100 text-sky-700'
                            }`}>
                              {u.role === 'creator' ? 'Creador' : u.role === 'super_admin' ? 'Admin' : 'Usuario'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.is_active !== false ? 'Activo' : 'Suspendido'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => openUserDetail(u.id)}
                              className="p-1 hover:bg-purple-100 rounded" 
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4 text-purple-600" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination 
                page={historyPage} 
                setPage={setHistoryPage} 
                total={historyTotal} 
                perPage={historyPerPage} 
                setPerPage={setHistoryPerPage} 
              />
            </div>
          </div>
        )}

        {/* Admin Earnings */}
        {activeTab === 'admin-earnings' && (
          <div className="bg-white rounded-xl shadow p-6 text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-600 mb-2">Ganancias con Paddle</h2>
            <p className="text-slate-500">Disponible cuando configures Paddle</p>
          </div>
        )}
      </div>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nueva Rifa</h2>
              <button onClick={() => setShowCreateModal(false)}><X className="w-6 h-6" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows="3" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tickets</label>
                  <input type="number" value={formData.ticket_range} onChange={(e) => setFormData({...formData, ticket_range: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" min="10" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio ($)</label>
                  <input type="number" step="0.01" value={formData.ticket_price} onChange={(e) => setFormData({...formData, ticket_price: e.target.value})} className="w-full border rounded-lg px-3 py-2" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha del Sorteo</label>
                <input type="date" value={formData.raffle_date} onChange={(e) => handleDateChange(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
                {dateWarning && <p className="text-sm text-amber-600 mt-1">{dateWarning}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Imágenes</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <button type="submit" className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700">Crear Rifa</button>
            </form>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          onClose={() => setShowUserDetailModal(false)}
          onSuspend={handleUserModalSuspend}
          onMessage={handleUserModalMessage}
        />
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Suspender Usuario</h3>
              <button onClick={() => setShowSuspendModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-600 mb-4">Suspender a <strong>{selectedUser.full_name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duración</label>
                <select value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                  <option value="24">24 horas</option>
                  <option value="72">3 días</option>
                  <option value="168">7 días</option>
                  <option value="720">30 días</option>
                  <option value="permanent">Permanente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Razón</label>
                <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows="3" placeholder="Motivo..." />
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowSuspendModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={handleSuspendUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Suspender</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Enviar Mensaje</h3>
              <button onClick={() => setShowMessageModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-600 mb-4">Para <strong>{selectedUser.full_name}</strong></p>
            <div className="space-y-4">
              <textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows="4" placeholder="Mensaje..." />
              <div className="flex space-x-3">
                <button onClick={() => setShowMessageModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={handleSendMessage} className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg">Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
