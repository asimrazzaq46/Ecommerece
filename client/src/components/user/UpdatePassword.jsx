import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import { updatePassword, clearError } from "../../actions";
import { UPDATE_PASSWORD_RESET } from "../../constants/userConstants";
import { translateServerError } from "../../i18n";
import { Field, PasswordInput, PasswordStrength } from "./AuthFields";
import AccountNav from "./AccountNav";
import "./Auth.css"; // field + strength meter styles
import "./Account.css";

// UPDATED: Veyra "Change password" (Stitch change password design). Same API: oldPassword + password.
const UpdatePassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const { isUpdated, loading, error } = useSelector(
    (state) => state.userPasswords
  );

  const alert = useAlert();
  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    // UPDATED: same rules as the backend (>= 6 chars) plus a confirmation field
    const next = {
      oldPassword: oldPassword ? undefined : "password.validation.currentRequired",
      password: !password
        ? "validation.passwordRequired"
        : password.length < 6
          ? "validation.passwordTooShort"
          : password === oldPassword
            ? "password.validation.sameAsOld"
            : undefined,
      confirmPassword: confirmPassword !== password ? "validation.passwordMismatch" : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const formData = new FormData();
    formData.set("oldPassword", oldPassword);
    formData.set("password", password);

    dispatch(updatePassword(formData));
  };

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
    if (isUpdated) {
      alert.success(t("password.success"));

      navigate("/me");

      dispatch({
        type: UPDATE_PASSWORD_RESET,
      });
    }
  }, [dispatch, alert, error, isUpdated, navigate, t]);

  const rules = [
    ["password.rules.length", password.length >= 6],
    ["password.rules.mixed", /[a-z]/.test(password) && /[A-Z]/.test(password)],
    ["password.rules.number", /\d/.test(password)],
    ["password.rules.match", Boolean(password) && password === confirmPassword],
  ];

  return (
    <Fragment>
      <MetaDAta title={t("password.pageTitle")} />
      <div className="vx-page vx-account">
        <div className="vx-container">
          <div className="vx-account-head">
            <nav className="vx-breadcrumb" aria-label="Breadcrumb">
              <Link to="/me">{t("account.nav.title")}</Link>
              <span aria-hidden="true">/</span>
              <Link to="/me">{t("account.nav.profile")}</Link>
              <span aria-hidden="true">/</span>
              <span>{t("password.crumb")}</span>
            </nav>
            <h1 className="vx-title-xl">{t("password.title")}</h1>
            <p className="vx-muted">{t("password.subtitle")}</p>
          </div>

          <div className="vx-account-grid">
            <AccountNav />

            <div className="vx-account-main vx-password-main">
              <form className="vx-card vx-account-section vx-password-form" onSubmit={submitHandler} noValidate>
                <Field
                  id="old_password_field"
                  label={t("password.current")}
                  error={errors.oldPassword}
                  aside={
                    <Link to="/password/forgot" className="auth-forgot">
                      {t("password.forgot")}
                    </Link>
                  }
                >
                  <PasswordInput
                    id="old_password_field"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={oldPassword}
                    aria-invalid={Boolean(errors.oldPassword)}
                    aria-describedby={errors.oldPassword ? "old_password_field_error" : undefined}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </Field>

                <hr />

                <Field id="new_password_field" label={t("password.new")} error={errors.password}>
                  <PasswordInput
                    id="new_password_field"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "new_password_field_error" : "password_strength"}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <PasswordStrength password={password} />
                </Field>

                <Field id="confirm_password_field" label={t("password.confirm")} error={errors.confirmPassword}>
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

                <ul className="auth-rules vx-password-rules" aria-label={t("password.rulesTitle")}>
                  {rules.map(([key, ok]) => (
                    <li key={key} className={ok ? "is-ok" : ""}>
                      <i className={`fa ${ok ? "fa-check-circle" : "fa-circle-o"}`} aria-hidden="true" /> {t(key)}
                    </li>
                  ))}
                </ul>

                <div className="vx-password-actions">
                  <Link to="/me" className="vx-btn vx-btn--soft">{t("password.cancel")}</Link>
                  <button type="submit" className="vx-btn vx-btn--primary" disabled={loading ? true : false}>
                    <i className="fa fa-key" aria-hidden="true" /> {t(loading ? "password.submitting" : "password.submit")}
                  </button>
                </div>
              </form>

              <section className="vx-card vx-account-section vx-password-tips">
                <span className="vx-eyebrow">{t("password.tipsEyebrow")}</span>
                <h2 className="vx-title-sm">{t("password.tipsTitle")}</h2>
                <ul>
                  {["tip1", "tip2", "tip3"].map((key) => (
                    <li key={key}>
                      <i className="fa fa-shield" aria-hidden="true" /> {t(`password.${key}`)}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default UpdatePassword;
