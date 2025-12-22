import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  X, Ticket, DollarSign, Calendar, Image, AlertCircle, 
  CheckCircle, Upload, Trash2, Info
} from 'lucide-react';

const CreateRaffleModal = ({ isOpen, onClose, onSuccess, user }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_price: '',
    ticket_range: '',
    raffle_date: '',
    categories: []
  });
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: form, 2: fee confirmation, 3: payment
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [createdRaffleId, setCreatedRaffleId] = useState(null);

  const categories = [
    'Tecnología', 'Gaming', 'Hogar', 'Moda', 'Deportes', 
    'Viajes', 'Experiencias', 'Dinero', 'Vehículos', 'Otros'
  ];

  // Calculate fee based on total potential value
  // Fee structure:
  // - $0 - $500: $1
  // - $501 - $1,000: $2
  // - $1,001 - $3,000: $3
  // - $3,001 - $5,000: $5
  // - $5,001 - $10,000: $10
  const calculateFee = () => {
    const price = parseFloat(formData.ticket_price) || 0;
    const quantity = parseInt(formData.ticket_range) || 0;
    const totalValue = price * quantity;

    if (totalValue <= 0) return { fee: 0, totalValue: 0, tier: null };
    if (totalValue <= 500) return { fee: 1, totalValue, tier: '$500' };
    if (totalValue <= 1000) return { fee: 2, totalValue, tier: '$1,000' };
    if (totalValue <= 3000) return { fee: 3, totalValue, tier: '$3,000' };
    if (totalValue <= 5000) return { fee: 5, totalValue, tier: '$5,000' };
    if (totalValue <= 10000) return { fee: 10, totalValue, tier: '$10,000' };
    return { fee: -1, totalValue, tier: 'exceeded' }; // Exceeded limit
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'El título es requerido';
    if (!formData.description.trim()) return 'La descripción es requerida';
    if (!formData.ticket_price || parseFloat(formData.ticket_price) <= 0) return 'El precio debe ser mayor a 0';
    if (!formData.ticket_range || parseInt(formData.ticket_range) < 10) return 'Mínimo 10 tickets';
    if (!formData.raffle_date) return 'La fecha del sorteo es requerida';
    
    const raffleDate = new Date(formData.raffle_date);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    if (raffleDate < minDate) return 'La fecha debe ser al menos mañana';

    const { fee } = calculateFee();
    if (fee === -1) return 'El valor total no puede exceder $10,000';

    return null;
  };

  const handleNextStep = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePayAndCreate = async () => {
    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('ticket_price', formData.ticket_price);
      submitData.append('ticket_range', formData.ticket_range);
      submitData.append('raffle_date', formData.raffle_date);
      submitData.append('categories', JSON.stringify(formData.categories));
      
      // Calculate and append fee info
      const { fee, totalValue } = calculateFee();
      submitData.append('creation_fee', fee.toString());
      submitData.append('total_potential_value', totalValue.toString());
      
      // Append images
      imageFiles.forEach((file, index) => {
        submitData.append('images', file);
      });

      // Step 1: Create raffle with pending_payment status
      const response = await axios.post(`${API}/raffles/create-with-fee`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const raffleId = response.data.id;
      setCreatedRaffleId(raffleId);

      // Step 2: Check if Paddle is configured
      const paddleStatus = await axios.get(`${API}/paddle/status`);
      const isSandbox = paddleStatus.data.environment === 'sandbox';
      setIsSandboxMode(isSandbox);
      
      if (paddleStatus.data.configured && paddleStatus.data.client_token) {
        // Step 3: Create checkout session
        const checkoutResponse = await axios.post(`${API}/paddle/create-fee-checkout`, {
          raffle_id: raffleId
        });
        
        setIsSandboxMode(isSandbox);
        
        const priceId = checkoutResponse.data.price_id;
        
        if (!priceId) {
          console.error('No price ID returned from server');
          setLoading(false);
          setError('Error: No se encontró el precio configurado en Paddle');
          return;
        }

        // Initialize Paddle.js and open checkout (both sandbox and production)
        if (window.Paddle) {
          try {
            window.Paddle.Environment.set(isSandbox ? 'sandbox' : 'production');
            window.Paddle.Initialize({
              token: checkoutResponse.data.client_token
            });

            // Open Paddle checkout overlay with the correct priceId
            window.Paddle.Checkout.open({
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                locale: 'en',
                allowLogout: false
              },
              items: [{
                priceId: priceId,
                quantity: 1
              }],
              customData: {
                raffle_id: raffleId,
                fee_payment_id: checkoutResponse.data.fee_payment_id,
                fee_amount: fee
              },
              customer: {
                email: user?.email
              },
              eventCallback: function(event) {
                console.log('Paddle event:', event);
                
                if (event.name === 'checkout.completed') {
                  axios.post(`${API}/raffles/${raffleId}/confirm-payment`, {
                    payment_id: event.data?.transaction_id || 'paddle_' + Date.now(),
                    amount: fee
                  }).then(() => {
                    setStep(3);
                    setLoading(false);
                    setTimeout(() => {
                      onSuccess && onSuccess({ id: raffleId });
                      onClose();
                      resetForm();
                    }, 2000);
                  }).catch(err => {
                    console.error('Payment confirmation error:', err);
                    setError('Error al confirmar el pago');
                    setLoading(false);
                  });
                }
                
                if (event.name === 'checkout.closed') {
                  console.log('Checkout closed');
                  setLoading(false);
                  if (event.data?.status !== 'completed') {
                    setError('Pago cancelado. Tu rifa está guardada y puedes completar el pago más tarde desde "Mis Rifas".');
                  }
                }
                
                if (event.name === 'checkout.error') {
                  console.error('Paddle checkout error:', event);
                  setLoading(false);
                  setError('Error en el proceso de pago. Por favor intenta de nuevo.');
                }
              }
            });
          } catch (paddleError) {
            console.error('Paddle initialization error:', paddleError);
            setLoading(false);
            setError('Error al iniciar el pago. Por favor intenta de nuevo.');
          }
        } else {
          console.warn('Paddle.js not loaded');
          setLoading(false);
          setError('Error al cargar el sistema de pagos. Recarga la página e intenta de nuevo.');
        }
      } else {
        // Paddle not configured
        setLoading(false);
        setError('El sistema de pagos no está configurado. Contacta al administrador.');
      }

    } catch (err) {
      console.error('Error creating raffle:', err);
      setError(err.response?.data?.detail || 'Error al crear la rifa');
      setLoading(false);
    }
  };

  // Handle test payment in sandbox mode
  const handleTestPayment = async () => {
    if (!createdRaffleId) return;
    
    setLoading(true);
    const { fee } = calculateFee();
    
    try {
      await axios.post(`${API}/raffles/${createdRaffleId}/confirm-payment`, {
        payment_id: 'TEST_SANDBOX_' + Date.now(),
        amount: fee
      });
      
      setStep(3);
      setTimeout(() => {
        onSuccess && onSuccess({ id: createdRaffleId });
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      setError('Error al procesar el pago de prueba');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ticket_price: '',
      ticket_range: '',
      raffle_date: '',
      categories: []
    });
    setImages([]);
    setImageFiles([]);
    setStep(1);
    setError('');
    setIsSandboxMode(false);
    setCreatedRaffleId(null);
  };

  if (!isOpen) return null;

  const { fee, totalValue, tier } = calculateFee();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {step === 1 && 'Nueva Rifa'}
            {step === 2 && 'Confirmar y Pagar'}
            {step === 3 && '¡Rifa Creada!'}
          </h2>
          <button 
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Form */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título de la rifa *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ej: iPhone 15 Pro Max"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el premio..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
              </div>

              {/* Price and Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Precio por ticket *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.ticket_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticket_price: e.target.value }))}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cantidad de tickets *
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.ticket_range}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticket_range: e.target.value }))}
                      placeholder="100"
                      min="10"
                      max="10000"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Value Preview */}
              {totalValue > 0 && (
                <div className={`p-3 rounded-lg ${fee === -1 ? 'bg-red-50 border border-red-200' : 'bg-sky-50 border border-sky-200'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={fee === -1 ? 'text-red-700' : 'text-sky-700'}>
                      Valor total potencial:
                    </span>
                    <span className={`font-bold ${fee === -1 ? 'text-red-700' : 'text-sky-700'}`}>
                      ${totalValue.toLocaleString()}
                    </span>
                  </div>
                  {fee === -1 ? (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ El valor máximo permitido es $10,000
                    </p>
                  ) : (
                    <p className="text-xs text-sky-600 mt-1">
                      Fee de creación: ${fee} (tier {tier})
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha del sorteo *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.raffle_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, raffle_date: e.target.value }))}
                    min={minDateStr}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categorías
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.categories.includes(cat)
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Imágenes (máx. 5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center hover:border-sky-500 hover:bg-sky-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-slate-400" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Step 2: Fee Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 mb-3">Resumen de la Rifa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Título:</span>
                    <span className="font-medium text-slate-900">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Precio por ticket:</span>
                    <span className="font-medium text-slate-900">${formData.ticket_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cantidad de tickets:</span>
                    <span className="font-medium text-slate-900">{formData.ticket_range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Valor total potencial:</span>
                    <span className="font-bold text-sky-600">${totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fecha del sorteo:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(formData.raffle_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-800 mb-1">Fee de Creación</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Para publicar tu rifa, se requiere un fee único basado en el valor total potencial.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Tier: hasta {tier}</span>
                        <span className="text-2xl font-bold text-amber-600">${fee}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Tiers Info */}
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <p className="font-medium mb-2">Estructura de fees:</p>
                <ul className="space-y-1">
                  <li>• Hasta $500: $1</li>
                  <li>• Hasta $1,000: $2</li>
                  <li>• Hasta $3,000: $3</li>
                  <li>• Hasta $5,000: $5</li>
                  <li>• Hasta $10,000: $10</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Rifa Creada!</h3>
              <p className="text-slate-600">Tu rifa ha sido publicada exitosamente.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 pb-20 sm:pb-4">
            {step === 1 && (
              <button
                onClick={handleNextStep}
                disabled={fee === -1}
                className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            )}
            {step === 2 && (
              <div className="space-y-2">
                {/* Main Pay button */}
                <button
                  onClick={handlePayAndCreate}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      <span>Pagar ${fee} y Publicar Rifa</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => { setStep(1); setCreatedRaffleId(null); setIsSandboxMode(false); setError(''); }}
                  disabled={loading}
                  className="w-full py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRaffleModal;
