import { Link } from 'react-router-dom';
import { Ticket, Trophy, Users, Zap } from 'lucide-react';

const LandingPage = ({ user }) => {
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
              {user ? (
                <Link
                  to="/explore"
                  data-testid="explore-link"
                  className="px-6 py-2.5 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700 transition-all"
                >
                  Explorar
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-testid="login-link"
                    className="px-6 py-2.5 text-sky-700 font-semibold hover:text-sky-900 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    data-testid="register-link"
                    className="px-6 py-2.5 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700 transition-all"
                  >
                    Registrarse
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
            La plataforma de rifas
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              para creadores de contenido
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Conecta con tus creadores favoritos, participa en rifas emocionantes y gana premios increíbles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/register"
              data-testid="hero-register-btn"
              className="px-8 py-4 bg-sky-600 text-white text-lg rounded-full font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Comenzar Ahora
            </Link>
            <Link
              to="/explore"
              className="px-8 py-4 bg-white text-sky-700 text-lg rounded-full font-semibold hover:bg-slate-50 transition-all border-2 border-sky-200"
            >
              Ver Rifas
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">Rifas Digitales</h3>
            <p className="text-slate-600">
              Participa en rifas de tus creadores favoritos con un solo clic
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Premios Increíbles</h3>
            <p className="text-slate-600">
              Gana productos, experiencias y mucho más de tus creadores preferidos
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Comunidad</h3>
            <p className="text-slate-600">
              Sigue a tus creadores favoritos y mantente al día con sus nuevas rifas
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sorteo Diario</h3>
            <p className="text-slate-600">
              Los ganadores se anuncian automáticamente cada día a las 6 PM
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-16">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Regístrate</h3>
              <p className="text-slate-600">
                Crea tu cuenta gratis y selecciona tus intereses
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Compra Tickets</h3>
              <p className="text-slate-600">
                Elige la rifa que te guste y compra tus tickets
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Gana</h3>
              <p className="text-slate-600">
                Recibe notificaciones y descubre si ganaste el premio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para ganar?
          </h2>
          <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya están participando en rifas emocionantes
          </p>
          <Link
            to="/register"
            data-testid="cta-register-btn"
            className="inline-block px-8 py-4 bg-white text-sky-700 text-lg rounded-full font-semibold hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Ticket className="w-6 h-6" />
            <span className="text-xl font-bold">RafflyWin</span>
          </div>
          <p className="text-slate-400">
            &copy; 2025 RafflyWin. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;