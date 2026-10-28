const security = jest.requireActual("../middlewares/requestSecurity");
const RateBucket = require("../models/rateBucket");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { response } = require("./helpers");
const req = (headers={},extra={}) => ({method:"POST",path:"/login",cookies:{token:"cookie"},ip:"127.0.0.1",get:key=>headers[key],...extra});
test.each([{"Origin":"https://attacker.example"},{"Sec-Fetch-Site":"cross-site"},{}])("rejects unsafe authenticated origin %j", headers=>{
 const next=jest.fn(); security.origin(req(headers),response(),next); expect(next).toHaveBeenCalledWith(expect.objectContaining({statusCode:403}));
});
test("custom same-origin request header permits non-browser clients without enabling CORS",()=>{
 const next=jest.fn();security.origin(req({"X-ShopIT-Request":"1"}),response(),next);expect(next).toHaveBeenCalledWith();
});
test("shared database counter rejects excessive requests and sets retry time",async()=>{
 jest.spyOn(RateBucket,"findOneAndUpdate").mockResolvedValue({count:31});const next=jest.fn(),res=response();res.setHeader=jest.fn();await security.limit(req(),res,next);expect(next).toHaveBeenCalledWith(expect.objectContaining({statusCode:429}));expect(res.setHeader).toHaveBeenCalledWith("Retry-After",expect.any(String));
});
test("session version change invalidates a previously signed token",async()=>{
 jest.spyOn(User,"findById").mockResolvedValue({id:"u",sessionVersion:1});const next=jest.fn();await require("../middlewares/auth").isAuthenticatedUser({cookies:{token:jwt.sign({id:"u",sessionVersion:0},process.env.JWT_SECRET)}},response(),next);expect(next).toHaveBeenCalledWith(expect.objectContaining({statusCode:401}));
});
test("production refuses missing secrets and insecure deployment settings",()=>{
 const validate=require("../utils/validateEnvironment");expect(()=>validate({NODE_ENV:"production"})).toThrow("Missing production");expect(()=>validate({NODE_ENV:"development"})).not.toThrow();
});
