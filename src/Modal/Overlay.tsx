import React, { Component } from 'react';
import * as actions from './modalActions';
import { connect } from 'react-redux';
import styles from './Modal.module.scss';
import animations from '../assets/js/animations';

interface ModalOverlayProps {
  active: boolean;
  toggleModal: actions.ToggleModal;
}

interface ModalOverlayState {
  overlay: boolean;
}

class ModalOverlay extends Component<ModalOverlayProps, ModalOverlayState> {

  private overlay: React.RefObject<HTMLInputElement>;

  constructor(props) {
    super(props);

    this.overlay = React.createRef();

    this.state = {
      overlay: false
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { active } = this.props
    if (!prevProps.active && active) {
      this.setState({overlay: true}, () => {
        animations.showModalOverlay(this.overlay.current)
      })
    } else if (prevProps.active && !active) {
      animations.hideModalOverlay(this.overlay.current, () => {
        this.setState({overlay: false})
      })

    }
  }

  render() {

    const { overlay } = this.state
    const { active } = this.props
    console.log(overlay, active)
    return (
      <div>
        {overlay &&
          <div ref={this.overlay} onClick={() => this.props.toggleModal({})} className={styles.overlay} />
        }
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    modal: state.modal
  }
}

export default connect(mapStateToProps, actions)(ModalOverlay);
