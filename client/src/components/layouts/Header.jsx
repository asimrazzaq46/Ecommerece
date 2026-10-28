import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "../ui/Alerts";

import { logout } from "../../actions";

import Search from "./Search";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const alert = useAlert();
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const logoutHandler = () => {
    dispatch(logout());
    alert.success("Logout Successfully.");
  };

  return (
    <Fragment>
      <nav aria-label="Main navigation" className="navbar row">
        <div className="col-12 col-md-3">
          <div className="navbar-brand">
            <Link to="/">
              <img src="/images/logo.png" alt="ShopIT home" />
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-6 mt-2 mt-md-0">
          <Search />
        </div>

        <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">
          <Link to="/cart" style={{ textDecoration: "none" }}>
            <span id="cart" className="ml-3">
              Cart
            </span>
            <span
              className="ml-1"
              id={cartItems.length > 0 ? "cart_count" : ""}
            >
              {cartItems.length > 0 ? cartItems.length : ""}
            </span>
          </Link>

          {user ? (
            <div className="ml-4 dropdown d-inline">
              <button
                onClick={() => setMenuOpen(open => !open)}
                className="btn btn-link dropdown-toggle text-white mr-4"
                type="button"
                id="dropDownMenuButton"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }}
              >
                <figure className="avatar avatar-nav">
                  <img
                    src={user.avatar && user.avatar.url}
                    alt={user && user.name}
                    className="rounded-circle"
                  />
                </figure>
                <span>{user && user.name}</span>
              </button>

              <div
                className={`dropdown-menu${menuOpen ? " show" : ""}`}
                onClick={() => setMenuOpen(false)}
                onKeyDown={e => { if (e.key === "Escape") setMenuOpen(false); }}
                aria-labelledby="dropDownMenuButton"
              >
                {user && user.role === "admin" && (
                  <Link className="dropdown-item" to="/dashboard">
                    DashBoard
                  </Link>
                )}
                <Link className="dropdown-item" to="/orders/me">
                  Orders
                </Link>
                <Link className="dropdown-item" to="/me">
                  Profile
                </Link>

                <Link
                  className="dropdown-item text-danger"
                  to="/"
                  onClick={logoutHandler}
                >
                  Logout
                </Link>
              </div>
            </div>
          ) : (
            !loading && (
              <Link to="/login" className="btn ml-4 login_link" id="login_btn">
                Login
              </Link>
            )
          )}
        </div>
      </nav>
    </Fragment>
  );
};

export default Header;
