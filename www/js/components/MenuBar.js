import {Component} from 'react';

class MenuBar extends Component {
	render() {
		return <h1>{this.props.title}</h1>;
	}
}

MenuBar.defaultProps = {
	title: 'Defualt Title',
};

export default MenuBar;
