import React, { useState, useEffect } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import axios from 'axios';
import { API } from '../App';
import { CreditCard, ShieldCheck, Globe } from 'lucide-react';

const PaddleCheckout = ({ raffleId, ticketNumbers, amount, onSuccess }) => {
  const [paddle, setPaddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paddleConfigured, setPaddleConfigured] = useState(false);

  useEffect(() => {
    checkPaddleStatus();
  }, []);

  const checkPaddleStatus = async () => {
    try {
      const { data } = await axios.get(`${API}/paddle/status`);
      setPaddleConfigured(data.configured);
      
      if (data.configured && data.vendor_id) {
        initPaddle(data.vendor_id);
      }
    } catch (err) {
      console.error('Error checking Paddle status:', err);
    }
  };

  const initPaddle = async (vendorId) => {
    try {
      const paddleInstance = await initializePaddle({
        vendor: parseInt(vendorId),
        environment: process.env.REACT_APP_PADDLE_ENVIRONMENT || 'sandbox',
      });
      setPaddle(paddleInstance);
    } catch (err) {
      console.error('Error initializing Paddle:', err);
      setError('Error al cargar sistema de pagos');
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Crear checkout en backend
      const { data } = await axios.post(`${API}/paddle/create-checkout`, {
        raffle_id: raffleId,
        ticket_numbers: ticketNumbers,
      });

      // Si Paddle está configurado, abrir checkout real
      if (paddle && paddleConfigured) {
        paddle.Checkout.open({
          override: data.checkout_url,
          successCallback: (checkoutData) => {
            console.log('Payment successful:', checkoutData);
            onSuccess();
          },
          closeCallback: () => {
            setLoading(false);
          },
        });
      } else {
        // Modo simulación - mostrar mensaje
        alert(`
🎉 ¡MODO SIMULACIÓN ACTIVADO!

Tu compra ha sido procesada en modo de prueba.
Los tickets han sido añadidos a tu cuenta.

⚠️ Para procesar pagos reales, configura Paddle con tus credenciales.

Tickets comprados: ${ticketNumbers.join(', ')}
Total: $${amount.toFixed(2)}
        `);
        
        // Simular compra exitosa después de 2 segundos
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen de Compra */}
      <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg border border-sky-200">
        <p className="text-sm font-medium text-slate-700 mb-2">Tickets seleccionados:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ticketNumbers.map(num => (
            <span key={num} className="px-3 py-1 bg-white rounded-full text-sm font-bold text-sky-700 shadow-sm">
              #{num}
            </span>
          ))}
        </div>
        <div className="border-t border-sky-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total a pagar:</span>
            <span className="text-2xl font-bold text-sky-700">${amount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * Impuestos incluidos automáticamente por Paddle
          </p>
        </div>
      </div>

      {/* Estado de Paddle */}
      {!paddleConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">
                Modo Simulación
              </p>
              <p className="text-xs text-amber-700">
                Paddle no está configurado. Los pagos se procesarán en modo de prueba.
                Contacta al administrador para configurar pagos reales.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Botón de Pago */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span className="font-semibold">
              {paddleConfigured ? 'Pagar con Paddle' : 'Continuar (Modo Prueba)'}
            </span>
          </>
        )}
      </button>

      {/* Features de Seguridad */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
        <div className="flex flex-col items-center text-center">
          <ShieldCheck className="w-6 h-6 text-green-600 mb-1" />
          <span className="text-xs text-slate-600">Pago Seguro</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <CreditCard className="w-6 h-6 text-blue-600 mb-1" />
          <span className="text-xs text-slate-600">Todas las Tarjetas</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Globe className="w-6 h-6 text-purple-600 mb-1" />
          <span className="text-xs text-slate-600">Pagos Globales</span>
        </div>
      </div>

      {/* Info adicional */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Procesado por{' '}
          <span className="font-semibold text-slate-700">Paddle</span>
          {' '}• Merchant of Record
        </p>
      </div>
    </div>
  );
};

export default PaddleCheckout;
