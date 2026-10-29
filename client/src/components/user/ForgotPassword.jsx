import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import LanguageSwitcher from "../layouts/LanguageSwitcher";
import { forgotPassword, clearError } from "../../actions";
import { UPDATE_PASSWORD_RESET } from "../../constants/userConstants";
import { translateServerError } from "../../i18n";
import { AuthShowcase, Field, Wordmark, emailError } from "./AuthFields";
import "./Auth.css";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState(); // UPDATED: translated inline validation
  const [sentTo, setSentTo] = useState(""); // UPDATED: email shown in the success banner

  const { message, loading, error } = useSelector(
    (state) => state.userPasswords
  );

  const alert = useAlert();
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    const invalid = emailError(email);
    setFieldError(invalid);
    if (invalid) return;

    const formData = new FormData();
    formData.set("email", email);

    dispatch(forgotPassword(formData));
  };

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
    if (message) {
      // UPDATED: the server message is English-only; show our own translated banner instead
      setSentTo(email);
      dispatch({ type: UPDATE_PASSWORD_RESET });
    }
  }, [dispatch, alert, error, message, email, t]);

  return (
    <Fragment>
      <MetaDAta title={t("forgot.pageTitle")} />
      {/* UPDATED: Veyra layout from the Stitch "forgot password" design */}
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
                  <i className="fa fa-key" aria-hidden="true" /> {t("forgot.eyebrow")}
                </span>
                <h1 className="auth-title auth-title--spaced">{t("forgot.title")}</h1>
                <p className="auth-subtitle">{t("forgot.subtitle")}</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={submitHandler} noValidate>
              <Field id="email_field" label={t("fields.email")} error={fieldError}>
                <div className="auth-input-wrap has-icon">
                  <i className="fa fa-envelope-o auth-input-icon" aria-hidden="true" />
                  <input
                    type="email"
                    id="email_field"
                    className="auth-input"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? "email_field_error" : "email_hint"}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p id="email_hint" className="auth-hint">
                  <i className="fa fa-clock-o" aria-hidden="true" /> {t("forgot.hint")}
                </p>
              </Field>

              <button
                id="forgot_password_button"
                type="submit"
                className="auth-submit"
                disabled={loading ? true : false}
              >
                <span>{t(loading ? "forgot.submitting" : "forgot.submit")}</span>
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>

              {sentTo && (
                <div className="auth-notice" role="status">
                  <i className="fa fa-envelope-open-o" aria-hidden="true" />
                  <div>
                    <p className="auth-notice-title">{t("forgot.sentTitle")}</p>
                    <p>{t("forgot.sentText", { email: sentTo })}</p>
                  </div>
                </div>
              )}
            </form>

            <div className="auth-foot auth-foot--left">
              <Link to="/login" className="auth-back">
                <i className="fa fa-arrow-left" aria-hidden="true" /> {t("forgot.back")}
              </Link>
              <p className="auth-hint">{t("forgot.noEmail")}</p>
              <p className="auth-trust auth-trust--left">
                <i className="fa fa-shield" aria-hidden="true" />
                <span>{t("forgot.secure")}</span>
              </p>
            </div>
          </section>

          <AuthShowcase
            image="/assets/forgot-password-brand-image.webp"
            badge={t("forgot.showcase.badge")}
            quote={t("forgot.showcase.quote")}
            author={t("forgot.showcase.author")}
            items={[
              { icon: "fa-clock-o", title: t("forgot.showcase.item1Title"), value: t("forgot.showcase.item1Value"), text: t("forgot.showcase.item1Text") },
              { icon: "fa-link", title: t("forgot.showcase.item2Title"), value: t("forgot.showcase.item2Value"), text: t("forgot.showcase.item2Text") },
            ]}
          />
        </div>
      </div>
    </Fragment>
  );
};

export default ForgotPassword;
