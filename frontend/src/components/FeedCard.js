import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { 
  Heart, MessageCircle, Share2, Ticket, Clock, Star, 
  MoreHorizontal, Bookmark, BadgeCheck, Calendar
} from 'lucide-react';

const FeedCard = ({ item, user, onLikeUpdate }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const isRaffle = item.type === 'raffle';
  const creator = item.creator || {};
  
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const targetType = isRaffle ? 'raffle' : 'post';
      const res = await axios.post(`${API}/like/${targetType}/${item.id}`);
      setLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
      if (onLikeUpdate) onLikeUpdate(item.id, res.data.liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const targetType = isRaffle ? 'raffle' : 'post';
      const res = await axios.get(`${API}/comments/${targetType}/${item.id}?page=1&per_page=5`);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    try {
      const targetType = isRaffle ? 'raffle' : 'post';
      const res = await axios.post(`${API}/comments/${targetType}/${item.id}`, {
        content: newComment
      });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleShare = async () => {
    const url = isRaffle ? `${window.location.origin}/raffle/${item.id}` : `${window.location.origin}/post/${item.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRaffle ? item.title : `Post de ${creator.full_name}`,
          text: isRaffle ? item.description : item.content,
          url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const getTimeRemaining = () => {
    if (!item.raffle_date) return null;
    const end = new Date(item.raffle_date);
    const now = new Date();
    const diff = end - now;
    
    if (diff < 0) return 'Finalizado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/creator/${creator.id}`} className="flex items-center space-x-3">
          <div className="relative">
            {creator.profile_image ? (
              <img 
                src={creator.profile_image.startsWith('/') ? `${API.replace('/api', '')}${creator.profile_image}` : creator.profile_image}
                alt={creator.full_name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500 ring-offset-2"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {creator.full_name?.charAt(0) || '?'}
              </div>
            )}
            {item.is_featured_creator && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-slate-900 text-sm">{creator.full_name}</span>
              {item.is_featured_creator && (
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <span className="text-xs text-slate-500">{formatTimeAgo(item.created_at)}</span>
          </div>
        </Link>
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      {isRaffle ? (
        // Raffle Card
        <div>
          {/* Image */}
          {item.images && item.images.length > 0 && (
            <Link to={`/raffle/${item.id}`}>
              <img 
                src={item.images[0].startsWith('/') ? `${API.replace('/api', '')}${item.images[0]}` : item.images[0]}
                alt={item.title}
                className="w-full aspect-square object-cover"
              />
            </Link>
          )}
          
          {/* Raffle Info Overlay */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-900">{item.title}</span>
              </div>
              <span className="text-lg font-bold text-purple-600">${item.ticket_price}</span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-slate-600">
                  <Ticket className="w-4 h-4 mr-1" />
                  {item.tickets_sold}/{item.ticket_range} {t('feed.ticketsSold')}
                </span>
                <span className="flex items-center text-orange-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {getTimeRemaining()}
                </span>
              </div>
              {user ? (
                <Link 
                  to={`/raffle/${item.id}`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  {t('feed.buyTickets')}
                </Link>
              ) : (
                <Link 
                  to="/login"
                  className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full text-sm font-semibold hover:bg-slate-300 transition-colors"
                >
                  {t('feed.loginToBuy')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Post Card
        <div>
          {/* Post Text */}
          {item.content && (
            <p className="px-4 pb-3 text-slate-800">{item.content}</p>
          )}
          
          {/* Post Images */}
          {item.images && item.images.length > 0 && (
            <div className={`grid ${item.images.length > 1 ? 'grid-cols-2 gap-0.5' : ''}`}>
              {item.images.slice(0, 4).map((img, idx) => (
                <img 
                  key={idx}
                  src={img.startsWith('/') ? `${API.replace('/api', '')}${img}` : img}
                  alt=""
                  className={`w-full object-cover ${item.images.length === 1 ? 'aspect-square' : 'aspect-square'}`}
                />
              ))}
            </div>
          )}
          
          {/* Story indicator */}
          {item.is_story && (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium">
              {t('feed.story24h')}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100">
        {/* Likes count */}
        {likesCount > 0 && (
          <p className="text-sm text-slate-600 mb-2">
            <span className="font-semibold">{likesCount}</span> {t('feed.likes')}
          </p>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${liked ? 'text-red-500' : 'text-slate-600 hover:text-red-500'}`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={toggleComments}
              className="flex items-center space-x-1 text-slate-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center space-x-1 text-slate-600 hover:text-green-500 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <button className="text-slate-600 hover:text-slate-900">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {/* Comment input */}
          {user ? (
            <form onSubmit={handleComment} className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.full_name?.charAt(0)}
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('feed.writeComment')}
                className="flex-1 px-3 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="text-purple-600 font-semibold text-sm disabled:opacity-50"
              >
                {t('common.send')}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500 mb-3">{t('feed.loginToInteract')}</p>
          )}
          
          {/* Comments list */}
          {loadingComments ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {comment.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl px-3 py-2">
                      <span className="font-semibold text-sm">{comment.user?.full_name}</span>
                      <p className="text-sm text-slate-700">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                      <span>{formatTimeAgo(comment.created_at)}</span>
                      <button className="font-semibold hover:text-slate-700">{t('feed.like')}</button>
                      <button className="font-semibold hover:text-slate-700">{t('feed.reply')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedCard;
