import { useNavigate, useParams, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import LanguageSwitcher from "../layouts/LanguageSwitcher";
import { resetPassword, clearError } from "../../actions";
import { UPDATE_PASSWORD_RESET } from "../../constants/userConstants";
import { translateServerError } from "../../i18n";
import { AuthShowcase, Field, PasswordInput, PasswordStrength, Wordmark } from "./AuthFields";
import "./Auth.css";

const TOKEN_ERROR = "The Password token is invalid or has been expired.";

const NewPassword = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({}); // UPDATED: translated inline validation
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const { success, error, loading } = useSelector((state) => state.userPasswords);

  const alert = useAlert();
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    // UPDATED: same rules as the backend (>= 6 chars, both fields equal)
    const next = {
      password: !password
        ? "validation.passwordRequired"
        : password.length < 6
          ? "validation.passwordTooShort"
          : undefined,
      confirmPassword: confirmPassword !== password ? "validation.passwordMismatch" : undefined,
    };
    setErrors(next);
    if (next.password || next.confirmPassword) return;

    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    dispatch(resetPassword(params.token, formData));
  };

  useEffect(() => {
    if (error) {
      // UPDATED: an expired/invalid link gets a visible "request a new link" banner
      if (error === TOKEN_ERROR) setTokenInvalid(true);
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }

    if (success) {
      alert.success(t("reset.success"));
      dispatch({ type: UPDATE_PASSWORD_RESET });
      navigate("/login");
    }
  }, [dispatch, alert, error, success, navigate, t]);

  const rules = [
    ["reset.rules.length", password.length >= 6],
    ["reset.rules.match", Boolean(password) && password === confirmPassword],
  ];

  return (
    <Fragment>
      <MetaDAta title={t("reset.pageTitle")} />
      {/* UPDATED: Veyra layout from the Stitch "reset password" design */}
      <div className="auth-page">
        <div className="auth-card auth-card--login">
          <section className="auth-main">
            <div className="auth-head">
              <div className="auth-topbar">
                <Wordmark />
                <LanguageSwitcher />
              </div>
              <div>
                <span className="auth-eyebrow">
                  <i className="fa fa-lock" aria-hidden="true" /> {t("reset.eyebrow")}
                </span>
                <h1 className="auth-title auth-title--spaced">{t("reset.title")}</h1>
                <p className="auth-subtitle">{t("reset.subtitle")}</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={submitHandler} noValidate>
              {tokenInvalid && (
                <div className="auth-notice auth-notice--error" role="alert">
                  <i className="fa fa-exclamation-circle" aria-hidden="true" />
                  <div>
                    <p className="auth-notice-title">{t("errors.resetTokenInvalid")}</p>
                    <Link to="/password/forgot">{t("reset.requestNew")}</Link>
                  </div>
                </div>
              )}

              <Field id="password_field" label={t("reset.newPassword")} error={errors.password}>
                <PasswordInput
                  id="password_field"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password_field_error" : "password_strength"}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrength password={password} />
              </Field>

              <Field id="confirm_password_field" label={t("fields.confirmPassword")} error={errors.confirmPassword}>
                <PasswordInput
                  id="confirm_password_field"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirm_password_field_error" : undefined}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>

              <ul className="auth-rules">
                {rules.map(([key, ok]) => (
                  <li key={key} className={ok ? "is-ok" : ""}>
                    <i className={`fa ${ok ? "fa-check-circle" : "fa-circle-o"}`} aria-hidden="true" /> {t(key)}
                  </li>
                ))}
              </ul>

              <button id="new_password_button" type="submit" className="auth-submit" disabled={loading}>
                <span>{t(loading ? "reset.submitting" : "reset.submit")}</span>
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            </form>

            <div className="auth-foot">
              <p className="auth-switch">
                <Link to="/login" className="auth-back">
                  <i className="fa fa-arrow-left" aria-hidden="true" /> {t("reset.cancel")}
                </Link>
              </p>
              <p className="auth-trust">
                <i className="fa fa-shield" aria-hidden="true" />
                <span>{t("reset.secure")}</span>
              </p>
            </div>
          </section>

          <AuthShowcase
            image="/assets/reset-password-brand-image.webp"
            badge={t("reset.showcase.badge")}
            quote={t("reset.showcase.quote")}
            author={t("reset.showcase.author")}
            items={[
              { icon: "fa-link", title: t("reset.showcase.item1Title"), text: t("reset.showcase.item1Text") },
              { icon: "fa-lock", title: t("reset.showcase.item2Title"), text: t("reset.showcase.item2Text") },
            ]}
          />
        </div>
      </div>
    </Fragment>
  );
};

export default NewPassword;
