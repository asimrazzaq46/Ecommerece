import { combineReducers } from "redux";

import productReducer from "./Products/productReducer";
import productDetailReducer from "./Products/productDetailReducer";
import AuthReducer from "./AuthUsers/AuthReducer";
import RegisterUserReducer from "./AuthUsers/RegisterUserReducer";
import UserReducer from "./Users/UserReducer";
import PasswordReducers from "./Users/PasswordReducers";
import cartReducers from "./CartReducers/cartReducers";

const reducers = combineReducers({
  products: productReducer,
  productDetails: productDetailReducer,
  auth: AuthReducer,
  registerUser: RegisterUserReducer,
  user: UserReducer,
  userPasswords: PasswordReducers,
  cart: cartReducers,
});

export default reducers;
