// locales/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translations
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';

const LANGUAGE_STORAGE_KEY = '@smart_agriculture_language';

// Language detector plugin
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Try to get saved language
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      // Fall back to device language
      const locales = Localization.getLocales();
      const deviceLanguage = locales && locales.length > 0 ? (locales[0].languageCode || 'en') : 'en';
      callback(['en', 'hi', 'kn'].includes(deviceLanguage) ? deviceLanguage : 'en');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
    },
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Required for React Native - no full Intl.PluralRules support
    interpolation: {
      escapeValue: false, // React already handles this
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;
