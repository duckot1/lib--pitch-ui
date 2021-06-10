import React from 'react'

import styles from './Modal.module.scss'

import { Close } from '../Button/Close'

export default (props) => {

  return (
    <React.Fragment>
      <div className={styles.wrapperHeader}>
        <h3>{props.title}</h3>
        <Close onClick={props.handleClose} size="medium"/>
      </div>
      <div className={styles.wrapperContent}>
        {props.children}
      </div>
    </React.Fragment>
  )
}
