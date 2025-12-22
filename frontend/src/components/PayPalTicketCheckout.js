import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const PayPalTicketCheckout = ({ raffleId, quantity, amount, raffleTitle, creatorPaypalEmail, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    initializeOrder();
  }, [raffleId, quantity]);

  const initializeOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create order in backend
      const response = await axios.post(`${API}/paypal/create-ticket-order`, {
        raffle_id: raffleId,
        quantity: quantity
      });
      
      setOrderData(response.data);
      setPaypalClientId(response.data.paypal_client_id);
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.detail || 'Error al preparar el pago');
    } finally {
      setLoading(false);
    }
  };

  const createPayPalOrder = (data, actions) => {
    if (!orderData) return;
    
    return actions.order.create({
      purchase_units: [{
        description: `${quantity} ticket(s) para ${raffleTitle}`,
        amount: {
          value: orderData.total_amount.toFixed(2),
          currency_code: 'USD'
        },
        payee: {
          email_address: orderData.creator_paypal_email
        },
        custom_id: orderData.order_id
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
    });
  };

  const onApprove = async (data, actions) => {
    try {
      // Capture the payment
      const details = await actions.order.capture();
      
      // Confirm in backend
      const response = await axios.post(`${API}/paypal/capture-ticket-order/${orderData.order_id}`, null, {
        params: { paypal_order_id: details.id }
      });
      
      setPaymentComplete(true);
      
      // Call success callback
      setTimeout(() => {
        onSuccess && onSuccess(response.data);
      }, 2000);
      
    } catch (err) {
      console.error('Error capturing payment:', err);
      setError('Error al procesar el pago. Por favor intenta de nuevo.');
    }
  };

  const onError = (err) => {
    console.error('PayPal error:', err);
    setError('Error en PayPal. Por favor intenta de nuevo.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600">Preparando el pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={initializeOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">¡Pago Exitoso!</h3>
        <p className="text-slate-600">Tus tickets han sido asignados</p>
      </div>
    );
  }

  if (!paypalClientId || !orderData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-600">No se pudo cargar el sistema de pagos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">Resumen de Compra</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Rifa:</span>
            <span className="font-medium text-slate-900">{raffleTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Cantidad de tickets:</span>
            <span className="font-medium text-slate-900">{quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Precio por ticket:</span>
            <span className="font-medium text-slate-900">${orderData.ticket_price}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-slate-900">Total:</span>
              <span className="font-bold text-green-600 text-lg">${orderData.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PayPal Buttons */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600 mb-4 text-center">
          Pago seguro con PayPal a <strong>{orderData.creator_name}</strong>
        </p>
        
        <PayPalScriptProvider options={{ 
          "client-id": paypalClientId,
          currency: "USD",
          intent: "capture"
        }}>
          <PayPalButtons
            style={{ 
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "pay"
            }}
            createOrder={createPayPalOrder}
            onApprove={onApprove}
            onError={onError}
            onCancel={() => setError('Pago cancelado')}
          />
        </PayPalScriptProvider>
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 text-center">
        El pago va directamente al creador de la rifa. RafflyWin no retiene ningún porcentaje de esta transacción.
      </p>
    </div>
  );
};

export default PayPalTicketCheckout;
