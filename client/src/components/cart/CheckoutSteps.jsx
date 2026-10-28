import React from "react";
import { Link } from "react-router-dom";
export default function CheckoutSteps({shipping, ConfirmOrder, payment}) {
 const current = payment ? 2 : ConfirmOrder ? 1 : 0;
 const steps = [{label:"Shipping",path:"/shipping",enabled:shipping},{label:"Confirm Order",path:"/confirm",enabled:ConfirmOrder},{label:"Payment",path:"/payment",enabled:payment}];
 return <nav aria-label="Checkout progress" className="checkout-progress mt-5"><ol className="checkout-step-list">{steps.map((step,index)=><li key={step.path} aria-current={current===index?"step":undefined}>{step.enabled?<Link to={step.path} className="checkout-step-link">{step.label}</Link>:<span className="checkout-step-disabled">{step.label}</span>}</li>)}</ol></nav>;
}
