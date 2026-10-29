import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import { updateProfile, loadUser, clearError } from "../../actions";
import { UPDATE_PROFILE_RESET } from "../../constants/userConstants";
import { translateServerError } from "../../i18n";
import { Field, emailError } from "./AuthFields";
import AccountNav from "./AccountNav";
import "./Auth.css"; // Field label/error styles
import "./Account.css";

const DEFAULT_AVATAR = "/images/default_avatar.jpg";

// UPDATED: Veyra "Edit profile" (Stitch edit profile design). Same API: name, email and optional avatar.
const UpdateProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isUpdated, loading, error } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);

  // Initialised once from the signed-in user (the route is protected, so the user is loaded).
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || DEFAULT_AVATAR);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [errors, setErrors] = useState({});

  const alert = useAlert();
  const dispatch = useDispatch();
  const hasCustomAvatar = Boolean(avatar) || (!removeAvatar && user?.avatar?.provider !== "default" && user?.avatar?.url);

  const submitHandler = (e) => {
    e.preventDefault();
    const next = {
      name: !name.trim() ? "validation.nameRequired" : name.length > 30 ? "validation.nameTooLong" : undefined,
      email: emailError(email),
    };
    setErrors(next);
    if (next.name || next.email) return;

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("avatar", avatar);
    if (removeAvatar && !avatar) formData.set("removeAvatar", "true"); // UPDATED: back to the default picture

    dispatch(updateProfile(formData));
  };

  const onChange = (e) => {
    // UPDATED: same guard as Register; cancelling the picker used to throw
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      alert.error(t("validation.avatarInvalid"));
      return;
    }
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        setAvatar(reader.result);
        setRemoveAvatar(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const onRemove = () => {
    setAvatar("");
    setAvatarPreview(DEFAULT_AVATAR);
    setRemoveAvatar(true);
  };

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
    if (isUpdated) {
      alert.success(t("account.edit.success"));
      dispatch(loadUser()); // refreshes Header + Profile with the saved data
      navigate("/me");

      dispatch({
        type: UPDATE_PROFILE_RESET,
      });
    }
  }, [dispatch, alert, error, isUpdated, navigate, t]);

  return (
    <Fragment>
      <MetaDAta title={t("account.edit.pageTitle")} />
      <div className="vx-page vx-account">
        <div className="vx-container">
          <div className="vx-account-head">
            <nav className="vx-breadcrumb" aria-label="Breadcrumb">
              <Link to="/me">{t("account.nav.title")}</Link>
              <span aria-hidden="true">/</span>
              <Link to="/me">{t("account.nav.profile")}</Link>
              <span aria-hidden="true">/</span>
              <span>{t("account.edit.crumb")}</span>
            </nav>
            <h1 className="vx-title-xl">{t("account.edit.title")}</h1>
            <p className="vx-muted">{t("account.edit.subtitle")}</p>
          </div>

          <div className="vx-account-grid">
            <AccountNav />

            <form className="vx-account-main" onSubmit={submitHandler} encType="multipart/form-data" noValidate>
              <section className="vx-card vx-account-section">
                <div className="vx-account-section-head vx-account-section-head--line">
                  <div>
                    <h2 className="vx-title-sm">{t("account.edit.photoTitle")}</h2>
                    <p className="vx-muted">{t("account.edit.photoText")}</p>
                  </div>
                  <span className="vx-label">{t("account.edit.section", { n: "01" })}</span>
                </div>
                <div className="vx-avatar-edit">
                  <img src={avatarPreview} alt="" className="vx-avatar-edit-img" />
                  <div>
                    <div className="vx-avatar-edit-actions">
                      <label htmlFor="avatar_upload" className="vx-btn vx-btn--primary">
                        <i className="fa fa-upload" aria-hidden="true" /> {t("account.edit.upload")}
                      </label>
                      <input
                        type="file"
                        name="avatar"
                        id="avatar_upload"
                        className="vx-sr-only"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={onChange}
                      />
                      {hasCustomAvatar && (
                        <button type="button" className="vx-btn vx-btn--soft vx-avatar-remove" onClick={onRemove}>
                          <i className="fa fa-trash-o" aria-hidden="true" /> {t("account.edit.remove")}
                        </button>
                      )}
                    </div>
                    <p className="vx-field-hint">{removeAvatar ? t("account.edit.photoRemovedNote") : t("account.edit.photoHint")}</p>
                  </div>
                </div>
              </section>

              <section className="vx-card vx-account-section">
                <div className="vx-account-section-head vx-account-section-head--line">
                  <div>
                    <h2 className="vx-title-sm">{t("account.edit.detailsTitle")}</h2>
                    <p className="vx-muted">{t("account.edit.detailsText")}</p>
                  </div>
                  <span className="vx-label">{t("account.edit.section", { n: "02" })}</span>
                </div>
                <div className="vx-form-row vx-account-form">
                  <Field id="name_field" label={t("account.profile.name")} error={errors.name}>
                    <input
                      type="text"
                      id="name_field"
                      className="vx-control"
                      maxLength={30}
                      autoComplete="name"
                      value={name}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name_field_error" : undefined}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <Field id="email_field" label={t("account.profile.email")} error={errors.email}>
                    <input
                      type="email"
                      id="email_field"
                      className="vx-control"
                      autoComplete="email"
                      value={email}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email_field_error" : undefined}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <div className="vx-card vx-account-actions">
                <p className="vx-muted"><i className="fa fa-lock" aria-hidden="true" /> {t("account.edit.note")}</p>
                <div>
                  <Link to="/me" className="vx-btn vx-btn--soft">{t("account.edit.cancel")}</Link>
                  <button type="submit" className="vx-btn vx-btn--primary" disabled={loading}>
                    <i className="fa fa-floppy-o" aria-hidden="true" /> {t(loading ? "account.edit.saving" : "account.edit.save")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateProfile;
