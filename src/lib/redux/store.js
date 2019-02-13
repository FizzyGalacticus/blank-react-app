import { applyMiddleware, createStore } from 'redux';

import thunk from 'redux-thunk';
import logger from 'redux-logger';

import reducers from './reducers';

const production = process.env.NODE_ENV === 'production';

const middlewares = [thunk];

if (!production) {
	middlewares.push(logger);
}

const middleware = applyMiddleware(...middlewares);

const store = createStore(reducers, middleware);

export const dispatch = store.dispatch;

export const getState = store.getState;

export default store;
