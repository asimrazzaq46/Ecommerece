jest.mock("../services/completeOrder",()=>jest.fn());
const Checkout=require("../models/checkout");const complete=require("../services/completeOrder");const reconcile=require("../services/reconcilePayment");const stripe=require("../utils/stripeClient")();
beforeEach(()=>{stripe.refunds={create:jest.fn().mockResolvedValue({id:"re_fixture",status:"pending"})};});
test("stock failure durably locks fulfillment before an idempotent refund",async()=>{
 jest.spyOn(Checkout,"findOne").mockResolvedValue({_id:"checkout"});complete.mockRejectedValue(Object.assign(new Error("stock"),{code:"STOCK_UNAVAILABLE"}));jest.spyOn(Checkout,"findOneAndUpdate").mockResolvedValue({_id:"checkout",refundPending:true});jest.spyOn(Checkout,"updateOne").mockResolvedValue({});await expect(reconcile("pi_test","u")).rejects.toMatchObject({code:"REFUND_REQUESTED"});expect(stripe.refunds.create).toHaveBeenCalledWith({payment_intent:"pi_test"},{idempotencyKey:"stock-refund-checkout"});expect(Checkout.findOneAndUpdate).toHaveBeenCalledWith({_id:"checkout",completed:false},expect.objectContaining({$set:{refundPending:true},$min:{refundRequestedAt:expect.any(Date)}}),{new:true});
});
test("replayed refund skips both order creation and a second refund",async()=>{
 jest.spyOn(Checkout,"findOne").mockResolvedValue({_id:"checkout",refundPending:true});jest.spyOn(Checkout,"findOneAndUpdate").mockResolvedValue({_id:"checkout",refundPending:true,refundId:"re_done"});await expect(reconcile("pi_test","u")).rejects.toMatchObject({code:"REFUND_REQUESTED"});expect(complete).not.toHaveBeenCalled();expect(stripe.refunds.create).not.toHaveBeenCalled();
});
