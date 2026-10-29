import {
  MY_ORDERS_REQUEST,
  MY_ORDERS_SUCCESS,
  MY_ORDERS_FAIL,
} from "../../constants/orderConstants";

const myOrderReducer = (state = { orders: [] }, action) => {
  switch (action.type) {
    case MY_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case MY_ORDERS_SUCCESS:
      return {
        loading: false,
        orders: action.payload,
      };
    case MY_ORDERS_FAIL:
      return {
        ...state, // UPDATED: keep orders so the page does not crash on failure
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default myOrderReducer;
