import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { ArrowLeft, Ticket, Calendar, DollarSign, Users, Mail, X } from 'lucide-react';

const RaffleManagementPage = ({ user }) => {
  const { raffleId } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadRaffleData();
  }, [raffleId]);

  const loadRaffleData = async () => {
    try {
      const [raffleRes, participantsRes] = await Promise.all([
        axios.get(`${API}/raffles/${raffleId}`),
        axios.get(`${API}/raffles/${raffleId}/participants`)
      ]);
      setRaffle(raffleRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
      console.error('Error loading raffle data:', error);
      alert('Error al cargar los datos de la rifa');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedParticipant || !messageSubject || !messageContent) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await axios.post(`${API}/messages`, {
        to_user_id: selectedParticipant.user_id,
        subject: messageSubject,
        content: messageContent
      });
      alert('Mensaje enviado exitosamente');
      setShowMessageModal(false);
      setSelectedParticipant(null);
      setMessageSubject('');
      setMessageContent('');
    } catch (error) {
      alert('Error al enviar mensaje');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Rifa no encontrada</p>
      </div>
    );
  }

  const totalRevenue = participants.reduce((sum, p) => sum + p.total_amount, 0);
  const commission = totalRevenue * 0.01;
  const netRevenue = totalRevenue - commission;

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Raffle Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{raffle.title}</h1>
              <p className="text-slate-600">{raffle.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              raffle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {raffle.status === 'active' ? 'Activa' : 'Finalizada'}
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-4 bg-sky-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sky-700 mb-2">
                <Ticket className="w-5 h-5" />
                <span className="font-semibold">Tickets</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{raffle.tickets_sold} / {raffle.ticket_range}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Precio por Ticket</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${raffle.ticket_price}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 text-purple-700 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Participantes</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{participants.length}</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center space-x-2 text-amber-700 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Fecha Sorteo</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {new Date(raffle.raffle_date).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Revenue Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Comisión (1%)</p>
                <p className="text-2xl font-bold text-amber-600">-${commission.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Ganancias Netas</p>
                <p className="text-2xl font-bold text-green-600">${netRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Participantes ({participants.length})
          </h2>

          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-500">Aún no hay participantes en esta rifa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant) => (
                <div
                  key={participant.user_id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {participant.user_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{participant.user_name}</p>
                          <p className="text-sm text-slate-600">{participant.user_email}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-slate-500">Tickets Comprados</p>
                          <p className="font-bold text-slate-900">{participant.tickets_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Monto Total</p>
                          <p className="font-bold text-green-600">${participant.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Primera Compra</p>
                          <p className="font-bold text-slate-900">
                            {new Date(participant.first_purchase).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>

                      {/* Tickets Numbers */}
                      <div className="mt-4">
                        <p className="text-sm text-slate-500 mb-2">Números de Tickets:</p>
                        <div className="flex flex-wrap gap-2">
                          {participant.tickets.map((ticket) => (
                            <span
                              key={ticket.ticket_id}
                              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                raffle.winning_number === ticket.ticket_number
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-300'
                                  : 'bg-sky-100 text-sky-700'
                              }`}
                            >
                              #{ticket.ticket_number}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedParticipant(participant);
                        setShowMessageModal(true);
                      }}
                      className="p-2 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Enviar mensaje"
                    >
                      <Mail className="w-6 h-6 text-sky-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Enviar Mensaje</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600">
                Para: <span className="font-bold">{selectedParticipant?.user_name}</span>
              </p>
              <p className="text-xs text-slate-500">{selectedParticipant?.user_email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Asunto</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mensaje</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                onClick={handleSendMessage}
                className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
              >
                Enviar Mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaffleManagementPage;
