import { useNavigate, useLocation } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import LanguageSwitcher from "../layouts/LanguageSwitcher";
import { login, clearError } from "../../actions";
import { translateServerError } from "../../i18n";
import Loader from "../layouts/Loader";
import { Field, PasswordInput, Wordmark, emailError } from "./AuthFields";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // here come all the states for the LOGIN

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({}); // UPDATED: translated inline validation

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth,
  );

  const requested = new URLSearchParams(location.search).get("redirect") || "/";
  const redirect =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : `/${requested.replace(/^\/+/, "")}`;

  const alert = useAlert();

  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    // UPDATED: validate on the client before calling the API
    const next = {
      email: emailError(email),
      password: password ? undefined : "validation.passwordRequired",
    };
    setErrors(next);
    if (next.email || next.password) return;
    dispatch(login(email, password));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }

    if (error) {
      alert.error(translateServerError(t, error)); // UPDATED: translated server error
      dispatch(clearError());
    }
  }, [dispatch, alert, error, isAuthenticated, navigate, redirect, t]);

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaDAta title={t("login.pageTitle")} />
          {/* UPDATED: Veyra two-column layout from the Stitch "sign in" design */}
          <div className="auth-page">
            <div className="auth-card auth-card--login">
              <section className="auth-main">
                <div className="auth-head">
                  <div className="auth-topbar">
                    <Wordmark />
                    <LanguageSwitcher />
                  </div>
                  <div>
                    <h1 className="auth-title">{t("login.title")}</h1>
                    <p className="auth-subtitle">{t("login.subtitle")}</p>
                  </div>
                </div>

                <form className="auth-form" onSubmit={submitHandler} noValidate>
                  <Field
                    id="email_field"
                    label={t("fields.email")}
                    error={errors.email}
                  >
                    <div className="auth-input-wrap has-icon">
                      <i
                        className="fa fa-at auth-input-icon"
                        aria-hidden="true"
                      />
                      <input
                        type="email"
                        id="email_field"
                        className="auth-input"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? "email_field_error" : undefined
                        }
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </Field>

                  <Field
                    id="password_field"
                    label={t("fields.password")}
                    error={errors.password}
                    aside={
                      <Link to="/password/forgot" className="auth-forgot">
                        {t("login.forgotPassword")}
                      </Link>
                    }
                  >
                    <PasswordInput
                      withIcon
                      id="password_field"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? "password_field_error" : undefined
                      }
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <button
                    id="login_button"
                    type="submit"
                    className="auth-submit auth-submit--caps"
                  >
                    <span>{t("login.submit")}</span>
                    <i className="fa fa-arrow-right" aria-hidden="true" />
                  </button>
                </form>

                <div className="auth-foot">
                  <p className="auth-switch">
                    {t("login.noAccount")}{" "}
                    <Link to="/register">{t("login.createAccount")}</Link>
                  </p>
                  <p className="auth-trust">
                    <i className="fa fa-shield" aria-hidden="true" />
                    <span>{t("login.secure")}</span>
                  </p>
                </div>
              </section>

              <aside className="auth-showcase auth-showcase--login">
                <img
                  className="auth-showcase-img"
                  src="/assets/login-brand-image.webp"
                  alt=""
                />
                <div className="auth-showcase-scrim" />
                <div className="auth-showcase-top">
                  <span className="auth-glass-badge">
                    {t("login.showcase.badge")}
                  </span>
                  <i className="fa fa-star-o" aria-hidden="true" />
                </div>
                <div className="auth-showcase-body">
                  <span className="auth-pill">
                    <span className="auth-pill-dot" />
                    {t("login.showcase.pill")}
                  </span>
                  <blockquote className="auth-quote">
                    “{t("login.showcase.quote")}”
                  </blockquote>
                  <div className="auth-person">
                    <span className="auth-person-initials">V</span>
                    <div>
                      <div className="auth-person-name">
                        {t("login.showcase.author")}
                      </div>
                      <div className="auth-person-role">
                        {t("login.showcase.authorRole")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="auth-stats">
                  <div className="auth-stat">
                    <div className="auth-stat-label">
                      {t("login.showcase.stat1Label")}
                    </div>
                    <div className="auth-stat-value">
                      {t("login.showcase.stat1Value")}
                    </div>
                  </div>
                  <div className="auth-stat">
                    <div className="auth-stat-label">
                      {t("login.showcase.stat2Label")}
                    </div>
                    <div className="auth-stat-value">
                      {t("login.showcase.stat2Value")}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default Login;
