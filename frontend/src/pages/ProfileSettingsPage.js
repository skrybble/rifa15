import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  ArrowLeft, User, Camera, Bell, MessageSquare, Shield, 
  CreditCard, Save, X, Trash2, Plus, Check, Globe 
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const ProfileSettingsPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: '',
    description: '',
    profile_image: '',
    cover_image: ''
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    notifications_enabled: true,
    messaging_enabled: true
  });
  
  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState('');
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'card',
    label: '',
    last_four: '',
    is_default: false
  });
  
  // PayPal configuration for creators
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalSaving, setPaypalSaving] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const [paypalSuccess, setPaypalSuccess] = useState('');
  
  // Active tab
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      const [userRes, blockedRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/auth/me`),
        axios.get(`${API}/users/blocked`),
        axios.get(`${API}/users/payment-methods`)
      ]);
      
      const userData = userRes.data;
      setProfileData({
        full_name: userData.full_name,
        description: userData.description || '',
        profile_image: userData.profile_image || '',
        cover_image: userData.cover_image || ''
      });
      
      setPrivacySettings({
        notifications_enabled: userData.notifications_enabled ?? true,
        messaging_enabled: userData.messaging_enabled ?? true
      });
      
      setBlockedUsers(blockedRes.data);
      setPaymentMethods(paymentsRes.data);
      
      // Load PayPal config for creators
      if (userData.role === 'creator' || userData.role === 'admin' || userData.role === 'super_admin') {
        try {
          const paypalRes = await axios.get(`${API}/users/paypal-config`);
          setPaypalEmail(paypalRes.data.paypal_email || '');
        } catch (e) {
          console.log('PayPal config not available');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Save PayPal configuration
  const handleSavePaypal = async () => {
    setPaypalSaving(true);
    setPaypalError('');
    setPaypalSuccess('');
    
    try {
      await axios.put(`${API}/users/paypal-config`, { paypal_email: paypalEmail });
      setPaypalSuccess('PayPal configurado exitosamente');
      setTimeout(() => setPaypalSuccess(''), 3000);
    } catch (error) {
      setPaypalError(error.response?.data?.detail || 'Error al guardar PayPal');
    } finally {
      setPaypalSaving(false);
    }
  };
  
  // Remove PayPal configuration
  const handleRemovePaypal = async () => {
    setPaypalSaving(true);
    try {
      await axios.delete(`${API}/users/paypal-config`);
      setPaypalEmail('');
      setPaypalSuccess('Configuración de PayPal eliminada');
      setTimeout(() => setPaypalSuccess(''), 3000);
    } catch (error) {
      setPaypalError(error.response?.data?.detail || 'Error al eliminar PayPal');
    } finally {
      setPaypalSaving(false);
    }
  };
  
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API}/users/upload-profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData(prev => ({ ...prev, profile_image: response.data.image_url }));
      alert(t('profile.imageUpdated'));
    } catch (error) {
      alert(t('profile.imageError'));
    }
  };
  
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API}/users/upload-cover-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData(prev => ({ ...prev, cover_image: response.data.image_url }));
      alert('Imagen de portada actualizada');
    } catch (error) {
      alert('Error al subir la imagen');
    }
  };
  
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, {
        full_name: profileData.full_name,
        description: profileData.description
      });
      alert(t('profile.changesSaved'));
    } catch (error) {
      alert(t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/users/privacy`, privacySettings);
      alert('Configuración de privacidad actualizada');
    } catch (error) {
      alert('Error al actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBlockUser = async () => {
    if (!userToBlock.trim()) return;
    
    try {
      await axios.post(`${API}/users/block`, { user_id_to_block: userToBlock });
      setShowBlockModal(false);
      setUserToBlock('');
      loadUserData();
      alert('Usuario bloqueado exitosamente');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al bloquear usuario');
    }
  };
  
  const handleUnblockUser = async (userId) => {
    if (!confirm('¿Deseas desbloquear a este usuario?')) return;
    
    try {
      await axios.post(`${API}/users/unblock/${userId}`);
      loadUserData();
      alert('Usuario desbloqueado');
    } catch (error) {
      alert('Error al desbloquear usuario');
    }
  };
  
  const handleAddPaymentMethod = async () => {
    if (!newPayment.label.trim()) {
      alert('Por favor ingresa un nombre para el método de pago');
      return;
    }
    
    try {
      await axios.post(`${API}/users/payment-methods`, newPayment);
      setShowPaymentModal(false);
      setNewPayment({ type: 'card', label: '', last_four: '', is_default: false });
      loadUserData();
      alert('Método de pago agregado');
    } catch (error) {
      alert('Error al agregar método de pago');
    }
  };
  
  const handleDeletePaymentMethod = async (index) => {
    if (!confirm('¿Eliminar este método de pago?')) return;
    
    try {
      await axios.delete(`${API}/users/payment-methods/${index}`);
      loadUserData();
      alert('Método de pago eliminado');
    } catch (error) {
      alert('Error al eliminar método de pago');
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
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900">{t('profile.settingsTitle')}</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'text-sky-600 border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{t('profile.account')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'text-sky-600 border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{t('profile.privacy')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('blocked')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'blocked'
                  ? 'text-sky-600 border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{t('profile.blocked')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'text-sky-600 border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{t('profile.payments')}</span>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">{t('profile.basicInfo')}</h2>
              
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.coverPhoto')}
                </label>
                <div className="relative h-48 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg overflow-hidden">
                  {profileData.cover_image && (
                    <img 
                      src={`${API.replace('/api', '')}${profileData.cover_image}`} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <label className="absolute bottom-4 right-4 cursor-pointer bg-white text-sky-600 px-4 py-2 rounded-lg shadow-lg hover:bg-slate-50 transition-colors flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('profile.coverPhoto')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.profilePicture')}
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profileData.profile_image ? (
                      <img
                        src={`${API.replace('/api', '')}${profileData.profile_image}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {user?.full_name?.charAt(0)}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 cursor-pointer bg-sky-600 text-white p-2 rounded-full shadow-lg hover:bg-sky-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.bio')}
                </label>
                <textarea
                  value={profileData.description}
                  onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder={t('profile.yourDescription')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>
              
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? t('common.loading') : t('profile.saveChanges')}</span>
              </button>
            </div>
          )}
          
          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">{t('profile.privacySettings')}</h2>
              
              <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">{t('profile.notifications')}</p>
                      <p className="text-sm text-slate-600">{t('profile.receiveNotifications')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.notifications_enabled ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Messaging */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">{t('profile.messaging')}</p>
                      <p className="text-sm text-slate-600">{t('profile.receiveMessages')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrivacySettings(prev => ({ ...prev, messaging_enabled: !prev.messaging_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.messaging_enabled ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacySettings.messaging_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Language Selector */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <Globe className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">{t('profile.language') || 'Idioma'}</p>
                      <p className="text-sm text-slate-600">{t('profile.selectLanguage') || 'Selecciona tu idioma preferido'}</p>
                    </div>
                  </div>
                  <LanguageSelector variant="mobile" />
                </div>
              </div>
              
              <button
                onClick={handleSavePrivacy}
                disabled={saving}
                className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? t('common.loading') : t('profile.saveChanges')}</span>
              </button>
            </div>
          )}
          
          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{t('profile.blockedUsers')}</h2>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('profile.blockUser')}</span>
                </button>
              </div>
              
              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">{t('profile.noBlockedUsers')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {blockedUser.profile_image ? (
                          <img
                            src={`${API.replace('/api', '')}${blockedUser.profile_image}`}
                            alt={blockedUser.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {blockedUser.full_name.charAt(0)}
                          </div>
                        )}
                        <p className="font-medium text-slate-900">{blockedUser.full_name}</p>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(blockedUser.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        {t('profile.unblock')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Payment Methods Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* PayPal Configuration for Creators */}
              {(user?.role === 'creator' || user?.role === 'admin' || user?.role === 'super_admin') && (
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">PayPal para Recibir Pagos</h3>
                      <p className="text-sm text-slate-600">Configura tu PayPal para recibir pagos de tickets vendidos</p>
                    </div>
                  </div>
                  
                  {paypalSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center space-x-2">
                      <Check className="w-5 h-5" />
                      <span>{paypalSuccess}</span>
                    </div>
                  )}
                  
                  {paypalError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
                      {paypalError}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email de PayPal
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="tu-email@paypal.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Este es el email donde recibirás los pagos cuando alguien compre tickets de tus rifas
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSavePaypal}
                        disabled={paypalSaving || !paypalEmail}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {paypalSaving ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Guardar PayPal</span>
                          </>
                        )}
                      </button>
                      {paypalEmail && (
                        <button
                          onClick={handleRemovePaypal}
                          disabled={paypalSaving}
                          className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!paypalEmail && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        ⚠️ Sin PayPal configurado, solo puedes crear rifas con tickets gratuitos ($0)
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Existing Payment Methods Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">{t('profile.paymentMethods')}</h2>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('profile.addPaymentMethod')}</span>
                  </button>
                </div>
                
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">{t('profile.noPaymentMethods')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="font-medium text-slate-900">{method.label}</p>
                            <p className="text-sm text-slate-600">
                              {method.type === 'card' && method.last_four && `•••• ${method.last_four}`}
                              {method.type === 'paypal' && 'PayPal'}
                              {method.type === 'google_pay' && 'Google Pay'}
                            </p>
                          </div>
                          {method.is_default && (
                            <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full font-medium">
                              Predeterminado
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{t('profile.blockUserTitle')}</h3>
              <button onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={userToBlock}
              onChange={(e) => setUserToBlock(e.target.value)}
              placeholder={t('profile.enterUsername')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-4"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleBlockUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('profile.block')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{t('profile.addPaymentMethod')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('checkout.paymentMethod')}</label>
                <select
                  value={newPayment.type}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="card">{t('checkout.creditCard')}</option>
                  <option value="paypal">PayPal</option>
                  <option value="google_pay">Google Pay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newPayment.label}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Visa Principal"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              
              {newPayment.type === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Últimos 4 dígitos</label>
                  <input
                    type="text"
                    value={newPayment.last_four}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, last_four: e.target.value.slice(0, 4) }))}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newPayment.is_default}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <label htmlFor="is_default" className="text-sm text-slate-700">
                  Establecer como predeterminado
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPaymentMethod}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsPage;
