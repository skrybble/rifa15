import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Ticket, ArrowLeft, Plus, TrendingUp, DollarSign, Users, Calendar, X,
  Search, ChevronLeft, ChevronRight, Mail, Ban, Trash2, RefreshCw, Settings,
  AlertTriangle, BarChart3, Play, Shield, Home, Globe
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

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
    if (isSuperAdmin && activeTab === 'admin-calendar') loadCalendar();
  }, [activeTab, calendarDate]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-statistics') loadStatistics();
  }, [activeTab, statisticsPeriod]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-users') loadAllUsers();
  }, [activeTab, usersPage, usersPerPage, usersSearch, usersRole, usersStatus]);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'admin-reviews') {
      loadReviewAlerts();
      loadUsersByReviews();
    }
  }, [activeTab]);

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

  const loadCalendar = async () => {
    try {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1;
      const res = await axios.get(`${API}/admin/raffles/calendar?year=${year}&month=${month}`);
      setCalendarRaffles(res.data);
    } catch (error) {
      console.error('Error loading calendar:', error);
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
      const res = await axios.get(`${API}/admin/users-by-reviews`);
      setUsersByReviews(res.data.data);
    } catch (error) {
      console.error('Error loading users by reviews:', error);
    }
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

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
    return days;
  };

  const formatDateKey = (day) => {
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/explore')} className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium">
              <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">{t('common.back')}</span>
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t('dashboard.title')}</h1>
              {isSuperAdmin && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center">
                  <Shield className="w-3 h-3 mr-1" />{t('dashboard.superAdmin')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              {!isSuperAdmin && (
                <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700">
                  <Plus className="w-5 h-5" /><span className="hidden sm:inline">{t('raffle.newRaffle')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Only show if super admin */}
      {isSuperAdmin && (
        <div className="bg-white border-b sticky top-[73px] z-30 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1">
              {allTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? tab.id.startsWith('admin-') 
                        ? 'text-purple-600 border-b-2 border-purple-600' 
                        : 'text-sky-600 border-b-2 border-sky-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ==================== MI DASHBOARD (Creator View - only for non-super_admin) ==================== */}
        {!isSuperAdmin && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">{t('dashboard.creatorDashboard')}</h2>
            
            {stats && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <Ticket className="w-8 h-8 text-sky-600 mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{stats.total_raffles}</p>
                  <p className="text-slate-600">{t('dashboard.totalRaffles')}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{stats.active_raffles}</p>
                  <p className="text-slate-600">{t('dashboard.activeRaffles')}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <Users className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{stats.total_tickets_sold}</p>
                  <p className="text-slate-600">{t('dashboard.ticketsSold')}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                  <p className="text-3xl font-bold text-slate-900">${stats.net_earnings?.toFixed(2) || '0.00'}</p>
                  <p className="text-slate-600">{t('dashboard.netEarnings')}</p>
                </div>
              </div>
            )}

            <h3 className="text-xl font-bold text-slate-900 mb-4">{t('raffle.myRaffles')}</h3>
            {raffles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">{t('raffle.noTicketsYet')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {raffles.map(raffle => (
                  <div key={raffle.id} className="bg-white rounded-xl p-6 shadow-lg">
                    <h4 className="font-bold text-lg mb-2">{raffle.title}</h4>
                    <div className="flex justify-between text-sm text-slate-600 mb-4">
                      <span>{raffle.tickets_sold}/{raffle.ticket_range} tickets</span>
                      <span className={`px-2 py-1 rounded text-xs ${raffle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {raffle.status}
                      </span>
                    </div>
                    <Link to={`/raffle/${raffle.id}`} className="text-sky-600 hover:text-sky-700 font-medium text-sm">{t('raffle.viewDetails')} →</Link>
                  </div>
                ))}
              </div>
            )}
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
                    <th className="text-center p-3">Estado</th>
                    <th className="text-center p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(c => (
                    <tr key={c.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{c.full_name}</td>
                      <td className="p-3 text-slate-600">{c.email}</td>
                      <td className="p-3 text-center">{c.followers_count || 0}</td>
                      <td className="p-3 text-center">{c.total_raffles || 0}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => { setSelectedUser(c); setShowMessageModal(true); }} className="p-1 hover:bg-sky-100 rounded" title="Mensaje">
                            <Mail className="w-4 h-4 text-sky-600" />
                          </button>
                          <button onClick={() => { setSelectedUser(c); setShowSuspendModal(true); }} className="p-1 hover:bg-amber-100 rounded" title="Suspender">
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
                <option value="">Todos</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Título</th>
                    <th className="text-left p-3">Creador</th>
                    <th className="text-center p-3">Valor</th>
                    <th className="text-center p-3">Tickets</th>
                    <th className="text-center p-3">Fecha</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRaffles.map(r => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{r.title}</td>
                      <td className="p-3 text-slate-600">{r.creator_name}</td>
                      <td className="p-3 text-center">${r.prize_value}</td>
                      <td className="p-3 text-center">{r.tickets_sold}/{r.ticket_range}</td>
                      <td className="p-3 text-center">{new Date(r.raffle_date).toLocaleDateString('es-ES')}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={rafflesPage} setPage={setRafflesPage} total={adminRafflesTotal} perPage={rafflesPerPage} setPerPage={setRafflesPerPage} />
          </div>
        )}

        {/* Admin Calendar */}
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
                      <td className="p-3 font-medium">{u.full_name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-center capitalize">{u.role}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-1">
                          <button onClick={() => { setSelectedUser(u); setShowMessageModal(true); }} className="p-1 hover:bg-sky-100 rounded"><Mail className="w-4 h-4 text-sky-600" /></button>
                          {u.is_active ? (
                            <button onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }} className="p-1 hover:bg-amber-100 rounded"><Ban className="w-4 h-4 text-amber-600" /></button>
                          ) : (
                            <button onClick={() => handleUnsuspendUser(u.id)} className="p-1 hover:bg-green-100 rounded"><RefreshCw className="w-4 h-4 text-green-600" /></button>
                          )}
                          <button onClick={() => handleDeleteUser(u.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
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
                      <div><p className="font-medium">{u.full_name}</p><p className="text-sm text-slate-600">{u.email}</p></div>
                      <button onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Suspender</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold mb-4">Usuarios por Reseñas Negativas</h2>
              {usersByReviews.length === 0 ? (
                <p className="text-slate-500">No hay usuarios con reseñas negativas</p>
              ) : (
                usersByReviews.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg mb-2">
                    <div><p className="font-medium">{u.full_name}</p><p className="text-sm text-slate-600">{u.email}</p></div>
                    <div className="text-right"><p className="font-bold text-red-600">{u.negative_reviews_count} negativas</p></div>
                  </div>
                ))
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
