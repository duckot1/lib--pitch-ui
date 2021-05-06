import React from 'react';
import styles from './Button.module.scss';

type HandleClick = (event) => void

interface CloseProps {
  color?: string;
  size?: string;
  onClick: HandleClick;
}

export const Close = (props: CloseProps) => {
  let color = "#3E3E3E"
  if (props.color) color = props.color;
  return (
    <div onClick={props.onClick} className={`${styles.close}`}>
      <svg className={styles[props.size]} viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <desc>Created with Sketch.</desc>
        <defs></defs>
        <g id="👨🏻‍💼-Activity-list" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g id="View-events-Coach-Tablet" transform="translate(-991.000000, -56.000000)" stroke={color} strokeWidth="2">
            <g id="Group" transform="translate(690.000000, 0.000000)">
              <g id="icon/close" transform="translate(301.000000, 56.000000)">
                <path d="M1,11 L11,1" id="icon/back"></path>
                <path d="M11,11 L1,1" id="Path-7"></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
