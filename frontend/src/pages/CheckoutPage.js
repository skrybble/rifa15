import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import PayPalTicketCheckout from '../components/PayPalTicketCheckout';
import { ArrowLeft, Ticket, Loader, AlertCircle } from 'lucide-react';

const CheckoutPage = ({ user }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { raffleId, ticketNumbers, amount, raffleTitle, quantity: passedQuantity } = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [raffle, setRaffle] = useState(null);
  const [creator, setCreator] = useState(null);
  const [error, setError] = useState('');
  
  const quantity = passedQuantity || (ticketNumbers ? ticketNumbers.length : 1);

  useEffect(() => {
    if (!raffleId) {
      navigate('/explore');
      return;
    }
    loadRaffleData();
  }, [raffleId]);

  const loadRaffleData = async () => {
    try {
      setLoading(true);
      const raffleRes = await axios.get(`${API}/raffles/${raffleId}`);
      setRaffle(raffleRes.data);
      
      const creatorRes = await axios.get(`${API}/creators/${raffleRes.data.creator_id}/profile`);
      setCreator(creatorRes.data);
    } catch (err) {
      console.error('Error loading raffle:', err);
      setError('Error al cargar la información de la rifa');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data) => {
    navigate('/my-tickets', {
      state: { 
        message: `¡Compra exitosa! Has comprado ${quantity} ticket(s)`,
        showConfetti: true,
        tickets: data?.tickets
      }
    });
  };

  if (!raffleId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-sky-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Check if creator has PayPal configured
  const hasPayPal = creator?.paypal_email;
  const isFreeRaffle = raffle?.ticket_price === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t('common.back')}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isFreeRaffle ? 'Obtener Tickets Gratis' : t('checkout.completePurchase')}
          </h1>
          {raffleTitle && (
            <p className="text-slate-600">{raffleTitle}</p>
          )}
        </div>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {isFreeRaffle ? (
            // Free raffle - just claim tickets
            <FreeTicketClaim 
              raffleId={raffleId}
              quantity={quantity}
              raffleTitle={raffleTitle}
              onSuccess={handleSuccess}
            />
          ) : hasPayPal ? (
            // Paid raffle with PayPal
            <PayPalTicketCheckout
              raffleId={raffleId}
              quantity={quantity}
              amount={amount || (raffle?.ticket_price * quantity)}
              raffleTitle={raffleTitle || raffle?.title}
              creatorPaypalEmail={creator?.paypal_email}
              onSuccess={handleSuccess}
            />
          ) : (
            // Creator doesn't have PayPal configured
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pagos no disponibles</h3>
              <p className="text-slate-600 mb-4">
                El creador de esta rifa aún no ha configurado su método de pago.
              </p>
              <p className="text-sm text-slate-500">
                Por favor, contacta al creador o intenta más tarde.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-6 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Volver a la rifa
              </button>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        {!isFreeRaffle && hasPayPal && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 mb-4">
              {t('checkout.infoProtected')}
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
              <span>🔒 {t('checkout.sslEncrypted')}</span>
              <span>•</span>
              <span>✅ PayPal Verified</span>
              <span>•</span>
              <span>🛡️ {t('checkout.secureData')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for free ticket claims
const FreeTicketClaim = ({ raffleId, quantity, raffleTitle, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API}/tickets/purchase`, {
        raffle_id: raffleId,
        quantity: quantity
      });
      
      onSuccess && onSuccess(response.data);
    } catch (err) {
      console.error('Error claiming tickets:', err);
      setError(err.response?.data?.detail || 'Error al obtener los tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center py-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800 font-medium">🎉 ¡Esta rifa es GRATIS!</p>
        <p className="text-green-600 text-sm">No necesitas pagar para participar</p>
      </div>
      
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-slate-600">Vas a obtener:</p>
        <p className="text-3xl font-bold text-slate-900">{quantity} ticket(s)</p>
        <p className="text-slate-500 text-sm">para {raffleTitle}</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Loader className="w-5 h-5 animate-spin mr-2" />
            Obteniendo tickets...
          </span>
        ) : (
          '🎟️ Obtener Tickets Gratis'
        )}
      </button>
    </div>
  );
};

export default CheckoutPage;
