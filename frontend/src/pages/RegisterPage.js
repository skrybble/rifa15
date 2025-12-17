import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API } from '../App';
import { Ticket, Mail, Lock, User, AlertCircle, Tag } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const RegisterPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const INTEREST_KEYS = [
    'technology', 'sports', 'gaming', 'music', 'art',
    'fashion', 'travel', 'food', 'fitness', 'beauty',
    'education', 'entertainment', 'lifestyle', 'photography'
  ];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    interests: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    if (!acceptedTerms) {
      setError(t('auth.termsRequired'));
      return;
    }

    if (formData.interests.length < 3) {
      setError(t('auth.minInterests'));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      onLogin(response.data.token, response.data.user);
      navigate('/explore');
    } catch (err) {
      setError(err.response?.data?.detail || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 py-12 px-4 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Ticket className="w-10 h-10 text-sky-600" />
            <span className="text-3xl font-bold text-slate-900">RafflyWin</span>
          </div>

          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-center text-slate-600 mb-8">{t('auth.registerSubtitle')}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.fullName')}
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
                {t('auth.email')}
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
                {t('auth.password')}
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
                {t('auth.accountType')}
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
                  {t('auth.user')}
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
                  {t('auth.creator')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                {t('auth.selectInterests')} ({t('common.min')} 3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTEREST_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleInterest(key)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.interests.includes(key)
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t(`interests.${key}`)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.selected')}: {formData.interests.length}
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                data-testid="accept-terms-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                {t('auth.termsAccept')}{' '}
                <Link 
                  to="/terms" 
                  target="_blank"
                  className="text-sky-600 font-semibold hover:text-sky-700 underline"
                >
                  {t('auth.termsAndConditions')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              data-testid="register-submit-btn"
              disabled={loading || !acceptedTerms}
              className="w-full py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('auth.createAccount')}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-sky-600 font-semibold hover:text-sky-700">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
