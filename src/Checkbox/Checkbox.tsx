import React, {Component} from 'react';
import { Motion, spring } from 'react-motion';

// import styles from '../forms.scss';

type OnClicked = (value: boolean) => void

interface Input {
  value: boolean;
}

interface Meta {
  touched: boolean;
  error: boolean;
  initial: any;
}

interface CheckboxProps {
  checked: boolean;
  onClicked: OnClicked;
  input: Input;
  meta?: Meta;
  size?: string;
  label?: string;
}

class Checkbox extends Component<CheckboxProps> {

  handleClick() {
    let { checked, input } = this.props

    if (checked === undefined) {
      checked = input.value
    }

    this.props.onClicked(!checked)
  }

  render() {
    let { size, checked, input } = this.props
    let containerStyle = {
      margin: size === 'small' ? '0' : '10px 0'
    }
    let checkboxStyle = {
      width: size === 'small' ? '15px' : '17px',
      height: size === 'small' ? '15px' : '17px'
    }

    if (checked === undefined) {
      checked = input.value
    }
    return (
      <div style={containerStyle} className="checkbox-container">
        <div style={checkboxStyle} className="checkbox" onClick={this.handleClick.bind(this)}>
          <svg width="15px" height="13px" viewBox="0 0 15 14" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <desc>Created with Sketch.</desc>
            <defs></defs>
            <g id="Symbols" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g id="selected" transform="translate(-4.000000, -5.000000)" fillRule="nonzero">
                {checked && <polyline style={{strokeDashoffset: `${0}`, strokeDasharray: `100%` , opacity: `${1}` }}  id="tick" stroke="#F64645" strokeWidth="3" points="6.5,13.5 9.5,16.5 16.5,8.5 " strokeLinejoin="round" strokeLinecap="round"/>}
              </g>
            </g>
          </svg>
          {/* <Motion
            defaultStyles={[{tick: 0, opacity: 0}]}
            style={{
              tick: spring(!this.state.checked ? this.state.tickLength : 0),
              opacity: spring(!this.state.checked ? 0 : 1)
          }}>
            {({tick, opacity}) => {
              return (


              )
            }}
          </Motion> */}
        </div>
        {this.props.label &&
        <div className="checkbox-label-container">
          <p>{this.props.label}</p>
          {this.props.meta && this.props.meta.touched && this.props.meta.error && <p className="checkbox-error">*</p>}
        </div>
        }
      </div>
    );
  }
};

export default Checkbox;
