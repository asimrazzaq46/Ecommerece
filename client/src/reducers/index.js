import { combineReducers } from "redux";

import productReducer from "./Products/productReducer";
import productDetailReducer from "./Products/productDetailReducer";
import AuthReducer from "./AuthUsers/AuthReducer";
import RegisterUserReducer from "./AuthUsers/RegisterUserReducer";
import UserReducer from "./Users/UserReducer";

const reducers = combineReducers({
  products: productReducer,
  productDetails: productDetailReducer,
  auth: AuthReducer,
  registerUser: RegisterUserReducer,
  user: UserReducer,
});

export default reducers;
