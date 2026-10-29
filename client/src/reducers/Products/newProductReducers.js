import {
  NEW_PRODUCT_REQUEST,
  NEW_PRODUCT_SUCCESS,
  NEW_PRODUCT_RESET,
  NEW_PRODUCT_FAIL,
} from "../../constants/productConstants";

const newProductReducer = (state = {}, action) => {
  switch (action.type) {
    case NEW_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case NEW_PRODUCT_SUCCESS:
      return {
        loading: false,
        success: action.payload.success,
      };
    case NEW_PRODUCT_RESET:
      return {
        ...state,
        success: false,
      };
    case NEW_PRODUCT_FAIL:
      return {
        ...state,
        loading: false, // UPDATED: re-enable the form after a failure
        error: action.payload,
      };
    default:
      return state;
  }
};

export default newProductReducer;
