import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaddleCheckout from '../components/PaddleCheckout';
import { ArrowLeft, Ticket } from 'lucide-react';

const CheckoutPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { raffleId, ticketNumbers, amount, raffleTitle } = location.state || {};

  if (!raffleId || !ticketNumbers) {
    navigate('/explore');
    return null;
  }

  const handleSuccess = () => {
    navigate('/my-tickets', {
      state: { 
        message: t('checkout.successMessage'),
        showConfetti: true
      }
    });
  };

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
            {t('checkout.completePurchase')}
          </h1>
          {raffleTitle && (
            <p className="text-slate-600">
              {raffleTitle}
            </p>
          )}
        </div>

        {/* Checkout Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <PaddleCheckout
            raffleId={raffleId}
            ticketNumbers={ticketNumbers}
            amount={amount}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {t('checkout.infoProtected')}
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
            <span>🔒 {t('checkout.sslEncrypted')}</span>
            <span>•</span>
            <span>✅ {t('checkout.pciCompliant')}</span>
            <span>•</span>
            <span>🛡️ {t('checkout.secureData')}</span>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700 mb-2">
            <strong>{t('checkout.needHelp')}</strong>
          </p>
          <p className="text-xs text-slate-600">
            {t('checkout.helpText')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
