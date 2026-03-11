import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import nl from './locales/nl.json';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import pl from './locales/pl.json';
import it from './locales/it.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      nl: { translation: nl },
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt },
      pl: { translation: pl },
      it: { translation: it },
      es: { translation: es },
    },
    fallbackLng: 'nl',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

export const languages = [
  { code: 'nl', label: 'Nederlands', countryCode: 'nl' },
  { code: 'en', label: 'English', countryCode: 'gb' },
  { code: 'de', label: 'Deutsch', countryCode: 'de' },
  { code: 'fr', label: 'Français', countryCode: 'fr' },
  { code: 'pt', label: 'Português', countryCode: 'pt' },
  { code: 'pl', label: 'Polski', countryCode: 'pl' },
  { code: 'it', label: 'Italiano', countryCode: 'it' },
  { code: 'es', label: 'Español', countryCode: 'es' },
];
