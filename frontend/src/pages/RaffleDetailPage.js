import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { Ticket, ArrowLeft, Calendar, DollarSign, ShoppingCart, AlertCircle, CheckCircle, Star } from 'lucide-react';

const RaffleDetailPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [creator, setCreator] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRaffleData();
  }, [raffleId]);

  const loadRaffleData = async () => {
    try {
      const raffleRes = await axios.get(`${API}/raffles/${raffleId}`);
      setRaffle(raffleRes.data);

      const creatorRes = await axios.get(`${API}/creators/${raffleRes.data.creator_id}/profile`);
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
    if (!raffle) return;
    
    const availableTicketsList = [];
    for (let i = raffle.ticket_range[0]; i <= raffle.ticket_range[1]; i++) {
      const isSold = raffle.sold_tickets?.includes(i);
      if (!isSold) {
        availableTicketsList.push(i);
      }
    }
    
    const selectedTickets = [];
    const ticketsToSelect = Math.min(quantity, availableTicketsList.length);
    
    for (let i = 0; i < ticketsToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * availableTicketsList.length);
      selectedTickets.push(availableTicketsList[randomIndex]);
      availableTicketsList.splice(randomIndex, 1);
    }
    
    if (selectedTickets.length === 0) {
      setError('No hay tickets disponibles');
      return;
    }
    
    navigate('/checkout', {
      state: {
        raffleId: raffle.id,
        ticketNumbers: selectedTickets,
        amount: raffle.ticket_price * selectedTickets.length,
        raffleTitle: raffle.title
      }
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = raffle ? `¡Participa en la rifa de ${raffle.title}! Solo $${raffle.ticket_price} por ticket.` : '';

  const handleShare = (platform) => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText} ${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        alert('¡Enlace copiado al portapapeles!');
        return;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p className="text-slate-600">Rifa no encontrada</p>
      </div>
    );
  }

  const availableTickets = raffle.ticket_range - raffle.tickets_sold;
  const progressPercentage = (raffle.tickets_sold / raffle.ticket_range) * 100;

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Fixed Header with Creator */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            data-testid="back-btn"
            className="flex items-center space-x-1 text-slate-600 hover:text-sky-600"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
          
          {/* Creator Info - Compact */}
          {creator && (
            <Link
              to={`/creator/${creator.id}`}
              className="flex items-center space-x-2 hover:bg-slate-50 px-2 py-1 rounded-full transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {creator.full_name.charAt(0)}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-slate-800">{creator.full_name}</span>
                <div className="flex items-center text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs text-slate-600 ml-0.5">{creator.rating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-12 pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Image - Full width */}
          <div className="relative">
            {raffle.images && raffle.images.length > 0 ? (
              <img
                src={`${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}`}
                alt={raffle.title}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                <Ticket className="w-20 h-20 text-white/80" />
              </div>
            )}
            
            {/* Image pagination dots if multiple images */}
            {raffle.images && raffle.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                {raffle.images.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Single Card with all info */}
          <div className="bg-white mx-3 -mt-4 relative z-10 rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Title and Price */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <h1 className="text-xl font-bold text-slate-900 flex-1 pr-4">{raffle.title}</h1>
                <div className="text-right">
                  <span className="text-2xl font-bold text-sky-600">${raffle.ticket_price}</span>
                  <p className="text-xs text-slate-500">por ticket</p>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{raffle.description}</p>
              
              {/* Categories */}
              {raffle.categories && raffle.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {raffle.categories.map((cat, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-xs font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-3 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Sorteo</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm">
                  {new Date(raffle.raffle_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              </div>
              <div className="p-3 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Ticket className="w-4 h-4" />
                  <span className="text-xs">Disponibles</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm">{availableTickets} / {raffle.ticket_range}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 text-center">
                {raffle.tickets_sold} {t('raffle.ticketsSold')} ({progressPercentage.toFixed(1)}%)
              </p>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* My Tickets */}
            {myTickets.length > 0 && (
              <div className="mx-4 mt-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                <p className="font-semibold text-sky-900 text-sm mb-2">
                  {t('raffle.yourTickets')}: {myTickets.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {myTickets.map((ticket) => (
                    <span key={ticket.id} className="px-2 py-0.5 bg-sky-600 text-white rounded text-xs font-bold">
                      #{ticket.ticket_number}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Section */}
            <div className="p-4">
              {raffle.status === 'active' && availableTickets > 0 ? (
                user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-medium text-slate-700">Cantidad:</label>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          data-testid="quantity-input"
                          min="1"
                          max={Math.min(availableTickets, 10)}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-2 border-x border-slate-200 font-bold text-slate-800"
                        />
                        <button 
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex-1 text-right">
                        <span className="text-xl font-bold text-sky-600">
                          ${(quantity * raffle.ticket_price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handlePurchase}
                      data-testid="purchase-btn"
                      disabled={quantity < 1}
                      className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{t('raffle.buyTickets')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-slate-600 text-sm">Inicia sesión para comprar tickets</p>
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all text-center text-sm"
                      >
                        Iniciar Sesión
                      </Link>
                      <Link
                        to="/register"
                        className="flex-1 py-3 bg-white text-sky-600 border-2 border-sky-600 rounded-xl font-semibold hover:bg-sky-50 transition-all text-center text-sm"
                      >
                        Registrarse
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="font-semibold text-slate-500">
                    {raffle.status !== 'active' ? 'Esta rifa ya no está activa' : 'Tickets agotados'}
                  </p>
                </div>
              )}
            </div>

            {/* Share Section - Compact at bottom */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Compartir:</span>
              <div className="flex gap-2">
                <button onClick={() => handleShare('facebook')} className="w-8 h-8 flex items-center justify-center bg-[#1877F2] text-white rounded-full hover:opacity-90 transition-all" title="Facebook">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button onClick={() => handleShare('twitter')} className="w-8 h-8 flex items-center justify-center bg-[#1DA1F2] text-white rounded-full hover:opacity-90 transition-all" title="Twitter">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="w-8 h-8 flex items-center justify-center bg-[#25D366] text-white rounded-full hover:opacity-90 transition-all" title="WhatsApp">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </button>
                <button onClick={() => handleShare('telegram')} className="w-8 h-8 flex items-center justify-center bg-[#0088cc] text-white rounded-full hover:opacity-90 transition-all" title="Telegram">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </button>
                <button onClick={() => handleShare('copy')} className="w-8 h-8 flex items-center justify-center bg-slate-500 text-white rounded-full hover:opacity-90 transition-all" title="Copiar">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-slate-500 mt-4 px-4">
            El sorteo se realizará automáticamente el día indicado a las 6:00 PM
          </p>
        </div>
      </main>
    </div>
  );
};

export default RaffleDetailPage;
