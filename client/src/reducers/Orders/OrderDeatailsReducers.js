import {
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
} from "../../constants/orderConstants";

const orderDetailReducers = (state = { order: {} }, action) => {
  switch (action.type) {
    case ORDER_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case ORDER_DETAILS_SUCCESS:
      return {
        loading: false,
        order: action.payload,
      };
    case ORDER_DETAILS_FAIL:
      return {
        ...state, // UPDATED: keep orders so the page does not crash on failure
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default orderDetailReducers;
