// UPDATED: lightweight i18n setup (EN/IT). Add new page strings to locales/*.json.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import it from "./locales/it.json";

export const LANGUAGES = ["en", "it"];
const STORAGE_KEY = "veyra.language";

const readSaved = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const saved = readSaved();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, it: { translation: it } },
  lng: LANGUAGES.includes(saved) ? saved : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // storage blocked (private mode): language still switches for this session
  }
});

// UPDATED: backend sends English messages; translate the known auth/recovery ones, pass others through.
const SERVER_ERRORS = {
  "Please enter email and password": "errors.missingCredentials",
  "Invalid email and Password": "errors.invalidCredentials",
  "An account or resource with these details already exists": "errors.emailTaken",
  // UPDATED: password recovery messages
  "user not found with this email": "errors.userNotFound",
  "The Password token is invalid or has been expired.": "errors.resetTokenInvalid",
  "The Password doesnot match.": "errors.passwordMismatch",
  "Unable to send recovery email. Please try again": "errors.recoveryEmailFailed",
};
export const translateServerError = (t, message) =>
  SERVER_ERRORS[message] ? t(SERVER_ERRORS[message]) : message;

// UPDATED: USD prices formatted for the active language (e.g. $1,299.00 / 1.299,00 USD)
export const formatPrice = (value) =>
  new Intl.NumberFormat(i18n.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

export default i18n;
