import React, { Component } from 'react';
import styles from './Modal.module.scss';
import { ModalSettings } from './Modal.types'

import ModalWrapper from './ModalWrapper';

interface ModalContentProps {
  modal: ModalSettings
}

class ModalContent extends Component<ModalContentProps> {

  render () {
    const { ChildComponent, handleProceed, handleClose, className, hideCancel, message, width, wrapper, title } = this.props.modal
    // console.log(handleProceed, handleClose)
    return (
      <div style={{width: width ? width : '25%'}} className={styles[className]}>
        {wrapper ?
          <ModalWrapper title={title} handleClose={handleClose}>
            <ChildComponent
              message={message}
              hideCancel={hideCancel}
              onSubmit={handleProceed}
              handleClose={handleClose}
              handleProceed={handleProceed}
              {...this.props.modal}
            />
          </ModalWrapper>
          :
          <ChildComponent
            message={message}
            hideCancel={hideCancel}
            onSubmit={handleProceed}
            handleClose={handleClose}
            handleProceed={handleProceed}
            {...this.props.modal}
          />
        }
      </div>
    )
  }
}

export default ModalContent

// <Button
//          handleClick={() => {
//            this.props.toggleModal({});
//            if (handleClose) handleClose();
//          }}
//          className={`close ${styles.circular}`} type='button' text='X' position='right'
//        />
