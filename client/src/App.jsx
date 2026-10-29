import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "./components/layouts/Header";

import ProtectedRoute from "./components/route/ProtectedRoute";

import Home from "./components/Home";
import ProductDetails from "./components/products/productDetails";

// AUTH IMPORTS

const Register = lazy(() => import("./components/user/Register")); // UPDATED: loaded on demand
import Login from "./components/user/Login";
const Profile = lazy(() => import("./components/user/Profile")); // UPDATED: loaded on demand
const UpdateProfile = lazy(() => import("./components/user/UpdateProfile")); // UPDATED: loaded on demand
const UpdatePassword = lazy(() => import("./components/user/UpdatePassword")); // UPDATED: loaded on demand
const ForgotPassword = lazy(() => import("./components/user/ForgotPassword")); // UPDATED: loaded on demand
const NewPassword = lazy(() => import("./components/user/NewPassword")); // UPDATED: loaded on demand

// CART IMPORTS

const Cart = lazy(() => import("./components/cart/Cart")); // UPDATED: loaded on demand
const Shipping = lazy(() => import("./components/cart/Shipping")); // UPDATED: loaded on demand
const ConfirmOrder = lazy(() => import("./components/cart/ConfirmOrder")); // UPDATED: loaded on demand
const PaymentPage = lazy(() => import("./components/cart/PaymentPage"));
const OrderSuccess = lazy(() => import("./components/cart/OrderSuccess")); // UPDATED: loaded on demand

// ORDER IMPORTS

const ListOrders = lazy(() => import("./components/orders/ListOrders")); // UPDATED: loaded on demand
const OrderDetails = lazy(() => import("./components/orders/OrderDetails")); // UPDATED: loaded on demand

// ADMIN IMPORTS

const Dashboard = lazy(() => import("./components/admin/Dashboard"));
const ProductList = lazy(() => import("./components/admin/ProductList"));
const NewProduct = lazy(() => import("./components/admin/NewProduct"));
const UpdateProduct = lazy(() => import("./components/admin/UpdateProduct"));
const OrdersList = lazy(() => import("./components/admin/OrdersList"));
const ProcessOrder = lazy(() => import("./components/admin/ProcessOrder"));
const UsersList = lazy(() => import("./components/admin/UsersList"));
const UpdateUser = lazy(() => import("./components/admin/UpdateUser"));
const ProductReviews = lazy(() => import("./components/admin/ProductReviews"));

//FOOTER
import Footer from "./components/layouts/Footer";
import NotFound from "./components/layouts/NotFound";

import "./App.css";
import { loadUser } from "./actions";

//PAYMENT

// UPDATED: a new page (path change) starts at the top; query-string changes (filters) keep the scroll position
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { loading, user, isAuthenticated } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  return (
    <Router>
      <div className="App">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <ScrollToTop />
        <Header />
        <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<p role="status">Loading page…</p>}>
          <Routes>
            <Route
              element={
                <div className="container container-fluid">
                  <Outlet />
                </div>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/search/:keyword" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />

              <Route path="/cart" element={<Cart />} />
              <Route
                path="/shipping"
                element={
                  <ProtectedRoute>
                    <Shipping />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confirm"
                element={
                  <ProtectedRoute>
                    <ConfirmOrder />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/success"
                element={
                  <ProtectedRoute>
                    <OrderSuccess />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/orders/me"
                element={
                  <ProtectedRoute>
                    <ListOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/password/forgot" element={<ForgotPassword />} />
              <Route path="/password/reset/:token" element={<NewPassword />} />

              <Route
                path="/me"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/me/update"
                element={
                  <ProtectedRoute>
                    <UpdateProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/password/update"
                element={
                  <ProtectedRoute>
                    <UpdatePassword />
                  </ProtectedRoute>
                }
              />
            </Route>
            {/* ADMIN ROUTES */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAdmin>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute isAdmin>
                  <ProductList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/product"
              element={
                <ProtectedRoute isAdmin>
                  <NewProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/product/:id"
              element={
                <ProtectedRoute isAdmin>
                  <UpdateProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute isAdmin>
                  <OrdersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/order/:id"
              element={
                <ProtectedRoute isAdmin>
                  <ProcessOrder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute isAdmin>
                  <UsersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/user/:id"
              element={
                <ProtectedRoute isAdmin>
                  <UpdateUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute isAdmin>
                  <ProductReviews />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} /> {/* UPDATED: simple 404 */}
          </Routes>
        </Suspense>
        </main>
        {!loading && (!isAuthenticated || user?.role !== "admin") && <Footer />}
      </div>
    </Router>
  );
}

export default App;
