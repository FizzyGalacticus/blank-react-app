// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { exampleAction } from './lib/redux/actions/example';

type Props = {
	message: string,
};

type State = {
	count: number,
};

class App extends Component<Props, State> {
	constructor(props) {
		super(props);

		this.state = {
			count: 0,
		};

		this.count = this.count.bind(this);
	}

	componentDidMount() {
		this.count();
	}

	count() {
		this.setState({ count: this.state.count + 1 }, () => {
			this.props.dispatch(exampleAction(`The current count is: ${this.state.count}`));

			setTimeout(() => {
				this.count();
			}, 1000);
		});
	}

	render() {
		return <div>{this.props.message}</div>;
	}
}

export default connect(store => {
	const {
		exampleReducer: { payload },
	} = store;

	return { message: payload };
})(App);
