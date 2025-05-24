import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import csTranslation from './locales/cs/translation.json';

// Define resources type for better TypeScript support
interface Resources {
  [language: string]: {
    translation: typeof csTranslation;
  };
}

// The translations
const resources: Resources = {
  cs: {
    translation: csTranslation
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: 'cs', // Default language
    fallbackLng: 'cs',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;
