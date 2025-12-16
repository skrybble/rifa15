import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Ticket, Mail, Lock, User, AlertCircle, Tag, FileText, CheckCircle } from 'lucide-react';

const INTEREST_OPTIONS = [
  'Tecnología', 'Deportes', 'Gaming', 'Música', 'Arte',
  'Moda', 'Viajes', 'Gastronomía', 'Fitness', 'Belleza',
  'Educación', 'Entretenimiento', 'Lifestyle', 'Fotografía'
];

const RegisterPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    interests: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.interests.length < 3) {
      setError('Debes seleccionar al menos 3 intereses');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      onLogin(response.data.token, response.data.user);
      navigate('/explore');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Ticket className="w-10 h-10 text-sky-600" />
            <span className="text-3xl font-bold text-slate-900">RafflyWin</span>
          </div>

          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Crea tu cuenta</h1>
          <p className="text-center text-slate-600 mb-8">Únete a la comunidad de rifas</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  data-testid="register-name-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  data-testid="register-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  data-testid="register-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  data-testid="role-user-btn"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                    formData.role === 'user'
                      ? 'border-sky-600 bg-sky-50 text-sky-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  Usuario
                </button>
                <button
                  type="button"
                  data-testid="role-creator-btn"
                  onClick={() => setFormData({ ...formData, role: 'creator' })}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                    formData.role === 'creator'
                      ? 'border-sky-600 bg-sky-50 text-sky-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  Creador
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Intereses (mínimo 3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Seleccionados: {formData.interests.length}
              </p>
            </div>

            <button
              type="submit"
              data-testid="register-submit-btn"
              disabled={loading}
              className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-sky-600 font-semibold hover:text-sky-700">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;