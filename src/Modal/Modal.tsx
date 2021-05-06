import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from './modalActions';
import Portal from '../Portal/Portal';
import ModalOverlay from './Overlay';
import ModalContent from './ModalContent';
import { ModalSettings } from './Modal.types'
import styles from './Modal.module.scss';

type ToggleModal = (options: ModalSettings) => void

interface ModalProps {
  modal: ModalSettings;
  toggleModal: ToggleModal;
}

export class Modal extends Component<ModalProps> {

  getModal(type) {
    const { modal, toggleModal } = this.props

    const handleClose = () => {
      toggleModal({})
    }

    if (!modal.handleClose) {
      modal.handleClose = handleClose
    }

    return (
      <div className={styles.modalContainer}>
        <ModalContent modal={modal}/>
      </div>
    );
  }

  render() {
    const { modal } = this.props
    return (
      <div>
        <ModalOverlay
          active={modal.active}
        />
        <div>
          <Portal>
            {modal.active && this.getModal(modal.type)}
          </Portal>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    modal: state.modal
  }
}

export default connect(mapStateToProps, actions)(Modal);
