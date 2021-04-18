import React, { Component } from 'react'

import styles from './Button.module.scss'

type HandleClick = (event) => void

interface ButtonProps {
  handleClick: HandleClick;
  disabled?: boolean;
  className: string;
  type?: string;
}

export class Button extends Component<ButtonProps> {
  constructor(props) {
    super(props)
  }

  onPress:React.MouseEventHandler<HTMLButtonElement> = (event) => {
    const {disabled, handleClick} = this.props;
    if (!disabled && handleClick) {
      handleClick(event)
    }
  }

  render () {
    const { disabled, children, className, type } = this.props;
    return (
        <button
            type={type === 'submit' ? type : 'button'}
            className={disabled ? `btn--disabled ${className} button` : `${className} button`}
            onClick={this.onPress}
        >
          {children}
        </button>
    );
  }
}

