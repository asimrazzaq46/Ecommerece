import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import LanguageSwitcher from "../layouts/LanguageSwitcher";
import { register, clearError } from "../../actions";
import { translateServerError } from "../../i18n";
import { Field, PasswordInput, PasswordStrength, Wordmark, emailError } from "./AuthFields";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // here come all the states for the REGISTER

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({}); // UPDATED: translated inline validation

  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarName, setAvatarName] = useState("");

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.registerUser,
  );

  const { name, email, password, confirmPassword } = user;
  const alert = useAlert();
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    // UPDATED: client-side checks mirror the backend rules (name <= 30, password >= 6)
    const next = {
      name: !name.trim()
        ? "validation.nameRequired"
        : name.length > 30
          ? "validation.nameTooLong"
          : undefined,
      email: emailError(email),
      password: !password
        ? "validation.passwordRequired"
        : password.length < 6
          ? "validation.passwordTooShort"
          : undefined,
      confirmPassword:
        password && confirmPassword !== password ? "validation.passwordMismatch" : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("avatar", avatar);
    dispatch(register(formData));
  };

  const onChange = (e) => {
    if (e.target.name === "avatar") {
      const file = e.target.files?.[0];
      if (!file) return;
      if (
        !/^image\/(png|jpeg|gif|webp)$/.test(file.type) ||
        file.size > 5 * 1024 * 1024
      ) {
        alert.error(t("validation.avatarInvalid"));
        e.target.value = "";
        return;
      }
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setAvatarPreview(reader.result);
          setAvatar(reader.result);
          setAvatarName(file.name);
        }
      };

      reader.readAsDataURL(file);
    } else {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }

    if (error) {
      alert.error(translateServerError(t, error)); // UPDATED: translated server error
      dispatch(clearError());
    }
  }, [dispatch, alert, error, isAuthenticated, navigate, t]);

  const describedBy = (field) => (errors[field] ? `${field}_field_error` : undefined);

  return (
    <Fragment>
      <MetaDAta title={t("register.pageTitle")} />
      {/* UPDATED: Veyra two-column layout from the Stitch "registration" design */}
      <div className="auth-page">
        <div className="auth-card auth-card--register">
          <aside className="auth-showcase auth-showcase--register">
            <img className="auth-showcase-img" src="/assets/register-brand-image.webp" alt="" />
            <div className="auth-showcase-intro">
              <Wordmark light />
              <div className="auth-showcase-headline">
                <span className="auth-pill">
                  <span className="auth-pill-dot" />
                  {t("register.showcase.pill")}
                </span>
                <h2 className="auth-showcase-title">{t("register.showcase.headline")}</h2>
              </div>
            </div>
            <div className="auth-showcase-quote-box">
              <blockquote>“{t("register.showcase.quote")}”</blockquote>
              <div className="auth-person">
                <span className="auth-person-initials is-gold">V</span>
                <div>
                  <div className="auth-person-name">{t("register.showcase.author")}</div>
                  <div className="auth-person-role is-muted">{t("register.showcase.authorRole")}</div>
                </div>
              </div>
            </div>
          </aside>

          <section className="auth-main auth-main--register">
            <div className="auth-head auth-head--register">
              <div className="auth-topbar">
                <span className="auth-eyebrow">
                  <i className="fa fa-user-plus" aria-hidden="true" />
                  {t("register.eyebrow")}
                </span>
                <LanguageSwitcher />
              </div>
              <h1 className="auth-title">{t("register.title")}</h1>
              <p className="auth-subtitle">{t("register.subtitle")}</p>
            </div>

            <form
              className="auth-form auth-form--register"
              onSubmit={submitHandler}
              encType="multipart/form-data"
              noValidate
            >
              <div className="auth-row">
                <Field id="name_field" label={t("fields.name")} error={errors.name}>
                  <input
                    type="text"
                    maxLength={30}
                    id="name_field"
                    className="auth-input auth-input--raised"
                    name="name"
                    autoComplete="name"
                    placeholder={t("register.namePlaceholder")}
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={describedBy("name")}
                    onChange={onChange}
                  />
                </Field>
                <Field id="email_field" label={t("fields.email")} error={errors.email}>
                  <input
                    type="email"
                    id="email_field"
                    className="auth-input auth-input--raised"
                    name="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={describedBy("email")}
                    onChange={onChange}
                  />
                </Field>
              </div>

              <div className="auth-row">
                <Field id="password_field" label={t("fields.password")} error={errors.password}>
                  <PasswordInput
                    id="password_field"
                    name="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={describedBy("password") || "password_strength"}
                    onChange={onChange}
                  />
                  <PasswordStrength password={password} />
                </Field>
                <Field
                  id="confirmPassword_field"
                  label={t("fields.confirmPassword")}
                  error={errors.confirmPassword}
                >
                  <PasswordInput
                    id="confirmPassword_field"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={describedBy("confirmPassword")}
                    onChange={onChange}
                  />
                </Field>
              </div>

              <div className="auth-field">
                <span className="auth-label">
                  {t("fields.avatar")} <span className="auth-optional">{t("fields.optional")}</span>
                </span>
                {/* UPDATED: the whole dropzone is the file input's label (keyboard + click) */}
                <label className="auth-dropzone" htmlFor="customFile">
                  <span className="auth-dropzone-main">
                    <span className="auth-dropzone-avatar">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" />
                      ) : (
                        <i className="fa fa-user" aria-hidden="true" />
                      )}
                    </span>
                    <span>
                      <span className={`auth-dropzone-title${avatarName ? " is-set" : ""}`}>
                        {avatarName || t("register.avatarPrompt")}
                      </span>
                      <span className="auth-dropzone-hint">{t("register.avatarHint")}</span>
                    </span>
                  </span>
                  <i className="fa fa-upload auth-dropzone-icon" aria-hidden="true" />
                </label>
                <input
                  type="file"
                  name="avatar"
                  className="auth-file-input"
                  id="customFile"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={onChange}
                />
              </div>

              <button
                id="register_button"
                type="submit"
                className="auth-submit"
                disabled={loading ? true : false}
              >
                <span>{t(loading ? "register.submitting" : "register.submit")}</span>
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            </form>

            <p className="auth-switch auth-switch--register">
              {t("register.haveAccount")} <Link to="/login">{t("register.signIn")}</Link>
            </p>

            <p className="auth-vault">
              <i className="fa fa-lock" aria-hidden="true" />
              <span>{t("register.secure")}</span>
            </p>
          </section>
        </div>
      </div>
    </Fragment>
  );
};

export default Register;
