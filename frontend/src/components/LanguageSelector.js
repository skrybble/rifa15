import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' }
];

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2 flex items-center">
          <Globe className="w-3 h-3 mr-1" />
          Idioma / Language
        </p>
        <div className="flex space-x-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title="Cambiar idioma"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                i18n.language === lang.code ? 'text-sky-600 bg-sky-50' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4 text-sky-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
