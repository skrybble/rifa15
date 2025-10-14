import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { ArrowLeft, Users, Ticket, DollarSign, TrendingUp, Play, Mail, Ban, Trash2, CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [creatorsRaffleCount, setCreatorsRaffleCount] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Pagination & Filters
  const [rafflesPerPage, setRafflesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredRaffles, setFilteredRaffles] = useState([]);
  
  // Messaging
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    filterRaffles();
  }, [raffles, dateFilter]);

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, rafflesRes, commissionsRes] = await Promise.all([
        axios.get(`${API}/dashboard/admin-stats`),
        axios.get(`${API}/creators`),
        axios.get(`${API}/raffles`),
        axios.get(`${API}/admin/commissions`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRaffles(rafflesRes.data);
      setCommissions(commissionsRes.data);
      
      // Load raffle counts for each creator
      const counts = {};
      for (const creator of usersRes.data) {
        const countRes = await axios.get(`${API}/admin/creator/${creator.id}/raffles-count`);
        counts[creator.id] = countRes.data.count;
      }
      setCreatorsRaffleCount(counts);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRaffles = () => {
    let filtered = [...raffles];
    
    if (dateFilter !== 'all') {
      const now = new Date();
      let daysToFilter = 0;
      
      switch(dateFilter) {
        case '1day': daysToFilter = 1; break;
        case '1week': daysToFilter = 7; break;
        case '2weeks': daysToFilter = 14; break;
        case '1month': daysToFilter = 30; break;
        case '3months': daysToFilter = 90; break;
        case '6months': daysToFilter = 180; break;
        default: daysToFilter = 0;
      }
      
      const filterDate = new Date(now.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(r => new Date(r.raffle_date) >= filterDate);
    }
    
    setFilteredRaffles(filtered);
    setCurrentPage(1);
  };

  const getPaginatedRaffles = () => {
    const startIndex = (currentPage - 1) * rafflesPerPage;
    const endIndex = startIndex + rafflesPerPage;
    return filteredRaffles.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredRaffles.length / rafflesPerPage);

  const handleManualDraw = async () => {
    if (!confirm('¿Estás seguro de ejecutar el sorteo manual?')) return;

    try {
      await axios.post(`${API}/admin/draw`);
      alert('Sorteo ejecutado exitosamente');
      loadAdminData();
    } catch (error) {
      alert('Error al ejecutar sorteo');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/toggle-active`);
      alert('Estado del usuario actualizado');
      loadAdminData();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      alert('Usuario eliminado exitosamente');
      loadAdminData();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageSubject || !messageContent) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await axios.post(`${API}/messages`, {
        to_user_id: selectedUser.id,
        subject: messageSubject,
        content: messageContent
      });
      alert('Mensaje enviado exitosamente');
      setShowMessageModal(false);
      setSelectedUser(null);
      setMessageSubject('');
      setMessageContent('');
    } catch (error) {
      alert('Error al enviar mensaje');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/explore')}
              data-testid="back-btn"
              className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <button
              onClick={handleManualDraw}
              data-testid="manual-draw-btn"
              className="flex items-center space-x-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
            >
              <Play className="w-5 h-5" />
              <span>Ejecutar Sorteo Manual</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Panel de Administración</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-sky-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total_users}</p>
              <p className="text-slate-600">Usuarios Totales</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total_creators}</p>
              <p className="text-slate-600">Creadores</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total_raffles}</p>
              <p className="text-slate-600">Rifas Totales</p>
              <p className="text-xs text-green-600 mt-1">{stats.active_raffles} activas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">${stats.commission_revenue.toFixed(2)}</p>
              <p className="text-slate-600">Comisiones (1%)</p>
              <p className="text-xs text-slate-400 mt-1">De ${stats.total_revenue.toFixed(2)} total</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'overview' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-600'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'creators' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-600'
            }`}
          >
            Creadores
          </button>
          <button
            onClick={() => setActiveTab('raffles')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'raffles' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-600'
            }`}
          >
            Rifas
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'commissions' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-600'
            }`}
          >
            Comisiones
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Resumen de la Plataforma</h2>
            <div className="space-y-4 mb-8">
              <p className="text-slate-600">
                La plataforma cuenta con <span className="font-bold text-sky-600">{stats?.total_users}</span> usuarios
                y <span className="font-bold text-sky-600">{stats?.total_creators}</span> creadores activos.
              </p>
              <p className="text-slate-600">
                Se han creado <span className="font-bold text-sky-600">{stats?.total_raffles}</span> rifas en total,
                de las cuales <span className="font-bold text-green-600">{stats?.active_raffles}</span> están activas.
              </p>
              <p className="text-slate-600">
                Las comisiones generadas ascienden a{' '}
                <span className="font-bold text-amber-600">${stats?.commission_revenue.toFixed(2)}</span>,
                equivalentes al 1% de ${stats?.total_revenue.toFixed(2)} en ventas totales.
              </p>
            </div>
            
            {/* Creadores Destacados */}
            <h3 className="text-xl font-bold text-slate-900 mb-4">Creadores Destacados</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.slice(0, 6).map((creator) => (
                <div
                  key={creator.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {creator.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{creator.full_name}</p>
                      <p className="text-sm text-slate-600">⭐ {creator.rating.toFixed(1)} ({creator.rating_count})</p>
                      <p className="text-sm text-sky-600 font-semibold">🎫 {creatorsRaffleCount[creator.id] || 0} rifas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creators Tab */}
        {activeTab === 'creators' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Creadores de Contenido</h2>
            <div className="space-y-3">
              {users.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {creator.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{creator.full_name}</p>
                      <p className="text-sm text-slate-600">{creator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Rating</p>
                      <p className="font-bold text-slate-900">⭐ {creator.rating.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Seguidores</p>
                      <p className="font-bold text-slate-900">{creator.followers?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Rifas</p>
                      <p className="font-bold text-slate-900">{creatorsRaffleCount[creator.id] || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Estado</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        creator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {creator.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(creator.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        title={creator.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {creator.is_active ? <Ban className="w-5 h-5 text-orange-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
                      </button>
                      <button
                        onClick={() => { setSelectedUser(creator); setShowMessageModal(true); }}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Mail className="w-5 h-5 text-sky-600" />
                      </button>
                      <button onClick={() => handleDeleteUser(creator.id)} className="p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raffles Tab with Pagination and Filters */}
        {activeTab === 'raffles' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Todas las Rifas</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="1day">Último día</option>
                  <option value="1week">Última semana</option>
                  <option value="2weeks">Últimas 2 semanas</option>
                  <option value="1month">Último mes</option>
                  <option value="3months">Últimos 3 meses</option>
                  <option value="6months">Últimos 6 meses</option>
                </select>
                <select
                  value={rafflesPerPage}
                  onChange={(e) => { setRafflesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="10">10 por página</option>
                  <option value="25">25 por página</option>
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {getPaginatedRaffles().map((raffle) => (
                <Link
                  key={raffle.id}
                  to={`/raffle/${raffle.id}/manage`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{raffle.title}</p>
                    <p className="text-sm text-slate-600 line-clamp-1">{raffle.description}</p>
                    <div className="flex space-x-4 mt-2 text-xs text-slate-500">
                      <span>Tickets: {raffle.tickets_sold}/{raffle.ticket_range}</span>
                      <span>Precio: ${raffle.ticket_price}</span>
                      <span>{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    raffle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {raffle.status === 'active' ? 'Activa' : 'Finalizada'}
                  </span>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Mostrando {Math.min((currentPage - 1) * rafflesPerPage + 1, filteredRaffles.length)} - {Math.min(currentPage * rafflesPerPage, filteredRaffles.length)} de {filteredRaffles.length} rifas
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 border border-slate-300 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Comisiones por Creador</h2>
            <div className="space-y-3">
              {commissions.map((commission, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-900">{commission.creator_name || 'Creador desconocido'}</p>
                    <p className="text-sm text-slate-600">{commission.tickets_count} tickets vendidos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">Ventas: ${commission.total_sales.toFixed(2)}</p>
                    <p className="text-sm text-amber-600 font-semibold">Comisión: ${commission.commission.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {commissions.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay comisiones registradas</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Enviar Mensaje</h2>
              <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600">Para: <span className="font-bold">{selectedUser?.full_name}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Asunto</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mensaje</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                onClick={handleSendMessage}
                className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700"
              >
                Enviar Mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
