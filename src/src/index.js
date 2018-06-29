import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
//import I18n from "redux-i18n";
import { ConnectedRouter } from "react-router-redux";
import store, { history } from "redux/configureStore";
import App from "components/App";
import './index.css';
//import { translations } from "translations";

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
        <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root")
);
