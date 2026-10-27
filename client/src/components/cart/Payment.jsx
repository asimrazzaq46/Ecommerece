import { useNavigate } from "react-router-dom";
import React, { Fragment, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import CheckoutSteps from "./CheckoutSteps";
import { createOrder, removeItemFromCart } from "../../actions";
const options = {
  style: {
    base: {
      fontSize: "16px",
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

const Payment = () => {
  const navigate = useNavigate();

  const alert = useAlert();
  const stripe = useStripe();
  const element = useElements();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cartItems, shippingInfo } = useSelector((state) => state.cart);
  const orderError = useSelector((state) => state.newOrder.error);
  const [busy, setBusy] = useState(false);
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
        if (!stripe || !element) throw new Error("Payment form is still loading. Please try again");
        const { data } = await axios.post("/api/v1/payment/process", attempt);
        attempt.paymentId = data.paymentIntentId;
        const changed = Number(data.totalPrice) !== Number(total);
        attempt.totalPrice = data.totalPrice;
        sessionStorage.setItem("pendingCheckout", JSON.stringify(attempt));
        setTotal(data.totalPrice);
        if (changed && data.status !== "succeeded") {
          setMessage("The latest order total is shown below. Review it and press Pay to continue.");
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
          if (result.paymentIntent.status !== "succeeded") throw new Error("Payment is still pending. Retry to check its status; do not start another checkout.");
          attempt.paymentId = result.paymentIntent.id;
        }
        attempt.paid = true;
        sessionStorage.setItem("pendingCheckout", JSON.stringify(attempt));
      }
      const saved = await dispatch(createOrder({ paymentInfo: { id: attempt.paymentId } }));
      if (!saved) {
        setMessage("Payment received but order confirmation is pending. Retry confirmation without paying again. Reference: " + attempt.paymentId);
        return;
      }
      for (const item of attempt.orderItems) {
        if (cartItems.some(current => current.product === item.product && current.quantity === item.quantity)) {
          dispatch(removeItemFromCart(item.product));
        }
      }
      sessionStorage.removeItem("pendingCheckout");
      sessionStorage.removeItem("orderInfo");
      navigate("/success");
    } catch (err) {
      const text = (err.response && err.response.data && err.response.data.Message) || err.message || "Unable to complete checkout";
      setMessage(text);
      alert.error(text);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!recoverable && (!orderInfo || !cartItems.length)) {
    return <div role="alert">Please confirm your cart before making a payment. <button onClick={() => navigate("/confirm")}>Return to checkout</button></div>;
  }

  return (
    <Fragment>
      <MetaDAta title={"Payment"} />

      <CheckoutSteps shipping ConfirmOrder payment />

      <div className="row wrapper">
        <div className="col-10 col-lg-5">
          <form className="shadow-lg" onSubmit={submitHandler}>
            <h1 className="mb-4">Card Info</h1>
            {message && <p role="alert">{message}</p>}
            {orderError && <p role="alert">{orderError}</p>}
            {recoverable && <p>Continue your saved checkout. A completed payment will not be charged again.</p>}
            <div className="form-group">
              <label htmlFor="card_num_field">Card Number</label>
              <CardNumberElement
                type="text"
                id="card_num_field"
                className="form-control"
                options={options}
              />
            </div>

            <div className="form-group">
              <label htmlFor="card_exp_field">Card Expiry</label>
              <CardExpiryElement
                type="text"
                id="card_exp_field"
                className="form-control"
                options={options}
              />
            </div>

            <div className="form-group">
              <label htmlFor="card_cvc_field">Card CVC</label>
              <CardCvcElement
                type="text"
                id="card_cvc_field"
                className="form-control"
                options={options}
              />
            </div>

            <button id="pay_btn" type="submit" disabled={busy || (!stripe && !(recoverable && pending.paid))} className="btn btn-block py-3">
              {busy ? "Processing..." : recoverable && pending.paid ? "Retry order confirmation" : `Pay - ${total || "0.00"}`}
            </button>
          </form>
        </div>
      </div>
    </Fragment>
  );
};

export default Payment;
