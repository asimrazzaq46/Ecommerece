// UPDATED: shared form pieces for the Login and Register pages.
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns a translation key, or undefined when the email is valid.
export const emailError = (email) =>
  !email.trim()
    ? "validation.emailRequired"
    : EMAIL_RE.test(email.trim())
      ? undefined
      : "validation.emailInvalid";

// Inputs inside should set aria-describedby={`${id}_error`} when error is set.
export function Field({ id, label, aside, error, children }) {
  const { t } = useTranslation();
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}_error`} className="auth-error" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({ withIcon, ...inputProps }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className={`auth-input-wrap${withIcon ? " has-icon" : ""}`}>
      {withIcon && <i className="fa fa-lock auth-input-icon" aria-hidden="true" />}
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className="auth-input has-toggle"
      />
      <button
        type="button"
        className="auth-toggle"
        aria-label={t(visible ? "fields.hidePassword" : "fields.showPassword")}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        <i className={`fa ${visible ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}

// UPDATED: simple length-based strength meter (moved from Register; also used by Reset Password)
const strengthOf = (password) =>
  !password ? [0, "empty"] : password.length < 6 ? [1, "weak"] : password.length < 10 ? [2, "fair"] : [3, "strong"];

export function PasswordStrength({ password, id = "password_strength" }) {
  const { t } = useTranslation();
  const [bars, key] = strengthOf(password);
  return (
    <div className="auth-strength" data-level={bars}>
      <div className="auth-strength-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p id={id} className="auth-strength-label">
        {t(`register.strength.${key}`)}
      </p>
    </div>
  );
}

// UPDATED: dark photo panel with quote + two info tiles (Forgot/Reset password designs)
export function AuthShowcase({ image, badge, quote, author, items }) {
  return (
    <aside className="auth-showcase auth-showcase--help">
      <img className="auth-showcase-img" src={image} alt="" />
      <div className="auth-showcase-scrim" />
      <div className="auth-showcase-top">
        <span className="auth-glass-badge auth-glass-badge--gold">
          <span className="auth-pill-dot" /> {badge}
        </span>
        <i className="fa fa-shield" aria-hidden="true" />
      </div>
      <div className="auth-showcase-body">
        <span className="auth-rule" aria-hidden="true" />
        <blockquote className="auth-quote auth-quote--light">“{quote}”</blockquote>
        <p className="auth-person-role">{author}</p>
      </div>
      <div className="auth-stats">
        {items.map((item) => (
          <div key={item.title} className="auth-stat">
            <div className="auth-stat-label auth-stat-label--gold">
              <i className={`fa ${item.icon}`} aria-hidden="true" /> {item.title}
            </div>
            {item.value && <div className="auth-stat-value">{item.value}</div>}
            <div className="auth-stat-note">{item.text}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function Wordmark({ light }) {
  const { t } = useTranslation();
  return (
    // UPDATED: links home, since auth pages no longer render the site header
    <Link to="/" className={`auth-wordmark${light ? " is-light" : ""}`}>
      <span className="auth-wordmark-name">Veyra</span>
      <span className="auth-wordmark-tag">{t("brand.tagline")}</span>
    </Link>
  );
}
