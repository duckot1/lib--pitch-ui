import React, { Component } from 'react';
import ReactDOM from 'react-dom';
// import { store } from '../../index';
import { Provider } from 'react-redux';
import styles from './Portal.scss'

interface PortalProps {
  store?: {}
}

class Portal extends Component<PortalProps> {

  portal = null

  componentDidMount() {
    this.portal = document.createElement('div');
    this.portal.className = styles.portal;
    document.body.prepend(this.portal);
    this._render();
  }

  componentDidUpdate() {
    this._render();
  }

  componentWillUnmount () {
    ReactDOM.unmountComponentAtNode(this.portal);
    document.body.removeChild(this.portal);
  }

  _render() {
    const { store, children } = this.props
    // ReactDOM.render(
    //   <Provider store={store}>
    //     <div>{this.props.children}</div>
    //   </Provider>,
    //   this.portal
    // );
    ReactDOM.render(
      <div>{children}</div>,
      this.portal
    );
  }

  render() {
    return (
      <noscript />
    );
  }

}

export default Portal;
