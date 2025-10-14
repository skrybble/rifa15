import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Ticket, ArrowLeft, Plus, TrendingUp, DollarSign, Users, Calendar, Upload, X } from 'lucide-react';

const DashboardPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
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

  useEffect(() => {
    loadDashboard();
  }, []);

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
              onClick={() => setShowCreateModal(true)}
              data-testid="create-raffle-btn"
              className="flex items-center space-x-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Rifa</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Dashboard del Creador</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-8 h-8 text-sky-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total_raffles}</p>
              <p className="text-slate-600">Rifas Totales</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.active_raffles}</p>
              <p className="text-slate-600">Rifas Activas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total_tickets_sold}</p>
              <p className="text-slate-600">Tickets Vendidos</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">${stats.net_earnings.toFixed(2)}</p>
              <p className="text-slate-600">Ganancias Netas</p>
              <p className="text-xs text-slate-400 mt-1">Comisión: ${stats.commission.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Raffles List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Mis Rifas</h2>

          {raffles.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-500 mb-4">Aún no has creado rifas</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
              >
                Crear Mi Primera Rifa
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {raffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  to={`/raffle/${raffle.id}/manage`}
                  data-testid={`raffle-item-${raffle.id}`}
                  className="block p-6 border border-slate-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{raffle.title}</h3>
                      <p className="text-slate-600 mb-3 line-clamp-2">{raffle.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Ticket className="w-4 h-4" />
                          <span>{raffle.tickets_sold} / {raffle.ticket_range} vendidos</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-600">
                          <DollarSign className="w-4 h-4" />
                          <span>${raffle.ticket_price} por ticket</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</span>
                        </div>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Crear Nueva Rifa</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                data-testid="close-modal-btn"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  data-testid="raffle-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  data-testid="raffle-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Rango de Tickets
                  </label>
                  <select
                    data-testid="ticket-range-select"
                    value={formData.ticket_range}
                    onChange={(e) => setFormData({ ...formData, ticket_range: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value={100}>100 tickets</option>
                    <option value={300}>300 tickets</option>
                    <option value={500}>500 tickets</option>
                    <option value={1000}>1000 tickets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Precio por Ticket ($)
                  </label>
                  <input
                    type="number"
                    data-testid="ticket-price-input"
                    step="0.01"
                    min="0.01"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha del Sorteo
                </label>
                <input
                  type="datetime-local"
                  data-testid="raffle-date-input"
                  value={formData.raffle_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
                {dateWarning && (
                  <div className={`mt-2 p-3 rounded-lg text-sm ${
                    dateWarning.includes('⚠️') 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {dateWarning}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Categorías (separadas por comas)
                </label>
                <input
                  type="text"
                  data-testid="categories-input"
                  value={formData.categories}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                  placeholder="Tecnología, Gaming, Deportes"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Upload className="inline w-4 h-4 mr-1" />
                  Imágenes del Premio
                </label>
                <input
                  type="file"
                  data-testid="images-input"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                {images.length > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    {images.length} imagen(es) seleccionada(s)
                  </p>
                )}
              </div>

              <button
                type="submit"
                data-testid="submit-raffle-btn"
                className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
              >
                Crear Rifa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;