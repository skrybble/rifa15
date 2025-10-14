import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Ticket, ArrowLeft, Calendar, DollarSign, User, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

const RaffleDetailPage = ({ user, onLogout }) => {
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [creator, setCreator] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRaffleData();
  }, [raffleId]);

  const loadRaffleData = async () => {
    try {
      const raffleRes = await axios.get(`${API}/raffles/${raffleId}`);
      setRaffle(raffleRes.data);

      const creatorRes = await axios.get(`${API}/users/${raffleRes.data.creator_id}`);
      setCreator(creatorRes.data);

      const ticketsRes = await axios.get(`${API}/tickets/raffle/${raffleId}`);
      setMyTickets(ticketsRes.data);
    } catch (error) {
      console.error('Error loading raffle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setError('');
    setSuccess('');
    setPurchasing(true);

    try {
      // Simulate payment (in real app, use Stripe)
      const response = await axios.post(`${API}/tickets/purchase`, {
        raffle_id: raffleId,
        quantity: quantity,
        payment_token: 'test_token_12345'
      });

      setSuccess(`¡Compra exitosa! Has adquirido ${quantity} ticket(s)`);
      loadRaffleData();
      setQuantity(1);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al comprar tickets');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Rifa no encontrada</p>
      </div>
    );
  }

  const availableTickets = raffle.ticket_range - raffle.tickets_sold;
  const progressPercentage = (raffle.tickets_sold / raffle.ticket_range) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            data-testid="back-btn"
            className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Images & Info */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              {raffle.images && raffle.images.length > 0 ? (
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}`}
                  alt={raffle.title}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                  <Ticket className="w-24 h-24 text-white" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Descripción</h2>
              <p className="text-slate-600 leading-relaxed">{raffle.description}</p>

              {raffle.categories && raffle.categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Categorías</h3>
                  <div className="flex flex-wrap gap-2">
                    {raffle.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Creator Info */}
            {creator && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Creador</h2>
                <Link
                  to={`/creator/${creator.id}`}
                  className="flex items-center space-x-4 hover:bg-slate-50 p-3 rounded-lg transition-colors"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {creator.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{creator.full_name}</p>
                    <p className="text-sm text-slate-600">
                      ★ {creator.rating.toFixed(1)} ({creator.rating_count} valoraciones)
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Right: Purchase Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-xl sticky top-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-6">{raffle.title}</h1>

              {/* Status Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-sky-600" />
                    <span className="font-semibold">Precio por ticket</span>
                  </div>
                  <span className="text-2xl font-bold text-sky-600">${raffle.ticket_price}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-sky-600" />
                    <span className="font-semibold">Fecha del sorteo</span>
                  </div>
                  <span className="font-bold">
                    {new Date(raffle.raffle_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Ticket className="w-5 h-5 text-sky-600" />
                    <span className="font-semibold">Tickets disponibles</span>
                  </div>
                  <span className="font-bold">{availableTickets} / {raffle.ticket_range}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-500 mt-2 text-center">
                  {raffle.tickets_sold} tickets vendidos ({progressPercentage.toFixed(1)}%)
                </p>
              </div>

              {/* My Tickets */}
              {myTickets.length > 0 && (
                <div className="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
                  <p className="font-semibold text-sky-900 mb-2">
                    Tus tickets: {myTickets.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {myTickets.map((ticket) => (
                      <span
                        key={ticket.id}
                        className="px-3 py-1 bg-sky-600 text-white rounded-lg text-sm font-bold"
                      >
                        #{ticket.ticket_number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Form */}
              {raffle.status === 'active' && availableTickets > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Cantidad de tickets
                    </label>
                    <input
                      type="number"
                      data-testid="quantity-input"
                      min="1"
                      max={Math.min(availableTickets, 10)}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-center text-xl font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-semibold">Total a pagar</span>
                    <span className="text-3xl font-bold text-sky-600">
                      ${(quantity * raffle.ticket_price).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handlePurchase}
                    data-testid="purchase-btn"
                    disabled={purchasing}
                    className="w-full py-4 bg-sky-600 text-white rounded-lg font-bold text-lg hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span>{purchasing ? 'Procesando...' : 'Comprar Tickets'}</span>
                  </button>

                  <p className="text-xs text-center text-slate-500">
                    El sorteo se realizará automáticamente el día indicado a las 6:00 PM
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-lg font-semibold text-slate-600">
                    {raffle.status !== 'active' ? 'Esta rifa ya no está activa' : 'Tickets agotados'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleDetailPage;