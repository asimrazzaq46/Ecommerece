// UPDATED: EN/IT switcher; the choice is persisted by src/i18n.
import React from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../i18n";

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div className="lang-switch" role="group" aria-label={t("language.label")}>
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={i18n.resolvedLanguage === lng}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
