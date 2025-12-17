import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

const InstallPWA = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (24 hours)
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone === true;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS install prompt after a delay
      setTimeout(() => setShowIOSPrompt(true), 3000);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstallPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (isInstalled) return null;

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">R</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Instalar RafflyWin</h3>
                <p className="text-sm text-slate-500">rafflywin.com</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <p className="text-slate-600 mb-6">
            Instala nuestra app para una mejor experiencia. Acceso rápido desde tu pantalla de inicio, sin necesidad de abrir el navegador.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Instalar App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Install Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
        <div className="bg-white rounded-t-2xl max-w-md w-full p-6 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">R</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Instalar RafflyWin</h3>
                <p className="text-sm text-slate-500">rafflywin.com</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <p className="text-slate-600 mb-6">
            Instala nuestra app para una mejor experiencia. Sigue estos pasos:
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-700">Toca el botón</span>
                <div className="p-1.5 bg-white rounded-lg border">
                  <Share className="w-5 h-5 text-sky-600" />
                </div>
                <span className="text-slate-700">de compartir</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-700">Selecciona</span>
                <div className="p-1.5 bg-white rounded-lg border flex items-center space-x-1">
                  <Plus className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">Añadir a inicio</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="w-full py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl border"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallPWA;
