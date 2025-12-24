import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    
    // Clear service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
    
    // Clear localStorage token in case it's corrupted
    // localStorage.removeItem('token');
    
    // Hard refresh
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Algo salió mal
            </h1>
            
            <p className="text-slate-600 mb-6">
              Hubo un problema al cargar la página. Esto puede ocurrir por una versión en caché desactualizada.
            </p>
            
            <button
              onClick={this.handleRefresh}
              className="w-full py-3 px-4 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Recargar y Limpiar Caché</span>
            </button>
            
            <p className="text-xs text-slate-500 mt-4">
              Si el problema persiste, intenta borrar los datos del navegador manualmente.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
