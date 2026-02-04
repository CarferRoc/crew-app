import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";

const resources = {
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de }, // German map
    it: { translation: it },
    pt: { translation: pt },
};

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem("user-language");

    if (!savedLanguage) {
        // Get device language
        const deviceLanguage = getLocales()[0]?.languageCode;
        savedLanguage = deviceLanguage || 'es';
    }

    // Fallback to Spanish if language not supported
    if (!resources[savedLanguage as keyof typeof resources]) {
        savedLanguage = 'es';
    }

    i18next
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            fallbackLng: "es",
            interpolation: {
                escapeValue: false,
            },
            compatibilityJSON: 'v3', // For Android compatibility with newer i18next versions
        });
};

initI18n();

export default i18next;
