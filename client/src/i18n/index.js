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
  // UPDATED: password change, orders and admin product errors
  "Old password is incorrect": "errors.oldPasswordWrong",
  "You cannot access this order": "errors.orderForbidden",
  "No Order Found With This Id": "errors.orderNotFound",
  "Please provide product images": "errors.productImages",
  "product not exist": "errors.productNotExist",
  // UPDATED: admin order/user rules
  "You cannot delete your own account": "errors.deleteSelf",
  "You cannot remove your own admin role": "errors.demoteSelf",
  "Remove the admin role before deleting this user": "errors.deleteAdmin",
  "Invalid order status transition": "errors.orderTransition",
  "Order is not paid": "errors.orderNotPaid",
  "User not found": "errors.userNotFound",
  "Order not found": "errors.orderNotFound",
  "No Order Found!": "errors.orderNotFound",
  // UPDATED: account cart / saved address
  "Requested quantity is not available": "errors.stockUnavailable",
  "Your cart is full": "errors.cartFull",
  "Product not found": "errors.productNotFound",
  "Invalid cart item": "errors.invalidCartItem",
};
export const translateServerError = (t, message) =>
  SERVER_ERRORS[message] ? t(SERVER_ERRORS[message]) : message;

// UPDATED: USD prices formatted for the active language (e.g. $1,299.00 / 1.299,00 USD)
export const formatPrice = (value) =>
  new Intl.NumberFormat(i18n.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

// UPDATED: orders and addresses store the English country name (history must not change). This shows it in the
// active language by mapping the name back to its ISO code with Intl; unknown names are shown as stored.
let countryCodes;
export const countryLabel = (name) => {
  if (!name) return name;
  try {
    if (!countryCodes) {
      countryCodes = new Map();
      const en = new Intl.DisplayNames(["en"], { type: "region" });
      for (const a of "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
          const label = en.of(a + b);
          if (label && label !== a + b) countryCodes.set(label.toLowerCase(), a + b);
        }
    }
    const code = countryCodes.get(String(name).toLowerCase());
    return code ? new Intl.DisplayNames([i18n.language], { type: "region" }).of(code) : name;
  } catch {
    return name;
  }
};

export default i18n;
