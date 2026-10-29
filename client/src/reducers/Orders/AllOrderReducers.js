import {
  ALL_ORDERS_REQUEST,
  ALL_ORDERS_SUCCESS,
  ALL_ORDERS_FAIL,
} from "../../constants/orderConstants";

const allOrderReducers = (state = { orders: [] }, action) => {
  switch (action.type) {
    case ALL_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case ALL_ORDERS_SUCCESS:
      return {
        loading: false,
        orders: action.payload.orders,
        totalAmount: action.payload.totalAmount,
      };
    case ALL_ORDERS_FAIL:
      return {
        ...state, // UPDATED: keep orders so the page does not crash on failure
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default allOrderReducers;
