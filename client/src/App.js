import { BrowserRouter as Router, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import Header from "./components/layouts/Header";

import Home from "./components/Home";
import productDetails from "./components/products/productDetails";

import Register from "./components/user/Register";
import Login from "./components/user/Login";

import Footer from "./components/layouts/Footer";

import "./App.css";
import { loadUser } from "./actions";
import { store } from "./index";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, []);
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="container container-fluid">
          <Route path="/" exact component={Home} />
          <Route path="/search/:keyword" component={Home} />
          <Route path="/product/:id" exact component={productDetails} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
