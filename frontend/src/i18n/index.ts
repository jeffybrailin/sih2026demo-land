import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en.en },
    hi: { translation: hi.en },
    as: { translation: as.en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
