// @flow

export const EXAMPLE_REDUX_ACTION = 'EXAMPLE_REDUX_ACTION';

import type { Dispatch } from 'redux';

export const exampleAction = (message: string) => (dispatch: Dispatch) =>
	dispatch({
		type: EXAMPLE_REDUX_ACTION,
		payload: message,
	});
