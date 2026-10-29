import { orderTotals } from "./orderTotals";

test("charges shipping up to $200 and adds 5% tax", () => {
  expect(orderTotals([{ price: 50, quantity: 2 }])).toEqual({ itemsPrice: 100, shippingPrice: 25, taxPrice: 5, totalPrice: "130.00" });
  expect(orderTotals([{ price: 200.5, quantity: 1 }]).shippingPrice).toBe(0);
  expect(orderTotals([]).totalPrice).toBe("25.00");
});
