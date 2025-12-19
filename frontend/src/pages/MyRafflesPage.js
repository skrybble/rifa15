import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Ticket, Plus, Calendar, DollarSign, Users, TrendingUp, 
  Eye, Edit, Trash2, Clock, CheckCircle, XCircle, ArrowLeft,
  BarChart3, Gift, AlertCircle
} from 'lucide-react';
import CreateRaffleModal from '../components/CreateRaffleModal';

const MyRafflesPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [rafflesRes, statsRes] = await Promise.all([
        axios.get(`${API}/raffles?creator_id=${user.id}`),
        axios.get(`${API}/dashboard/creator-stats`)
      ]);
      setRaffles(rafflesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading raffles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRaffles = raffles.filter(raffle => {
    if (filter === 'all') return true;
    return raffle.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Activa</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Completada</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center"><XCircle className="w-3 h-3 mr-1" />Cancelada</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatTimeRemaining = (dateStr) => {
    const end = new Date(dateStr);
    const now = new Date();
    const diff = end - now;
    if (diff < 0) return 'Finalizado';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h restantes`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-200 to-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-sky-600" />
            <span className="font-bold text-slate-900">Mis Rifas</span>
          </div>
          <Link 
            to="/dashboard?tab=create"
            className="p-2 -mr-2 bg-sky-600 hover:bg-sky-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-lg text-center">
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Ticket className="w-5 h-5 text-sky-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{stats.total_raffles || 0}</p>
              <p className="text-[10px] text-slate-500">Total Rifas</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">${stats.total_revenue?.toFixed(0) || 0}</p>
              <p className="text-[10px] text-slate-500">Ingresos</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg text-center">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{stats.total_tickets_sold || 0}</p>
              <p className="text-[10px] text-slate-500">Tickets</p>
            </div>
          </div>
        )}

        {/* Create New Raffle Button */}
        <Link
          to="/dashboard?tab=create"
          className="block w-full mb-4 p-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl shadow-lg text-white hover:from-sky-600 hover:to-blue-700 transition-all"
        >
          <div className="flex items-center justify-center space-x-3">
            <Plus className="w-6 h-6" />
            <span className="font-bold text-lg">Crear Nueva Rifa</span>
          </div>
        </Link>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'active', label: 'Activas' },
            { key: 'completed', label: 'Completadas' },
            { key: 'cancelled', label: 'Canceladas' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Raffles List */}
        {filteredRaffles.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">No tienes rifas</h3>
            <p className="text-slate-500 text-sm mb-4">Crea tu primera rifa y comienza a vender tickets</p>
            <Link
              to="/dashboard?tab=create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Rifa</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRaffles.map(raffle => (
              <div key={raffle.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-100">
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0">
                    {raffle.images && raffle.images[0] ? (
                      <img 
                        src={raffle.images[0].startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}` : raffle.images[0]}
                        alt={raffle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                        <Ticket className="w-8 h-8 text-white/70" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate pr-2">{raffle.title}</h3>
                      {getStatusBadge(raffle.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 mb-2">
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1 text-sky-600" />
                        <span className="font-semibold text-sky-600">${raffle.ticket_price}</span>
                      </div>
                      <div className="flex items-center">
                        <Ticket className="w-3 h-3 mr-1" />
                        <span>{raffle.tickets_sold}/{raffle.ticket_range}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <Clock className="w-3 h-3 mr-1 text-orange-500" />
                        <span className="text-orange-600">{formatTimeRemaining(raffle.raffle_date)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                        style={{ width: `${(raffle.tickets_sold / raffle.ticket_range) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                  <Link
                    to={`/raffle/${raffle.id}`}
                    className="flex-1 py-2.5 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver
                  </Link>
                  <Link
                    to={`/raffle/${raffle.id}/manage`}
                    className="flex-1 py-2.5 flex items-center justify-center text-sky-600 hover:bg-sky-50 transition-colors text-sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    Gestionar
                  </Link>
                  <Link
                    to={`/dashboard?tab=edit&raffle=${raffle.id}`}
                    className="flex-1 py-2.5 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRafflesPage;
