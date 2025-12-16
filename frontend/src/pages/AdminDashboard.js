import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { 
  ArrowLeft, Users, Ticket, DollarSign, TrendingUp, Play, Mail, 
  Ban, Trash2, CheckCircle, X, ChevronLeft, ChevronRight, Search,
  Calendar, AlertTriangle, Settings, BarChart3, Clock, Filter,
  Eye, MessageSquare, UserX, RefreshCw
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats
  const [stats, setStats] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [statisticsPeriod, setStatisticsPeriod] = useState('month');
  
  // Creators
  const [creators, setCreators] = useState([]);
  const [creatorsTotal, setCreatorsTotal] = useState(0);
  const [creatorsPage, setCreatorsPage] = useState(1);
  const [creatorsPerPage, setCreatorsPerPage] = useState(10);
  const [creatorsSearch, setCreatorsSearch] = useState('');
  const [creatorsSortBy, setCreatorsSortBy] = useState('created_at');
  const [creatorsSortOrder, setCreatorsSortOrder] = useState('desc');
  
  // Raffles
  const [raffles, setRaffles] = useState([]);
  const [rafflesTotal, setRafflesTotal] = useState(0);
  const [rafflesPage, setRafflesPage] = useState(1);
  const [rafflesPerPage, setRafflesPerPage] = useState(10);
  const [rafflesSearch, setRafflesSearch] = useState('');
  const [rafflesSortBy, setRafflesSortBy] = useState('created_at');
  const [rafflesSortOrder, setRafflesSortOrder] = useState('desc');
  const [rafflesStatus, setRafflesStatus] = useState('');
  
  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarRaffles, setCalendarRaffles] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Users & Moderation
  const [allUsers, setAllUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersStatus, setUsersStatus] = useState('');
  
  // Review Alerts
  const [reviewAlerts, setReviewAlerts] = useState([]);
  const [usersByReviews, setUsersByReviews] = useState([]);
  const [alertThreshold, setAlertThreshold] = useState(3);
  
  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendDuration, setSuspendDuration] = useState('24');
  const [suspendReason, setSuspendReason] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'creators') loadCreators();
  }, [creatorsPage, creatorsPerPage, creatorsSearch, creatorsSortBy, creatorsSortOrder]);

  useEffect(() => {
    if (activeTab === 'raffles') loadRaffles();
  }, [rafflesPage, rafflesPerPage, rafflesSearch, rafflesSortBy, rafflesSortOrder, rafflesStatus]);

  useEffect(() => {
    if (activeTab === 'calendar') loadCalendar();
  }, [calendarDate]);

  useEffect(() => {
    if (activeTab === 'statistics') loadStatistics();
  }, [statisticsPeriod]);

  useEffect(() => {
    if (activeTab === 'users') loadAllUsers();
  }, [usersPage, usersPerPage, usersSearch, usersRole, usersStatus]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviewAlerts();
      loadUsersByReviews();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const statsRes = await axios.get(`${API}/dashboard/admin-stats`);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
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

  const loadRaffles = async () => {
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
      setRaffles(res.data.data);
      setRafflesTotal(res.data.total);
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
      loadInitialData();
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
    
    // Add empty days for the start of the week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    
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
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm text-slate-600">de {total}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">Página {page} de {totalPages || 1}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
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

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'creators', label: 'Creadores', icon: Users },
    { id: 'raffles', label: 'Rifas', icon: Ticket },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'reviews', label: 'Reseñas', icon: AlertTriangle },
    { id: 'statistics', label: 'Estadísticas', icon: TrendingUp },
    { id: 'earnings', label: 'Ganancias', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center space-x-2 text-slate-700 hover:text-sky-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Panel Admin</h1>
            <button
              onClick={handleManualDraw}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Sorteo Manual</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-sky-600 border-b-2 border-sky-600'
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow">
                <Users className="w-8 h-8 text-sky-600 mb-2" />
                <p className="text-3xl font-bold">{stats.total_users}</p>
                <p className="text-slate-600">Usuarios</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-3xl font-bold">{stats.total_creators}</p>
                <p className="text-slate-600">Creadores</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <Ticket className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-3xl font-bold">{stats.active_raffles}</p>
                <p className="text-slate-600">Rifas Activas</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                <p className="text-3xl font-bold">${stats.commission_revenue?.toFixed(2)}</p>
                <p className="text-slate-600">Comisiones</p>
              </div>
            </div>
          </div>
        )}

        {/* Creators Tab */}
        {activeTab === 'creators' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={creatorsSearch}
                  onChange={(e) => { setCreatorsSearch(e.target.value); setCreatorsPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={`${creatorsSortBy}-${creatorsSortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setCreatorsSortBy(field);
                  setCreatorsSortOrder(order);
                  setCreatorsPage(1);
                }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="created_at-desc">Fecha (reciente)</option>
                <option value="created_at-asc">Fecha (antiguo)</option>
                <option value="followers_count-desc">Popularidad (mayor)</option>
                <option value="followers_count-asc">Popularidad (menor)</option>
                <option value="full_name-asc">Nombre (A-Z)</option>
                <option value="full_name-desc">Nombre (Z-A)</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Creador</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-center p-3">Seguidores</th>
                    <th className="text-center p-3">Rifas Total</th>
                    <th className="text-center p-3">Rifas Activas</th>
                    <th className="text-center p-3">Estado</th>
                    <th className="text-center p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map(creator => (
                    <tr key={creator.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{creator.full_name}</td>
                      <td className="p-3 text-slate-600">{creator.email}</td>
                      <td className="p-3 text-center">{creator.followers_count || 0}</td>
                      <td className="p-3 text-center">{creator.total_raffles || 0}</td>
                      <td className="p-3 text-center">{creator.active_raffles || 0}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${creator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {creator.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => { setSelectedUser(creator); setShowMessageModal(true); }}
                            className="p-1 hover:bg-sky-100 rounded"
                            title="Enviar mensaje"
                          >
                            <Mail className="w-4 h-4 text-sky-600" />
                          </button>
                          <button
                            onClick={() => { setSelectedUser(creator); setShowSuspendModal(true); }}
                            className="p-1 hover:bg-amber-100 rounded"
                            title="Suspender"
                          >
                            <Ban className="w-4 h-4 text-amber-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={creatorsPage}
              setPage={setCreatorsPage}
              total={creatorsTotal}
              perPage={creatorsPerPage}
              setPerPage={setCreatorsPerPage}
            />
          </div>
        )}

        {/* Raffles Tab */}
        {activeTab === 'raffles' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar rifa..."
                  value={rafflesSearch}
                  onChange={(e) => { setRafflesSearch(e.target.value); setRafflesPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={rafflesStatus}
                onChange={(e) => { setRafflesStatus(e.target.value); setRafflesPage(1); }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <select
                value={`${rafflesSortBy}-${rafflesSortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setRafflesSortBy(field);
                  setRafflesSortOrder(order);
                  setRafflesPage(1);
                }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="created_at-desc">Fecha creación (reciente)</option>
                <option value="raffle_date-asc">Fecha sorteo (próximas)</option>
                <option value="prize_value-desc">Valor (mayor)</option>
                <option value="prize_value-asc">Valor (menor)</option>
                <option value="tickets_sold-desc">Popularidad (mayor)</option>
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
                    <th className="text-center p-3">Fecha Sorteo</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map(raffle => (
                    <tr key={raffle.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{raffle.title}</td>
                      <td className="p-3 text-slate-600">{raffle.creator_name}</td>
                      <td className="p-3 text-center">${raffle.prize_value}</td>
                      <td className="p-3 text-center">{raffle.tickets_sold}/{raffle.ticket_range}</td>
                      <td className="p-3 text-center">{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          raffle.status === 'active' ? 'bg-green-100 text-green-700' :
                          raffle.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {raffle.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={rafflesPage}
              setPage={setRafflesPage}
              total={rafflesTotal}
              perPage={rafflesPerPage}
              setPerPage={setRafflesPerPage}
            />
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                className="p-2 hover:bg-slate-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">
                {calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                className="p-2 hover:bg-slate-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(calendarDate).map((day, i) => {
                const dateKey = day ? formatDateKey(day) : null;
                const dayRaffles = dateKey ? calendarRaffles[dateKey] : null;
                const hasRaffles = dayRaffles && dayRaffles.length > 0;

                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(dateKey)}
                    className={`min-h-[80px] p-2 border rounded ${
                      day ? 'cursor-pointer hover:bg-slate-50' : ''
                    } ${selectedDay === dateKey ? 'ring-2 ring-sky-500' : ''}`}
                  >
                    {day && (
                      <>
                        <span className="text-sm font-medium">{day}</span>
                        {hasRaffles && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded">
                              {dayRaffles.length} rifa{dayRaffles.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDay && calendarRaffles[selectedDay] && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-bold mb-3">Rifas del {selectedDay}</h3>
                <div className="space-y-2">
                  {calendarRaffles[selectedDay].map(raffle => (
                    <div key={raffle.id} className="bg-white p-3 rounded border">
                      <p className="font-medium">{raffle.title}</p>
                      <p className="text-sm text-slate-600">{raffle.creator_name} - ${raffle.prize_value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={usersSearch}
                  onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={usersRole}
                onChange={(e) => { setUsersRole(e.target.value); setUsersPage(1); }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Todos los roles</option>
                <option value="user">Usuario</option>
                <option value="creator">Creador</option>
              </select>
              <select
                value={usersStatus}
                onChange={(e) => { setUsersStatus(e.target.value); setUsersPage(1); }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Todos los estados</option>
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
                    <th className="text-center p-3">Registro</th>
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
                      <td className="p-3 text-center text-slate-600">
                        {new Date(u.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => { setSelectedUser(u); setShowMessageModal(true); }}
                            className="p-1 hover:bg-sky-100 rounded"
                            title="Mensaje"
                          >
                            <Mail className="w-4 h-4 text-sky-600" />
                          </button>
                          {u.is_active ? (
                            <button
                              onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }}
                              className="p-1 hover:bg-amber-100 rounded"
                              title="Suspender"
                            >
                              <Ban className="w-4 h-4 text-amber-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnsuspendUser(u.id)}
                              className="p-1 hover:bg-green-100 rounded"
                              title="Quitar suspensión"
                            >
                              <RefreshCw className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={usersPage}
              setPage={setUsersPage}
              total={usersTotal}
              perPage={usersPerPage}
              setPerPage={setUsersPerPage}
            />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuración de Alertas
              </h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-600">
                  Alertar después de
                </label>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                  className="w-20 border rounded px-3 py-2"
                  min="1"
                />
                <span className="text-sm text-slate-600">reseñas negativas consecutivas</span>
                <button
                  onClick={handleUpdateThreshold}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Alerts */}
            {reviewAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Alertas Activas ({reviewAlerts.length})
                </h2>
                <div className="space-y-3">
                  {reviewAlerts.map(u => (
                    <div key={u.id} className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{u.full_name}</p>
                          <p className="text-sm text-slate-600">{u.email}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-red-600 font-bold">
                            {u.consecutive_negative_reviews} reseñas negativas
                          </span>
                          <button
                            onClick={() => { setSelectedUser(u); setShowSuspendModal(true); }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                          >
                            Suspender
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users by Reviews */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold mb-4">Usuarios por Reseñas Negativas</h2>
              <div className="space-y-3">
                {usersByReviews.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-sm text-slate-600">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{u.negative_reviews_count} negativas</p>
                      <p className="text-sm text-slate-600">Promedio: {u.avg_review_score}★</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="flex space-x-2">
              {['day', 'week', 'month', 'year'].map(p => (
                <button
                  key={p}
                  onClick={() => setStatisticsPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    statisticsPeriod === p ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>

            {statistics && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold mb-4">Registros</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Usuarios</span>
                      <span className="font-bold">{statistics.registrations.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creadores</span>
                      <span className="font-bold">{statistics.registrations.creators}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total</span>
                      <span className="font-bold text-sky-600">{statistics.registrations.total}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold mb-4">Ingresos</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Ventas</span>
                      <span className="font-bold">${statistics.revenue.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Comisiones</span>
                      <span className="font-bold text-green-600">${statistics.revenue.commission.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-600 mb-2">Ganancias con Paddle</h2>
              <p className="text-slate-500">
                Esta sección estará disponible cuando configures la integración con Paddle.
              </p>
              <p className="text-sm text-slate-400 mt-4">
                Agrega PADDLE_AUTH_CODE en el archivo .env del backend
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Suspender Usuario</h3>
              <button onClick={() => setShowSuspendModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 mb-4">
              Suspender a <strong>{selectedUser.full_name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duración</label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="24">24 horas</option>
                  <option value="72">3 días</option>
                  <option value="168">7 días</option>
                  <option value="720">30 días</option>
                  <option value="permanent">Permanente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Razón</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Motivo de la suspensión..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSuspendUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Suspender
                </button>
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
              <button onClick={() => setShowMessageModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 mb-4">
              Mensaje para <strong>{selectedUser.full_name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="4"
                  placeholder="Escribe tu mensaje..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
