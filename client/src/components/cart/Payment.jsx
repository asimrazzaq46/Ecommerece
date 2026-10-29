import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import axios from "axios";

import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";

import MetaDAta from "../layouts/MetaDAta";
import { formatPrice } from "../../i18n";
import CheckoutSteps from "./CheckoutSteps";
import OrderSummary from "./OrderSummary";
import { clearError, createOrder, removeItemFromCart } from "../../actions";
// UPDATED: Stripe fields styled to match the Veyra inputs
const options = {
  style: {
    base: {
      fontSize: "15px",
      color: "#1a1c1b",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      "::placeholder": { color: "#73787a" },
    },
    invalid: {
      color: "#ba1a1a",
    },
  },
};

const Payment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const alert = useAlert();
  const stripe = useStripe();
  const element = useElements();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cartItems, shippingInfo } = useSelector((state) => state.cart);
  const orderError = useSelector((state) => state.newOrder.error);
  const [busy, setBusy] = useState(false);
  // UPDATED: don't show an order error left over from a previous checkout
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  const submitting = useRef(false);
  const [message, setMessage] = useState("");
  const readSession = key => {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
  };
  const orderInfo = readSession("orderInfo");
  const pending = readSession("pendingCheckout");
  const userId = user && (user._id || user.id || user.email);
  const recoverable = pending && pending.userId === userId;
  const [total, setTotal] = useState(() => recoverable ? pending.totalPrice : orderInfo && orderInfo.totalPrice);

  const submitHandler = async e => {
    e.preventDefault();
    if (submitting.current || !user) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    try {
      let attempt = readSession("pendingCheckout");
      if (!attempt || attempt.userId !== userId) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        attempt = {
          userId, checkoutKey: Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join(""),
          orderItems: cartItems, shippingInfo, totalPrice: total,
        };
        sessionStorage.setItem("pendingCheckout", JSON.stringify(attempt));
      }
      if (!attempt.paid) {
        if (!stripe || !element) throw new Error(t("checkout.payment.stillLoading"));
        const { data } = await axios.post("/api/v1/payment/process", attempt);
        attempt.paymentId = data.paymentIntentId;
        const changed = Number(data.totalPrice) !== Number(total);
        attempt.totalPrice = data.totalPrice;
        sessionStorage.setItem("pendingCheckout", JSON.stringify(attempt));
        setTotal(data.totalPrice);
        if (changed && data.status !== "succeeded") {
          setMessage(t("checkout.payment.totalChanged"));
          return;
        }
        if (data.status !== "succeeded") {
          const result = await stripe.confirmCardPayment(data.client_secret, {
            payment_method: {
              card: element.getElement(CardNumberElement),
              billing_details: { name: user.name, email: user.email },
            },
          });
          if (result.error) throw new Error(result.error.message);
          if (result.paymentIntent.status !== "succeeded") throw new Error(t("checkout.payment.pending"));
          attempt.paymentId = result.paymentIntent.id;
        }
        attempt.paid = true;
        sessionStorage.setItem("pendingCheckout", JSON.stringify(attempt));
      }
      const saved = await dispatch(createOrder({ paymentInfo: { id: attempt.paymentId } }));
      if (!saved) {
        setMessage(t("checkout.payment.savedPending", { ref: attempt.paymentId }));
        return;
      }
      // Fix: clear every ordered product; the old exact-quantity match left items behind.
      attempt.orderItems.forEach(item => dispatch(removeItemFromCart(item.product)));
      sessionStorage.removeItem("pendingCheckout");
      sessionStorage.removeItem("orderInfo");
      navigate("/success");
    } catch (err) {
      const text = (err.response && err.response.data && err.response.data.Message) || err.message || t("checkout.payment.failed");
      setMessage(text);
      alert.error(text);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!recoverable && (!orderInfo || !cartItems.length)) {
    return (
      <div className="vx-page vx-checkout">
        <div className="vx-container">
          <div className="vx-card vx-state vx-checkout-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-info" aria-hidden="true" /></span>
            <p>{t("checkout.payment.noSession")}</p>
            <button className="vx-btn vx-btn--primary" onClick={() => navigate("/confirm")}>{t("checkout.payment.returnToCheckout")}</button>
          </div>
        </div>
      </div>
    );
  }

  // UPDATED: summary shows the items being paid for; the total is the server-confirmed amount once known
  const summaryItems = recoverable ? pending.orderItems : cartItems;
  const info = orderInfo || {};
  const address = recoverable ? pending.shippingInfo : shippingInfo;
  const paidAlready = recoverable && pending.paid;

  return (
    <Fragment>
      <MetaDAta title={t("checkout.payment.pageTitle")} />
      {/* UPDATED: Veyra payment step (Stitch "checkout payment" design) */}
      <div className="vx-page vx-checkout">
        <CheckoutSteps shipping ConfirmOrder payment />
        <div className="vx-container vx-checkout-grid vx-checkout-grid--pay">
          <div className="vx-checkout-main">
            <div className="vx-checkout-head vx-checkout-head--row">
              <div>
                <span className="vx-eyebrow-dot">{t("checkout.payment.eyebrow")}</span>
                <h1 className="vx-title-xl">{t("checkout.payment.title")}</h1>
              </div>
              <span className="vx-label"><i className="fa fa-lock" aria-hidden="true" /> {t("checkout.payment.poweredBy")}</span>
            </div>

            {address && address.address && (
              <section className="vx-card vx-checkout-card vx-recap">
                <div className="vx-card-title-row">
                  <span className="vx-label"><i className="fa fa-truck" aria-hidden="true" /> {t("checkout.payment.deliverTo")}</span>
                  {!paidAlready && <Link to="/shipping" className="vx-edit-link">{t("checkout.payment.modify")}</Link>}
                </div>
                <div className="vx-recap-box">
                  <p className="vx-title-sm">{user && user.name}</p>
                  <p className="vx-muted">{address.address}, {address.postalCode} {address.city}, {address.country} • {address.phoneNo}</p>
                </div>
              </section>
            )}

            <form className="vx-card vx-checkout-card vx-form" onSubmit={submitHandler}>
              <div className="vx-card-title-row">
                <h2 className="vx-title-sm">{t("checkout.payment.cardTitle")}</h2>
                <span className="vx-card-brands" aria-hidden="true">
                  <span>Visa</span><span>MC</span><span>Amex</span>
                </span>
              </div>
              {message && <p role="alert" className="vx-form-alert">{message}</p>}
              {orderError && <p role="alert" className="vx-form-alert">{orderError}</p>}
              {recoverable && <p className="vx-form-info">{t("checkout.payment.recoverable")}</p>}
              <div className="vx-field">
                <label htmlFor="card_num_field" className="vx-field-label">{t("checkout.payment.cardNumber")}</label>
                <CardNumberElement
                  type="text"
                  id="card_num_field"
                  className="vx-control vx-stripe-field"
                  options={options}
                />
              </div>

              <div className="vx-form-row">
                <div className="vx-field">
                  <label htmlFor="card_exp_field" className="vx-field-label">{t("checkout.payment.expiry")}</label>
                  <CardExpiryElement
                    type="text"
                    id="card_exp_field"
                    className="vx-control vx-stripe-field"
                    options={options}
                  />
                </div>

                <div className="vx-field">
                  <label htmlFor="card_cvc_field" className="vx-field-label">{t("checkout.payment.cvc")}</label>
                  <CardCvcElement
                    type="text"
                    id="card_cvc_field"
                    className="vx-control vx-stripe-field"
                    options={options}
                  />
                  <p className="vx-field-hint">{t("checkout.payment.cvcHint")}</p>
                </div>
              </div>

              <div className="vx-secure-note">
                <span className="vx-secure-icon"><i className="fa fa-shield" aria-hidden="true" /></span>
                <div>
                  <p className="vx-secure-title">{t("checkout.payment.secureTitle")}</p>
                  <p>{t("checkout.payment.secureText")}</p>
                </div>
              </div>

              <button id="pay_btn" type="submit" disabled={busy || (!stripe && !paidAlready)} className="vx-btn vx-btn--primary vx-btn--caps vx-pay-btn">
                <i className="fa fa-lock" aria-hidden="true" />
                {busy ? t("checkout.payment.processing") : paidAlready ? t("checkout.payment.retryConfirm") : t("checkout.payment.pay", { total: formatPrice(total || 0) })}
              </button>
            </form>
          </div>

          <OrderSummary
            items={summaryItems}
            editable={!paidAlready}
            totals={{ itemsPrice: info.itemsPrice, shippingPrice: info.shippingPrice, taxPrice: info.taxPrice, totalPrice: total }}
            note={t("checkout.summary.serverTotal")}
          />
        </div>
      </div>
    </Fragment>
  );
};

export default Payment;
