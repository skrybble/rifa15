import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Ticket, Heart, Star, ArrowLeft, Calendar, DollarSign, Mail, 
  Grid3X3, BookOpen, Settings, BadgeCheck, MapPin, Link as LinkIcon,
  MoreHorizontal, Clock
} from 'lucide-react';
import FeedCard from '../components/FeedCard';

const CreatorProfilePage = ({ user }) => {
  const { t } = useTranslation();
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [raffles, setRaffles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [canRate, setCanRate] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    loadCreatorData();
  }, [creatorId]);

  const loadCreatorData = async () => {
    setLoading(true);
    try {
      const [creatorRes, rafflesRes, postsRes, storiesRes] = await Promise.all([
        axios.get(`${API}/creators/${creatorId}/profile`),
        axios.get(`${API}/raffles?creator_id=${creatorId}`),
        axios.get(`${API}/creators/${creatorId}/posts?page=1&per_page=10`),
        axios.get(`${API}/creators/${creatorId}/stories`)
      ]);
      
      setCreator(creatorRes.data);
      setRaffles(rafflesRes.data.filter(r => r.status === 'active'));
      setPosts(postsRes.data.posts || []);
      setHasMorePosts(postsRes.data.has_more);
      setStories(storiesRes.data || []);
      
      if (user) {
        setIsFollowing(creatorRes.data.followers?.includes(user.id));
        
        // Check if user can rate
        try {
          const ticketsRes = await axios.get(`${API}/tickets/my-tickets`);
          const hasPurchased = ticketsRes.data.some(t => t.creator_id === creatorId);
          setCanRate(hasPurchased);
        } catch { setCanRate(false); }
      }
    } catch (error) {
      console.error('Error loading creator:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMorePosts) return;
    setLoadingMore(true);
    
    try {
      const res = await axios.get(`${API}/creators/${creatorId}/posts?page=${postsPage + 1}&per_page=10`);
      setPosts(prev => [...prev, ...(res.data.posts || [])]);
      setHasMorePosts(res.data.has_more);
      setPostsPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const lastPostCallback = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePosts) {
        loadMorePosts();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMorePosts]);

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFollowing) {
        await axios.post(`${API}/users/${creatorId}/unfollow`);
        setIsFollowing(false);
        setCreator(prev => ({ ...prev, followers: prev.followers?.filter(f => f !== user.id) }));
      } else {
        await axios.post(`${API}/users/${creatorId}/follow`);
        setIsFollowing(true);
        setCreator(prev => ({ ...prev, followers: [...(prev.followers || []), user.id] }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleRating = async () => {
    try {
      await axios.post(`${API}/ratings`, {
        creator_id: creatorId,
        rating,
        comment
      });
      alert(t('creator.ratingSent'));
      setShowRatingModal(false);
      loadCreatorData();
    } catch (error) {
      alert(error.response?.data?.detail || t('creator.ratingError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">{t('creator.notFound')}</p>
      </div>
    );
  }

  const formatTimeRemaining = (dateStr) => {
    const end = new Date(dateStr);
    const now = new Date();
    const diff = end - now;
    if (diff < 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">{creator.full_name}</span>
          <button className="p-2 -mr-2 hover:bg-slate-100 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="bg-white">
          {/* Cover Image */}
          {creator.cover_image && (
            <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500">
              <img 
                src={creator.cover_image.startsWith('/') ? `${API.replace('/api', '')}${creator.cover_image}` : creator.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="px-4 pb-4">
            {/* Profile Picture & Stats */}
            <div className="flex items-end -mt-12 mb-4">
              <div className="relative">
                {stories.length > 0 ? (
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500">
                    {creator.profile_image ? (
                      <img 
                        src={creator.profile_image.startsWith('/') ? `${API.replace('/api', '')}${creator.profile_image}` : creator.profile_image}
                        alt={creator.full_name}
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
                        {creator.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                    {creator.profile_image ? (
                      <img 
                        src={creator.profile_image.startsWith('/') ? `${API.replace('/api', '')}${creator.profile_image}` : creator.profile_image}
                        alt={creator.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                        {creator.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                {creator.is_featured && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex justify-around ml-4 text-center">
                <div>
                  <p className="text-xl font-bold">{posts.length}</p>
                  <p className="text-xs text-slate-500">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{creator.followers?.length || 0}</p>
                  <p className="text-xs text-slate-500">{t('profile.followers')}</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{creator.following?.length || 0}</p>
                  <p className="text-xs text-slate-500">{t('profile.following')}</p>
                </div>
              </div>
            </div>

            {/* Name & Bio */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold">{creator.full_name}</h1>
                {creator.is_featured && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              </div>
              {creator.description && (
                <p className="text-sm text-slate-600 mt-1">{creator.description}</p>
              )}
              <div className="flex items-center space-x-1 mt-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{creator.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-slate-500 text-sm">({creator.rating_count || 0} {t('creator.ratings')})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleFollow}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm ${
                  isFollowing 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isFollowing ? t('profile.following') : t('profile.follow')}
              </button>
              <button 
                onClick={() => navigate(`/messages/new/${creatorId}`)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200"
              >
                {t('messages.newMessage')}
              </button>
              {canRate && (
                <button 
                  onClick={() => setShowRatingModal(true)}
                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold text-sm hover:bg-amber-200"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Raffles - Pinned Section */}
        {raffles.length > 0 && (
          <div className="bg-white mt-2 p-4">
            <h2 className="font-bold text-sm text-slate-900 mb-3 flex items-center">
              <Ticket className="w-4 h-4 mr-2 text-purple-600" />
              {t('creator.activeRaffles')} ({raffles.length})
            </h2>
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
              {raffles.map(raffle => (
                <Link 
                  key={raffle.id}
                  to={`/raffle/${raffle.id}`}
                  className="flex-shrink-0 w-40 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden border border-purple-100 hover:shadow-md transition-shadow"
                >
                  {raffle.images && raffle.images[0] && (
                    <img 
                      src={raffle.images[0].startsWith('/') ? `${API.replace('/api', '')}${raffle.images[0]}` : raffle.images[0]}
                      alt={raffle.title}
                      className="w-full h-24 object-cover"
                    />
                  )}
                  <div className="p-2">
                    <p className="font-semibold text-xs text-slate-900 truncate">{raffle.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-purple-600 font-bold text-sm">${raffle.ticket_price}</span>
                      <span className="text-xs text-orange-600 flex items-center">
                        <Clock className="w-3 h-3 mr-0.5" />
                        {formatTimeRemaining(raffle.raffle_date)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(raffle.tickets_sold / raffle.ticket_range) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{raffle.tickets_sold}/{raffle.ticket_range}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white mt-2 border-b border-slate-200 sticky top-14 z-30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-1 ${
                activeTab === 'posts' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('raffles')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-1 ${
                activeTab === 'raffles' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500'
              }`}
            >
              <Ticket className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-20">
          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No hay publicaciones</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      ref={index === posts.length - 1 ? lastPostCallback : null}
                    >
                      <FeedCard 
                        item={{ ...post, type: 'post', creator }} 
                        user={user} 
                      />
                    </div>
                  ))}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'raffles' && (
            <div className="grid grid-cols-3 gap-0.5 bg-white">
              {raffles.map(raffle => (
                <Link 
                  key={raffle.id}
                  to={`/raffle/${raffle.id}`}
                  className="aspect-square relative group"
                >
                  {raffle.images && raffle.images[0] ? (
                    <img 
                      src={raffle.images[0].startsWith('/') ? `${API.replace('/api', '')}${raffle.images[0]}` : raffle.images[0]}
                      alt={raffle.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Ticket className="w-8 h-8 text-purple-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white font-bold text-sm">${raffle.ticket_price}</span>
                  </div>
                </Link>
              ))}
              {raffles.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">{t('creator.noActiveRaffles')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('creator.rateCreator')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('creator.yourRating')}
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-colors ${
                      star <= rating ? 'text-amber-500' : 'text-slate-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('creator.addComment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRating}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
              >
                {t('creator.sendRating')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfilePage;
