import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Mail, Send, Archive, Trash2, ArrowLeft, X, User as UserIcon, Search, ArchiveRestore, CheckSquare } from 'lucide-react';

const MessagesPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`);
      const messages = response.data;
      
      // Group messages by conversation
      const conversationsMap = {};
      
      messages.forEach(msg => {
        const otherId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
        const otherName = msg.from_user_id === user.id ? msg.to_user_name : msg.from_user_name;
        
        if (!conversationsMap[otherId]) {
          conversationsMap[otherId] = {
            userId: otherId,
            userName: otherName,
            lastMessage: msg,
            unreadCount: 0,
            messages: []
          };
        }
        
        conversationsMap[otherId].messages.push(msg);
        
        // Count unread messages
        if (msg.to_user_id === user.id && !msg.read) {
          conversationsMap[otherId].unreadCount++;
        }
        
        // Update last message
        if (new Date(msg.created_at) > new Date(conversationsMap[otherId].lastMessage.created_at)) {
          conversationsMap[otherId].lastMessage = msg;
        }
      });
      
      const convArray = Object.values(conversationsMap).sort((a, b) => 
        new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      );
      
      setConversations(convArray);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (userId) => {
    try {
      const response = await axios.get(`${API}/messages/conversation/${userId}`);
      setConversationMessages(response.data.messages);
      setSelectedConversation({
        userId: userId,
        userName: response.data.other_user.full_name,
        userEmail: response.data.other_user.email
      });
      
      // Mark messages as read
      const unreadMessages = response.data.messages.filter(m => 
        m.to_user_id === user.id && !m.read
      );
      
      for (const msg of unreadMessages) {
        await axios.post(`${API}/messages/${msg.id}/read`);
      }
      
      loadMessages(); // Refresh conversations
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    
    try {
      await axios.post(`${API}/messages`, {
        to_user_id: selectedConversation.userId,
        subject: 'Re: Conversación',
        content: replyText
      });
      
      setReplyText('');
      loadConversation(selectedConversation.userId);
      loadMessages();
    } catch (error) {
      alert('Error al enviar mensaje');
    }
  };

  const handleArchive = async (messageId) => {
    try {
      await axios.post(`${API}/messages/${messageId}/archive`);
      loadMessages();
      if (selectedConversation) {
        loadConversation(selectedConversation.userId);
      }
    } catch (error) {
      alert('Error al archivar mensaje');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer.')) return;
    
    try {
      await axios.delete(`${API}/messages/${messageId}`);
      loadMessages();
      if (selectedConversation) {
        loadConversation(selectedConversation.userId);
      }
    } catch (error) {
      alert('Error al eliminar mensaje');
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
              <span>Volver</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900">Mensajes</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Conversaciones</h2>
              <p className="text-sm text-slate-600">{conversations.length} conversaciones</p>
            </div>
            
            <div className="overflow-y-auto max-h-[600px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No tienes conversaciones</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => loadConversation(conv.userId)}
                    className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${
                      selectedConversation?.userId === conv.userId ? 'bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {conv.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-900 truncate">{conv.userName}</p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {conv.lastMessage.content.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(conv.lastMessage.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg flex flex-col" style={{ height: '600px' }}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedConversation.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{selectedConversation.userName}</p>
                      <p className="text-sm text-slate-600">{selectedConversation.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from_user_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.from_user_id === user.id
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {msg.subject && msg.subject !== 'Re: Conversación' && (
                          <p className="font-bold mb-2">{msg.subject}</p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                          <span>{new Date(msg.created_at).toLocaleString('es-ES')}</span>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="ml-2 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      rows={3}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg text-slate-500">Selecciona una conversación</p>
                  <p className="text-sm text-slate-400">para ver los mensajes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
