jest.mock("../services/reconcilePayment",()=>jest.fn());
const reconcile = require("../services/reconcilePayment");
const handler = require("../controllers/stripeWebhook");
const stripe = require("../utils/stripeClient")();
const RealStripe = jest.requireActual("stripe");
const verifier = new RealStripe("sk_test_fixture");
const { response } = require("./helpers");
beforeEach(()=>{process.env.STRIPE_WEBHOOK_SECRET="whsec_fixture";stripe.webhooks=verifier.webhooks;});
afterEach(()=>{delete process.env.STRIPE_WEBHOOK_SECRET;});
function request(signatureValid=true) {const body=JSON.stringify({id:"evt_fixture",type:"payment_intent.succeeded",data:{object:{id:"pi_fixture",metadata:{checkoutId:"c",userId:"u"}}}});const signature=verifier.webhooks.generateTestHeaderString({payload:body,secret:signatureValid?"whsec_fixture":"wrong"});return {body:Buffer.from(body),get:()=>signature};}
test("invalid signature cannot trigger order writes",async()=>{const res=response();await handler(request(false),res);expect(res.status).toHaveBeenCalledWith(400);expect(reconcile).not.toHaveBeenCalled();});
test("verified succeeded event reconciles using the payment's user",async()=>{reconcile.mockResolvedValue({_id:"order"});const res=response();await handler(request(),res);expect(reconcile).toHaveBeenCalledWith("pi_fixture","u");expect(res.json).toHaveBeenCalledWith({received:true});});
test("transient failure returns failure so Stripe retries",async()=>{reconcile.mockRejectedValue(new Error("DB unavailable"));const res=response();await handler(request(),res);expect(res.status).toHaveBeenCalledWith(500);});
