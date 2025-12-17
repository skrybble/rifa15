import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  X, Mail, User, Calendar, Shield, Star, Ticket, Users, 
  MessageSquare, Image, Ban, Eye, ExternalLink, Clock,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp
} from 'lucide-react';

const UserDetailModal = ({ userId, onClose, onSuspend, onMessage }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [expandedMessage, setExpandedMessage] = useState(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user details
      const userRes = await axios.get(`${API}/admin/user/${userId}`);
      setUser(userRes.data);

      // Load messages (admin can see all)
      try {
        const msgRes = await axios.get(`${API}/admin/user/${userId}/messages`);
        setMessages(msgRes.data || []);
      } catch { setMessages([]); }

      // Load photos
      try {
        const photosRes = await axios.get(`${API}/admin/user/${userId}/photos`);
        setPhotos(photosRes.data || []);
      } catch { setPhotos([]); }

      // Load raffles
      try {
        const rafflesRes = await axios.get(`${API}/raffles?creator_id=${userId}`);
        setRaffles(rafflesRes.data || []);
      } catch { setRaffles([]); }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  const tabs = [
    { id: 'info', label: 'Información', icon: User },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, count: messages.length },
    { id: 'photos', label: 'Fotos', icon: Image, count: photos.length },
    { id: 'raffles', label: 'Rifas', icon: Ticket, count: raffles.length },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-sky-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{loading ? 'Cargando...' : user?.full_name}</h2>
                <p className="text-white/80">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user?.role === 'creator' ? 'bg-purple-200 text-purple-800' :
                    user?.role === 'super_admin' ? 'bg-red-200 text-red-800' :
                    'bg-sky-200 text-sky-800'
                  }`}>
                    {user?.role === 'creator' ? 'Creador' : user?.role === 'super_admin' ? 'Super Admin' : 'Usuario'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user?.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {user?.is_active ? 'Activo' : 'Suspendido'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {!loading && user && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border-b">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{user.total_raffles || 0}</p>
              <p className="text-xs text-slate-500">Rifas Creadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{user.tickets_purchased || 0}</p>
              <p className="text-xs text-slate-500">Tickets Comprados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{user.followers_count || 0}</p>
              <p className="text-xs text-slate-500">Seguidores</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-amber-500 mr-1" />
                <span className="text-2xl font-bold text-slate-900">{user.avg_rating || '-'}</span>
              </div>
              <p className="text-xs text-slate-500">Calificación ({user.ratings_received || 0})</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Info Tab */}
              {activeTab === 'info' && user && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Información Personal
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Nombre completo</span>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Email</span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Teléfono</span>
                          <span className="font-medium">{user.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">País</span>
                          <span className="font-medium">{user.country || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Registrado</span>
                          <span className="font-medium">{formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Estado de Cuenta
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Estado</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.is_active ? 'Activo' : 'Suspendido'}
                          </span>
                        </div>
                        {user.suspension_reason && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-500">Razón suspensión</span>
                            <span className="font-medium text-red-600">{user.suspension_reason}</span>
                          </div>
                        )}
                        {user.suspended_until && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-500">Suspendido hasta</span>
                            <span className="font-medium">{formatDate(user.suspended_until)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Mensajería</span>
                          <span className="font-medium">{user.messaging_enabled !== false ? 'Habilitada' : 'Deshabilitada'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-slate-500">Notificaciones</span>
                          <span className="font-medium">{user.notifications_enabled !== false ? 'Habilitadas' : 'Deshabilitadas'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-900">Biografía</h3>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">{user.bio}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <button 
                      onClick={() => onMessage && onMessage(user)}
                      className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Enviar Mensaje</span>
                    </button>
                    <button 
                      onClick={() => onSuspend && onSuspend(user)}
                      className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                    >
                      <Ban className="w-4 h-4" />
                      <span>{user.is_active ? 'Suspender' : 'Quitar Suspensión'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay mensajes</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="border rounded-lg overflow-hidden">
                        <div 
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                msg.from_user_id === userId ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {msg.from_user_id === userId ? 'Enviado' : 'Recibido'}
                              </span>
                              <span className="font-medium text-sm truncate">
                                {msg.from_user_id === userId ? `→ ${msg.to_user_name}` : `← ${msg.from_user_name}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(msg.created_at)}</p>
                          </div>
                          {expandedMessage === msg.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        {expandedMessage === msg.id && (
                          <div className="p-4 bg-white border-t">
                            {msg.subject && (
                              <p className="font-medium text-sm mb-2">Asunto: {msg.subject}</p>
                            )}
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div>
                  {photos.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay fotos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {photos.map((photo, idx) => (
                        <a 
                          key={idx} 
                          href={photo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100"
                        >
                          <img 
                            src={photo.url} 
                            alt={photo.raffle_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white truncate">{photo.raffle_title}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Raffles Tab */}
              {activeTab === 'raffles' && (
                <div className="space-y-3">
                  {raffles.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay rifas</p>
                    </div>
                  ) : (
                    raffles.map(raffle => (
                      <div key={raffle.id} className="border rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{raffle.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {raffle.tickets_sold}/{raffle.ticket_range} tickets • ${raffle.ticket_price} c/u
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            raffle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {raffle.status === 'active' ? 'Activa' : 'Completada'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-slate-500 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(raffle.raffle_date)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Creada: {formatDate(raffle.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
