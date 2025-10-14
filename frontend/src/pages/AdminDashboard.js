import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { ArrowLeft, Users, Ticket, DollarSign, TrendingUp, Play, Mail, Ban, Trash2, CheckCircle } from 'lucide-react';

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

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, rafflesRes] = await Promise.all([
        axios.get(`${API}/dashboard/admin-stats`),
        axios.get(`${API}/creators`),
        axios.get(`${API}/raffles`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRaffles(rafflesRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex space-x-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            data-testid="tab-overview"
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            data-testid="tab-creators"
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'creators'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Creadores
          </button>
          <button
            onClick={() => setActiveTab('raffles')}
            data-testid="tab-raffles"
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'raffles'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Rifas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Resumen de la Plataforma</h2>
            <div className="space-y-4">
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
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Creadores de Contenido</h2>
            <div className="space-y-3">
              {users.map((creator) => (
                <div
                  key={creator.id}
                  data-testid={`creator-row-${creator.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors"
                >
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
                      <p className="text-sm text-slate-500">Estado</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        creator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {creator.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'raffles' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Todas las Rifas</h2>
            <div className="space-y-3">
              {raffles.map((raffle) => (
                <div
                  key={raffle.id}
                  data-testid={`raffle-row-${raffle.id}`}
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
                  <div>
                    {raffle.status === 'active' ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        Activa
                      </span>
                    ) : raffle.status === 'completed' ? (
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                        Finalizada
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;