import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Ticket, Heart, Star, ArrowLeft, Calendar, DollarSign } from 'lucide-react';

const CreatorProfilePage = ({ user, onLogout }) => {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [canRate, setCanRate] = useState(false);

  useEffect(() => {
    loadCreatorData();
  }, [creatorId]);

  const loadCreatorData = async () => {
    try {
      const [creatorRes, rafflesRes] = await Promise.all([
        axios.get(`${API}/users/${creatorId}`),
        axios.get(`${API}/raffles?creator_id=${creatorId}`)
      ]);
      setCreator(creatorRes.data);
      setRaffles(rafflesRes.data.filter(r => r.status === 'active'));
      setIsFollowing(creatorRes.data.followers?.includes(user.id));
      
      // Check if user can rate (has purchased tickets from this creator)
      const ticketsRes = await axios.get(`${API}/tickets/my-tickets`);
      const hasPurchased = ticketsRes.data.some(t => t.creator_id === creatorId);
      setCanRate(hasPurchased);
    } catch (error) {
      console.error('Error loading creator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post(`${API}/users/${creatorId}/unfollow`);
        setIsFollowing(false);
      } else {
        await axios.post(`${API}/users/${creatorId}/follow`);
        setIsFollowing(true);
      }
      loadCreatorData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleRating = async () => {
    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      
      await axios.post(`${API}/users/${creatorId}/rate`, formData);
      alert('¡Valoración enviada exitosamente!');
      setShowRatingModal(false);
      loadCreatorData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al enviar valoración');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Creador no encontrado</p>
      </div>
    );
  }

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

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-sky-400 to-blue-600"></div>

          <div className="px-8 pb-8">
            {/* Profile Info */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex items-end space-x-4">
                <div className="w-32 h-32 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {creator.full_name.charAt(0)}
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">{creator.full_name}</h1>
                  <div className="flex items-center space-x-4 text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-semibold">{creator.followers?.length || 0}</span>
                      <span>seguidores</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold">{creator.rating.toFixed(1)}</span>
                      <span className="text-sm">({creator.rating_count} valoraciones)</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleFollow}
                data-testid="follow-btn"
                className={`mt-4 md:mt-0 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
              >
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
              {canRate && user.id !== creatorId && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  data-testid="rate-btn"
                  className="mt-4 md:mt-0 md:ml-2 px-6 py-3 rounded-lg font-semibold transition-all bg-amber-500 text-white hover:bg-amber-600"
                >
                  Valorar
                </button>
              )}
            </div>

            {creator.description && (
              <p className="text-slate-600 mb-6">{creator.description}</p>
            )}

            {creator.interests && creator.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {creator.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Raffles */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Rifas Activas</h2>
          {raffles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-500">Este creador no tiene rifas activas</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map((raffle) => (
                <Link
                  key={raffle.id}
                  to={`/raffle/${raffle.id}`}
                  data-testid={`raffle-card-${raffle.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {raffle.images && raffle.images.length > 0 ? (
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}`}
                      alt={raffle.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                      <Ticket className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{raffle.title}</h3>
                    <p className="text-slate-600 mb-4 line-clamp-2">{raffle.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sky-700 font-semibold">
                        <DollarSign className="w-5 h-5" />
                        <span>${raffle.ticket_price}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-sm">
                        <Ticket className="w-4 h-4" />
                        <span>{raffle.tickets_sold}/{raffle.ticket_range}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500 text-sm mt-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfilePage;