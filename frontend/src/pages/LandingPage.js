import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { Ticket, Search, Plus, Bell, User, BadgeCheck, Image, X, LogOut, Settings, Gift, Link as LinkIcon } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import FeedCard from '../components/FeedCard';

const LandingPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [isStory, setIsStory] = useState(false);
  const [posting, setPosting] = useState(false);
  const [myActiveRaffles, setMyActiveRaffles] = useState([]);
  const [linkedRaffles, setLinkedRaffles] = useState([]);
  const observerRef = useRef();
  const lastItemRef = useRef();

  useEffect(() => {
    loadFeed();
    loadFeaturedCreators();
    if (user && (user.role === 'creator' || user.role === 'admin' || user.role === 'super_admin')) {
      loadMyActiveRaffles();
    }
  }, [user]);

  const loadMyActiveRaffles = async () => {
    try {
      const res = await axios.get(`${API}/raffles?creator_id=${user.id}&status=active`);
      setMyActiveRaffles(Array.isArray(res.data) ? res.data : res.data.raffles || []);
    } catch (error) {
      console.error('Error loading my raffles:', error);
    }
  };

  const loadFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const res = await axios.get(`${API}/feed?page=${pageNum}&per_page=10`);
      if (append) {
        setFeed(prev => [...prev, ...res.data.items]);
      } else {
        setFeed(res.data.items);
      }
      setHasMore(res.data.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFeaturedCreators = async () => {
    try {
      const res = await axios.get(`${API}/creators/featured`);
      setFeaturedCreators(res.data);
    } catch (error) {
      console.error('Error loading featured creators:', error);
    }
  };

  // Infinite scroll
  const lastItemCallback = useCallback(node => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadFeed(page + 1, true);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, page]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewPostImages(prev => [...prev, ...newImages].slice(0, 4));
  };

  const removeImage = (index) => {
    setNewPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostImages.length === 0 && linkedRaffles.length === 0) return;
    
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', newPostContent);
      formData.append('is_story', isStory);
      formData.append('linked_raffles', JSON.stringify(linkedRaffles.map(r => r.id)));
      newPostImages.forEach(img => {
        formData.append('images', img.file);
      });
      
      const res = await axios.post(`${API}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Add to feed with linked raffles data
      const newPost = { ...res.data, type: 'post', creator: user, linked_raffles: linkedRaffles };
      setFeed(prev => [newPost, ...prev]);
      
      // Reset
      setNewPostContent('');
      setNewPostImages([]);
      setLinkedRaffles([]);
      setIsStory(false);
      setShowPostModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear publicación');
    } finally {
      setPosting(false);
    }
  };

  const toggleLinkedRaffle = (raffle) => {
    setLinkedRaffles(prev => {
      const exists = prev.find(r => r.id === raffle.id);
      if (exists) {
        return prev.filter(r => r.id !== raffle.id);
      }
      if (prev.length >= 3) {
        alert('Máximo 3 rifas por publicación');
        return prev;
      }
      return [...prev, raffle];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Ticket className="w-7 h-7 text-sky-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                RafflyWin
              </span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              {user ? (
                <>
                  <Link to="/explore" className="p-2 hover:bg-slate-100 rounded-full">
                    <Search className="w-5 h-5 text-slate-600" />
                  </Link>
                  <Link to="/notifications" className="p-2 hover:bg-slate-100 rounded-full relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </Link>
                  {/* Quick access for creators - Desktop */}
                  {(user.role === 'creator' || user.role === 'admin' || user.role === 'super_admin') && (
                    <Link 
                      to="/my-raffles"
                      className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-medium hover:bg-sky-200 transition-colors"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Mis Rifas</span>
                    </Link>
                  )}
                  
                  {/* User Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold"
                    >
                      {user.full_name?.charAt(0)}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="font-semibold text-slate-900 text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full capitalize">{user.role}</span>
                        </div>
                        
                        {/* Creator/Admin quick links */}
                        {(user.role === 'creator' || user.role === 'admin' || user.role === 'super_admin') && (
                          <div className="py-2 border-b border-slate-100">
                            <Link 
                              to="/my-raffles" 
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-sky-50 text-sky-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Gift className="w-4 h-4" />
                              <span className="text-sm font-medium">Mis Rifas</span>
                            </Link>
                            <Link 
                              to="/dashboard" 
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm">Mi Perfil</span>
                            </Link>
                          </div>
                        )}
                        
                        {/* Regular user links */}
                        {user.role === 'user' && (
                          <Link 
                            to="/my-tickets" 
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Ticket className="w-4 h-4" />
                            <span className="text-sm">Mis Tickets</span>
                          </Link>
                        )}
                        
                        <Link 
                          to="/messages" 
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Bell className="w-4 h-4" />
                          <span className="text-sm">Mensajes</span>
                        </Link>
                        <Link 
                          to="/profile-settings" 
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Configuración</span>
                        </Link>
                        <div className="border-t border-slate-100 mt-2 pt-2">
                          <button 
                            onClick={() => { onLogout(); setShowUserMenu(false); }}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Cerrar sesión</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="px-4 py-2 bg-sky-600 text-white rounded-full text-sm font-semibold hover:bg-sky-700"
                >
                  {t('auth.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 bg-gradient-to-b from-slate-200 to-slate-300">
        <div className="max-w-lg mx-auto px-4">
          
          {/* Featured Creators - Stories Style */}
          {featuredCreators.length > 0 && (
            <div className="py-3 border-b border-slate-200 mb-4 -mx-4 px-4 bg-white">
              <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-hide">
                {/* Add Story Button (for creators) */}
                {user && user.role === 'creator' && (
                  <button 
                    onClick={() => { setIsStory(true); setShowPostModal(true); }}
                    className="flex-shrink-0 flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                      <Plus className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-[10px] text-slate-600 mt-1">{t('feed.newStory')}</span>
                  </button>
                )}
                
                {featuredCreators.map(creator => (
                  <Link 
                    key={creator.id}
                    to={`/creator/${creator.id}`}
                    className="flex-shrink-0 flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 via-blue-500 to-cyan-400">
                      {creator.profile_image ? (
                        <img 
                          src={creator.profile_image.startsWith('/') ? `${API.replace('/api', '')}${creator.profile_image}` : creator.profile_image}
                          alt={creator.full_name}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                          {creator.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-700 mt-1 truncate w-14 text-center">
                      {creator.full_name.split(' ')[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Create Post (for creators) */}
          {user && user.role === 'creator' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {user.full_name?.charAt(0)}
                </div>
                <button 
                  onClick={() => { setIsStory(false); setShowPostModal(true); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-left text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  {t('feed.whatsOnYourMind')}
                </button>
                <button 
                  onClick={() => { setIsStory(false); setShowPostModal(true); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-green-600"
                >
                  <Image className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{t('feed.noContent')}</p>
              <Link 
                to="/explore"
                className="mt-4 inline-block px-6 py-2 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700"
              >
                {t('nav.explore')}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((item, index) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  ref={index === feed.length - 1 ? lastItemCallback : null}
                >
                  <FeedCard item={item} user={user} />
                </div>
              ))}
              
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-3xl max-h-[85vh] overflow-hidden mb-16 sm:mb-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button onClick={() => setShowPostModal(false)} className="text-slate-500">
                <X className="w-6 h-6" />
              </button>
              <h2 className="font-bold text-lg">
                {isStory ? t('feed.newStory') : t('feed.newPost')}
              </h2>
              <button 
                onClick={handleCreatePost}
                disabled={posting || (!newPostContent.trim() && newPostImages.length === 0 && linkedRaffles.length === 0)}
                className="px-4 py-1.5 bg-sky-600 text-white rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {posting ? '...' : t('feed.post')}
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="flex space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user?.full_name?.charAt(0)}
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={t('feed.whatsOnYourMind')}
                  className="flex-1 resize-none border-none outline-none text-lg"
                  rows={4}
                  autoFocus
                />
              </div>
              
              {/* Selected Images */}
              {newPostImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {newPostImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img 
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Link Raffles Section */}
              {myActiveRaffles.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <LinkIcon className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-semibold text-slate-700">Vincular rifas activas</span>
                    <span className="text-xs text-slate-500">(máx. 3)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {myActiveRaffles.map(raffle => {
                      const isLinked = linkedRaffles.find(r => r.id === raffle.id);
                      return (
                        <button
                          key={raffle.id}
                          onClick={() => toggleLinkedRaffle(raffle)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                            isLinked 
                              ? 'bg-sky-100 border-sky-500 text-sky-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300'
                          }`}
                        >
                          <Gift className="w-4 h-4" />
                          <span className="text-sm font-medium truncate max-w-[120px]">{raffle.title}</span>
                          {isLinked && <X className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Preview of linked raffles */}
                  {linkedRaffles.length > 0 && (
                    <div className="mt-3 p-3 bg-sky-50 rounded-lg">
                      <p className="text-xs text-sky-600 font-medium mb-2">Rifas que se mostrarán:</p>
                      <div className="space-y-2">
                        {linkedRaffles.map(raffle => (
                          <div key={raffle.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{raffle.title}</span>
                            <span className="text-sky-600 font-bold">${raffle.ticket_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer text-green-600 hover:bg-green-50 p-2 rounded-full">
                  <Image className="w-6 h-6" />
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Story toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isStory}
                  onChange={(e) => setIsStory(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span className="text-sm text-slate-600">{t('feed.story24h')}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
