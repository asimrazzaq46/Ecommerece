import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { countries } from "countries-list";

import { saveShippingInfo } from "../../actions";
import MetaDAta from "../layouts/MetaDAta";
import { translateServerError } from "../../i18n";
import { messageFor } from "../../queries/products";
import CheckoutSteps from "./CheckoutSteps";
import OrderSummary from "./OrderSummary";
import { orderTotals } from "./orderTotals";

const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;
const FIELDS = ["address", "city", "postalCode", "phoneNo", "country"];
const pick = (info) => Object.fromEntries(FIELDS.map((key) => [key, (info && info[key]) || ""]));
const sameAddress = (a, b) => FIELDS.every((key) => (a[key] || "").trim() === (b[key] || "").trim());

const Shipping = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { shippingInfo, savedShippingInfo, cartItems } = useSelector((state) => state.cart);

  //ALL STATES COMES HERE

  // UPDATED: one form object so the saved account address can be applied at once
  const [form, setForm] = useState(() => pick(shippingInfo));
  const { address, city, postalCode, phoneNo, country } = form;
  const onField = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const [errors, setErrors] = useState({}); // UPDATED: translated inline validation
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // UPDATED: the account address arrives after login sync; prefill only an untouched (empty) form
  useEffect(() => {
    setForm((current) => (FIELDS.some((key) => current[key]) ? current : pick(shippingInfo)));
  }, [shippingInfo]);
  const showSaved = savedShippingInfo && savedShippingInfo.address && !sameAddress(form, savedShippingInfo);

  const dispatch = useDispatch();

  // UPDATED: the stored value stays the English name (as before); only the label is localized
  const countriesList = useMemo(() => {
    let names;
    try {
      names = new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      names = null;
    }
    return Object.entries(countries)
      .map(([code, { name }]) => ({ value: name, label: names?.of(code) || name }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  }, [i18n.language]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const required = (value) => (value.trim() ? undefined : "checkout.shipping.errors.required");
    const next = {
      country: country ? undefined : "checkout.shipping.errors.country",
      address: required(address),
      city: required(city),
      postalCode: required(postalCode),
      phoneNo: required(phoneNo) || (PHONE_RE.test(phoneNo.trim()) ? undefined : "checkout.shipping.errors.phone"),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    setSaveError("");
    try {
      // UPDATED: signed-in users save this as their default address on the account
      await dispatch(saveShippingInfo({ address, city, postalCode, phoneNo, country }));
      navigate(`/confirm`);
    } catch (error) {
      setSaveError(translateServerError(t, messageFor(error)));
    } finally {
      setSaving(false);
    }
  };

  // Field wrapper: label + control + translated error, wired with aria-describedby.
  const field = (id, name, label, control, hint) => (
    <div className="vx-field">
      <label htmlFor={id} className="vx-field-label">
        {label}
      </label>
      {React.cloneElement(control, {
        id,
        required: true,
        "aria-invalid": Boolean(errors[name]),
        "aria-describedby": errors[name] ? `${id}_error` : hint ? `${id}_hint` : undefined,
      })}
      {errors[name] ? (
        <p id={`${id}_error`} className="vx-field-error" role="alert">{t(errors[name])}</p>
      ) : (
        hint && <p id={`${id}_hint`} className="vx-field-hint">{hint}</p>
      )}
    </div>
  );

  return (
    <Fragment>
      <MetaDAta title={t("checkout.shipping.pageTitle")} />
      {/* UPDATED: Veyra shipping step (Stitch "shipping consignment" design) */}
      <div className="vx-page vx-checkout">
        <CheckoutSteps shipping />
        <div className="vx-container vx-checkout-grid">
          <div className="vx-checkout-main">
            <div className="vx-checkout-head">
              <span className="vx-eyebrow-dot">{t("checkout.shipping.eyebrow")}</span>
              <h1 className="vx-title-xl">{t("checkout.shipping.title")}</h1>
              <p className="vx-muted">{t("checkout.shipping.subtitle")}</p>
            </div>

            <form id="shipping_form" className="vx-card vx-checkout-card vx-form" onSubmit={submitHandler} noValidate>
              <div className="vx-card-title-row">
                <h2 className="vx-title-sm">{t("checkout.shipping.formTitle")}</h2>
                <span className="vx-label">* {t("checkout.shipping.required")}</span>
              </div>

              {showSaved && (
                <div className="vx-saved-address" role="status">
                  <i className="fa fa-bookmark-o" aria-hidden="true" />
                  <div>
                    <p className="vx-secure-title">{t("checkout.shipping.savedTitle")}</p>
                    <p>
                      {savedShippingInfo.address}, {savedShippingInfo.postalCode} {savedShippingInfo.city}, {savedShippingInfo.country}
                    </p>
                    <p className="vx-field-hint">{t("checkout.shipping.savedHint")}</p>
                  </div>
                  <button type="button" className="vx-btn vx-btn--soft" onClick={() => setForm(pick(savedShippingInfo))}>
                    {t("checkout.shipping.useSaved")}
                  </button>
                </div>
              )}
              {saveError && <p role="alert" className="vx-form-alert">{saveError}</p>}
              {field(
                "country_field",
                "country",
                t("checkout.shipping.country"),
                <select className="vx-control" value={country} onChange={onField("country")}>
                  <option value="" disabled>
                    {t("checkout.shipping.selectCountry")}
                  </option>
                  {countriesList.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>,
              )}
              {field(
                "address_field",
                "address",
                t("checkout.shipping.address"),
                <input
                  type="text"
                  className="vx-control"
                  autoComplete="street-address"
                  placeholder={t("checkout.shipping.addressPlaceholder")}
                  value={address}
                  onChange={onField("address")}
                />,
              )}
              <div className="vx-form-row">
                {field(
                  "city_field",
                  "city",
                  t("checkout.shipping.city"),
                  <input type="text" className="vx-control" autoComplete="address-level2" value={city} onChange={onField("city")} />,
                )}
                {field(
                  "postal_code_field",
                  "postalCode",
                  t("checkout.shipping.postalCode"),
                  <input type="text" className="vx-control" autoComplete="postal-code" value={postalCode} onChange={onField("postalCode")} />,
                )}
              </div>
              {field(
                "phone_field",
                "phoneNo",
                t("checkout.shipping.phone"),
                <input
                  type="tel"
                  className="vx-control"
                  autoComplete="tel"
                  placeholder={t("checkout.shipping.phonePlaceholder")}
                  value={phoneNo}
                  onChange={onField("phoneNo")}
                />,
                t("checkout.shipping.phoneHint"),
              )}
            </form>

            <div className="vx-checkout-actions">
              <Link to="/cart" className="vx-back-link">
                <i className="fa fa-arrow-left" aria-hidden="true" /> {t("checkout.shipping.back")}
              </Link>
              <button type="submit" form="shipping_form" className="vx-btn vx-btn--primary vx-checkout-next" disabled={saving}>
                {t("checkout.shipping.submit")} <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>

          <OrderSummary items={cartItems} totals={orderTotals(cartItems)} note={t("checkout.summary.estimate")} />
        </div>
      </div>
    </Fragment>
  );
};

export default Shipping;
