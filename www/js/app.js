import React from 'react';
import ReactDOM from 'react-dom';
import MenuBar from 'components/MenuBar';

class Layout extends React.Component {
	render() {
		return (
			<div>
				<MenuBar title="Blank React App"></MenuBar>
				<div>{this.props.message}</div>
			</div>
		);
	}
}

const app = document.getElementById('app');

ReactDOM.render(<Layout message="Hello world from ReactJS!" />, app);