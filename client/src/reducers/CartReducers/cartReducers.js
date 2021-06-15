import { ADD_TO_CART, REMOVE_ITEM_CART } from "../../constants/cartConstants";
import { SAVE_SHIPPING_INFO } from "../../constants/shippingConstants";

const cartReducer = (state = { cartItems: [] }, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      const item = action.payload;
      const isItemExist = state.cartItems.find(
        (i) => i.product === item.product
      );
      if (isItemExist) {
        return {
          ...state,
          cartItems: state.cartItems.map((i) =>
            i.product === isItemExist.product ? item : i
          ),
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        };
      }
    case REMOVE_ITEM_CART:
      return {
        ...state,
        cartItems: state.cartItems.filter((i) => i.product !== action.payload),
      };

    // shipping reducer
    case SAVE_SHIPPING_INFO:
      return {
        ...state,
        shippingInfo: action.payload,
      };

    default:
      return state;
  }
};

export default cartReducer;
