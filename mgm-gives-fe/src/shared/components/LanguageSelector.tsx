import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({ compact = false, className = '' }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (newLang: 'en' | 'vi') => {
    if (newLang !== currentLang) {
      i18n.changeLanguage(newLang);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 bg-slate-100 rounded-lg p-1 ${className}`}>
        <button
          type="button"
          onClick={() => handleLanguageChange('en')}
          className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
            currentLang === 'en'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Switch to English"
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange('vi')}
          className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
            currentLang === 'vi'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Switch to Vietnamese"
        >
          VI
        </button>
      </div>
    );
  }

  return (
    <div className={`px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>{t('language.selectLanguage')}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/60">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              currentLang === 'en'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('vi')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              currentLang === 'vi'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Switch to Vietnamese"
          >
            VI
          </button>
        </div>
      </div>
    </div>
  );
}
