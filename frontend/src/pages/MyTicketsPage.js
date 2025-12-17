import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { Ticket, ArrowLeft, Calendar, DollarSign, Trophy } from 'lucide-react';

const MyTicketsPage = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [raffles, setRaffles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const ticketsRes = await axios.get(`${API}/tickets/my-tickets`);
      setTickets(ticketsRes.data);

      // Load raffle details
      const raffleIds = [...new Set(ticketsRes.data.map(t => t.raffle_id))];
      const rafflePromises = raffleIds.map(id => axios.get(`${API}/raffles/${id}`));
      const raffleResponses = await Promise.all(rafflePromises);
      
      const rafflesMap = {};
      raffleResponses.forEach(res => {
        rafflesMap[res.data.id] = res.data;
      });
      setRaffles(rafflesMap);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedTickets = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.raffle_id]) {
      acc[ticket.raffle_id] = [];
    }
    acc[ticket.raffle_id].push(ticket);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              data-testid="back-btn"
              className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
            </button>
            <Link to="/explore" className="text-sky-600 font-semibold hover:text-sky-700">
              {t('nav.explore')}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">{t('tickets.myTickets')}</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500 mb-6">Aún no has comprado tickets</p>
            <Link
              to="/explore"
              data-testid="explore-link"
              className="inline-block px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
            >
              Explorar Rifas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTickets).map(([raffleId, raffleTickets]) => {
              const raffle = raffles[raffleId];
              if (!raffle) return null;

              const isWinner = raffle.status === 'completed' && 
                             raffle.winning_number && 
                             raffleTickets.some(t => t.ticket_number === raffle.winning_number);

              return (
                <div
                  key={raffleId}
                  data-testid={`raffle-group-${raffleId}`}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                    isWinner ? 'border-4 border-amber-500' : ''
                  }`}
                >
                  {isWinner && (
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 flex items-center justify-center space-x-2">
                      <Trophy className="w-6 h-6" />
                      <span className="font-bold text-lg">¡GANASTE ESTA RIFA!</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Raffle Image */}
                      <div className="flex-shrink-0">
                        {raffle.images && raffle.images.length > 0 ? (
                          <img
                            src={`${process.env.REACT_APP_BACKEND_URL}${raffle.images[0]}`}
                            alt={raffle.title}
                            className="w-full md:w-48 h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full md:w-48 h-48 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
                            <Ticket className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Raffle Info */}
                      <div className="flex-1">
                        <Link
                          to={`/raffle/${raffleId}`}
                          className="text-2xl font-bold text-slate-900 hover:text-sky-600 transition-colors"
                        >
                          {raffle.title}
                        </Link>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(raffle.raffle_date).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${raffle.ticket_price} por ticket</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Ticket className="w-4 h-4" />
                            <span>{raffleTickets.length} ticket(s) comprado(s)</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="mt-4">
                          {raffle.status === 'active' ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              Activa
                            </span>
                          ) : raffle.status === 'completed' ? (
                            <div className="space-y-2">
                              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                Finalizada
                              </span>
                              {raffle.winning_number && (
                                <p className="text-sm text-slate-600">
                                  Número ganador: <span className="font-bold text-sky-600">#{raffle.winning_number}</span>
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* Tickets */}
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Tus números:</p>
                          <div className="flex flex-wrap gap-2">
                            {raffleTickets.map((ticket) => (
                              <span
                                key={ticket.id}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
