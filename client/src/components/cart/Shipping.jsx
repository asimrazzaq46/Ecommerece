import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { countries } from "countries-list";

import { saveShippingInfo } from "../../actions";
import MetaDAta from "../layouts/MetaDAta";
import CheckoutSteps from "./CheckoutSteps";
import OrderSummary from "./OrderSummary";
import { orderTotals } from "./orderTotals";

const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

const Shipping = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { shippingInfo, cartItems } = useSelector((state) => state.cart);

  //ALL STATES COMES HERE

  const [address, setAddress] = useState(shippingInfo.address || "");
  const [city, setCity] = useState(shippingInfo.city || "");
  const [postalCode, setPostalCode] = useState(shippingInfo.postalCode || "");
  const [phoneNo, setPhoneNo] = useState(shippingInfo.phoneNo || "");
  const [country, setCountry] = useState(shippingInfo.country || "");
  const [errors, setErrors] = useState({}); // UPDATED: translated inline validation

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

  const submitHandler = (e) => {
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
    dispatch(saveShippingInfo({ address, city, postalCode, phoneNo, country }));
    navigate(`/confirm`);
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

              {field(
                "country_field",
                "country",
                t("checkout.shipping.country"),
                <select className="vx-control" value={country} onChange={(e) => setCountry(e.target.value)}>
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
                  onChange={(e) => setAddress(e.target.value)}
                />,
              )}
              <div className="vx-form-row">
                {field(
                  "city_field",
                  "city",
                  t("checkout.shipping.city"),
                  <input type="text" className="vx-control" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />,
                )}
                {field(
                  "postal_code_field",
                  "postalCode",
                  t("checkout.shipping.postalCode"),
                  <input type="text" className="vx-control" autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />,
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
                  onChange={(e) => setPhoneNo(e.target.value)}
                />,
                t("checkout.shipping.phoneHint"),
              )}
            </form>

            <div className="vx-checkout-actions">
              <Link to="/cart" className="vx-back-link">
                <i className="fa fa-arrow-left" aria-hidden="true" /> {t("checkout.shipping.back")}
              </Link>
              <button type="submit" form="shipping_form" className="vx-btn vx-btn--primary vx-checkout-next">
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
