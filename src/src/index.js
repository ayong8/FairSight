import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
//import I18n from 'redux-i18n';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from 'redux/configureStore';
import App from 'components/App';

import 'bootstrap/dist/css/bootstrap.css';
import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import 'antd/dist/antd.css';
//import { translations } from 'translations';

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);
