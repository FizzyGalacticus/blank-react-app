import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import store from './lib/redux/store';

import App from './App';

const app = document.getElementById('app');

ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	app
);
