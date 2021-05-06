import React from 'react'

import styles from './Modal.module.scss'

import { Close } from '../Button/Close'

export default (props) => {

  return (
    <div>
      <div className={styles.wrapperHeader}>
        <h3>{props.title}</h3>
        <Close onClick={props.handleClose} size="medium"/>
      </div>
      {props.children}
    </div>
  )
}
