import { combineReducers } from "redux";

import productReducer from "./Products/productReducer";
import productDetailReducer from "./Products/productDetailReducer";
import AuthReducer from "./AuthUsers/AuthReducer";
import RegisterUserReducer from "./AuthUsers/RegisterUserReducer";
import UserReducer from "./Users/UserReducer";
import PasswordReducers from "./Users/PasswordReducers";
import cartReducers from "./CartReducers/cartReducers";
import OrderReducers from "./Orders/OrderReducers";
import MyOrderReducers from "./Orders/MyOrderReducers";
import OrderDeatailsReducers from "./Orders/OrderDeatailsReducers";
import orderDetailReducers from "./Orders/OrderDeatailsReducers";

const reducers = combineReducers({
  products: productReducer,
  productDetails: productDetailReducer,
  auth: AuthReducer,
  registerUser: RegisterUserReducer,
  user: UserReducer,
  userPasswords: PasswordReducers,
  cart: cartReducers,
  newOrder: OrderReducers,
  myOrder: MyOrderReducers,
  orderDetails: orderDetailReducers,
});

export default reducers;
