// @flow

import { EXAMPLE_REDUX_ACTION } from '../actions/example';

import type { Action } from 'redux';

type state = {
	payload: string,
};

const initialState: state = {
	payload: 'No messages yet... =(',
};

export default (state: state = initialState, action: Action) => {
	switch (action.type) {
		case EXAMPLE_REDUX_ACTION:
			const { payload } = action;

			state = {
				...state,
				payload,
			};

			break;
	}

	return state;
};
