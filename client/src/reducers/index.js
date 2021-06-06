import { combineReducers } from "redux";

import productReducer from "./Products/productReducer";
import productDetailReducer from "./Products/productDetailReducer";
import AuthReducer from "./AuthUsers/AuthReducer";
import RegisterUserReducer from "./AuthUsers/RegisterUserReducer";
import LoadUserReducer from "./AuthUsers/LoadUserReducer";

const reducers = combineReducers({
  products: productReducer,
  productDetails: productDetailReducer,
  auth: AuthReducer,
  registerUser: RegisterUserReducer,
  loadUser: LoadUserReducer,
});

export default reducers;
