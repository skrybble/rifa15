import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ticket, Trophy, Users, Zap } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const LandingPage = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Ticket className="w-8 h-8 text-sky-600" />
              <span className="text-2xl font-bold text-slate-900">RafflyWin</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              {user ? (
                <Link
                  to="/explore"
                  data-testid="explore-link"
                  className="px-6 py-2.5 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700 transition-all"
                >
                  {t('nav.explore')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-testid="login-link"
                    className="px-6 py-2.5 text-sky-700 font-semibold hover:text-sky-900 transition-colors"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    to="/register"
                    data-testid="register-link"
                    className="px-6 py-2.5 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700 transition-all"
                  >
                    {t('auth.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
            {t('landing.heroTitle1')}
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              {t('landing.heroTitle2')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/register"
              data-testid="hero-register-btn"
              className="px-8 py-4 bg-sky-600 text-white text-lg rounded-full font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('landing.startNow')}
            </Link>
            <Link
              to="/explore"
              className="px-8 py-4 bg-white text-sky-700 text-lg rounded-full font-semibold hover:bg-slate-50 transition-all border-2 border-sky-200"
            >
              {t('landing.viewRaffles')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Ticket className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.digitalRaffles')}</h3>
            <p className="text-slate-600">
              {t('landing.digitalRafflesDesc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.amazingPrizes')}</h3>
            <p className="text-slate-600">
              {t('landing.amazingPrizesDesc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.community')}</h3>
            <p className="text-slate-600">
              {t('landing.communityDesc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.dailyDraw')}</h3>
            <p className="text-slate-600">
              {t('landing.dailyDrawDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-16">
            {t('landing.howItWorks')}
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.step1Title')}</h3>
              <p className="text-slate-600">
                {t('landing.step1Desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.step2Title')}</h3>
              <p className="text-slate-600">
                {t('landing.step2Desc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landing.step3Title')}</h3>
              <p className="text-slate-600">
                {t('landing.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-8 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-sky-700 text-lg rounded-full font-semibold hover:bg-slate-100 transition-all shadow-lg"
          >
            {t('landing.createAccount')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Ticket className="w-6 h-6 text-sky-400" />
              <span className="text-xl font-bold">RafflyWin</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
              <Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} RafflyWin. {t('footer.rights')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
