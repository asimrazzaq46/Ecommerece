import { BrowserRouter as Router, Route } from "react-router-dom";

import axios from "axios";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "./components/layouts/Header";

import ProtectedRoute from "./components/route/ProtectedRoute";

import Home from "./components/Home";
import productDetails from "./components/products/productDetails";

// AUTH IMPORTS

import Register from "./components/user/Register";
import Login from "./components/user/Login";
import Profile from "./components/user/Profile";
import UpdateProfile from "./components/user/UpdateProfile";
import UpdatePassword from "./components/user/UpdatePassword";
import ForgotPassword from "./components/user/ForgotPassword";
import NewPassword from "./components/user/NewPassword";

// CART IMPORTS

import Cart from "./components/cart/Cart";
import Shipping from "./components/cart/Shipping";
import ConfirmOrder from "./components/cart/ConfirmOrder";
import Payment from "./components/cart/Payment";
import OrderSuccess from "./components/cart/OrderSuccess";

// ORDER IMPORTS

import ListOrders from "./components/orders/ListOrders";
import OrderDetails from "./components/orders/OrderDetails";

// ADMIN IMPORTS

import Dashboard from "./components/admin/Dashboard";
import ProductList from "./components/admin/ProductList";
import NewProduct from "./components/admin/NewProduct";
import UpdateProduct from "./components/admin/UpdateProduct";
import OrdersList from "./components/admin/OrdersList";
import ProcessOrder from "./components/admin/ProcessOrder";
import UsersList from "./components/admin/UsersList";
import UpdateUser from "./components/admin/UpdateUser";

//FOOTER
import Footer from "./components/layouts/Footer";

import "./App.css";
import { loadUser, newProduct } from "./actions";

//PAYMENT
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

function App() {
  const { loading, user, isAuthenticated } = useSelector((state) => state.auth);

  const [stripeApiKey, setStripeApiKey] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());

    async function getStripeApiKey() {
      const { data } = await axios.get("/api/v1/stripeapi");
      setStripeApiKey(data.stripeApiKey);
    }
    getStripeApiKey();
  }, [dispatch]);
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="container container-fluid">
          <Route path="/" exact component={Home} />
          <Route path="/search/:keyword" component={Home} />
          <Route path="/product/:id" exact component={productDetails} />

          <Route path="/cart" exact component={Cart} />
          <ProtectedRoute path="/shipping" exact component={Shipping} />
          <ProtectedRoute
            path="/order/confirm"
            exact
            component={ConfirmOrder}
          />
          {stripeApiKey && (
            <Elements stripe={loadStripe(stripeApiKey)}>
              <ProtectedRoute path="/payment" exact component={Payment} />
            </Elements>
          )}
          <ProtectedRoute path="/success" exact component={OrderSuccess} />

          <ProtectedRoute path="/orders/me" exact component={ListOrders} />
          <ProtectedRoute path="/order/:id" exact component={OrderDetails} />

          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/password/forgot" exact component={ForgotPassword} />
          <Route path="/password/reset/:token" exact component={NewPassword} />

          <ProtectedRoute path="/me" exact component={Profile} />
          <ProtectedRoute path="/me/update" exact component={UpdateProfile} />
          <ProtectedRoute
            path="/password/update"
            exact
            component={UpdatePassword}
          />
        </div>
        {/* ADMIN ROUTES */}
        <ProtectedRoute
          path="/dashboard"
          isAdmin={true}
          exact
          component={Dashboard}
        />
        <ProtectedRoute
          path="/admin/products"
          isAdmin={true}
          exact
          component={ProductList}
        />
        <ProtectedRoute
          path="/admin/product"
          isAdmin={true}
          exact
          component={NewProduct}
        />

        <ProtectedRoute
          path="/admin/product/:id"
          isAdmin={true}
          exact
          component={UpdateProduct}
        />

        <ProtectedRoute
          path="/admin/orders"
          isAdmin={true}
          exact
          component={OrdersList}
        />

        <ProtectedRoute
          path="/admin/order/:id"
          isAdmin={true}
          exact
          component={ProcessOrder}
        />

        <ProtectedRoute
          path="/admin/users"
          isAdmin={true}
          exact
          component={UsersList}
        />

        <ProtectedRoute
          path="/admin/user/:id"
          isAdmin={true}
          exact
          component={UpdateUser}
        />

        {!loading && (!isAuthenticated || user.role !== "admin") && <Footer />}
      </div>
    </Router>
  );
}

export default App;
