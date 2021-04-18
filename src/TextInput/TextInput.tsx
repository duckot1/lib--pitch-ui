import React, { Component } from 'react';
import styles from  './TextInput.module.scss';

type OnChange = (e: any) => void

interface Input {
  value: string | number;
  name: string;
  onChange: OnChange;
}

interface Meta {
  touched: boolean;
  error: boolean;
  initial: any;
}

type SetLimits = (value: any) => any


interface TextInputProps {
  input: Input;
  meta?: Meta;
  type?: string;
  setLimits?: SetLimits;
  label?: string;
  small?: boolean;
  disabled?: boolean;
}

interface TextInputState {
  selected: boolean;
}

class TextInput extends Component<TextInputProps, TextInputState> {

  private input: React.RefObject<HTMLInputElement>;

  state: TextInputState = {
    selected: !!(this.props.input.value || this.props.input.value === 0)
  };

  constructor(props) {
    super(props);

    let selected = false;
    if (props.input.value || props.input.value === 0) selected = true;

    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.focus = this.focus.bind(this)

    this.input = React.createRef();
  }

  componentDidMount() {
    if (this.props.meta) {
      if (this.props.meta.initial || this.props.meta.initial === 0) {
        this.setState({
          selected: true
        });
      }
    }
  }

  handleFocus(e) {
    this.setState({
      selected: true
    })
  }

  handleBlur(e) {
    let { value, name } = e.target;
    if (!value) {
      this.setState({
        selected: false
      })
    }

    const { type, setLimits } = this.props
    if (type === 'number' && setLimits) {
      value = setLimits(value)
    }
  }

  focus() {
    if (!this.state.selected) {
      this.setState({
        selected: true
      });
      this.input.current.focus();
    }
  }

  render() {
    const { label, meta, type, input, small, disabled } = this.props
    return (
      <div>
        <div className={styles.inputContainer}>
          <input ref={this.input} onBlur={this.handleBlur} onFocus={!disabled && this.handleFocus} onChange={!disabled && input.onChange} name={input.name} value={input.value} className={`${meta && meta.touched && meta.error && styles.requiredInput} ${disabled && styles.disabled} ${small ? styles.smallTextInput : ''}`} type={type}/>
          <div onClick={this.focus} className={this.state.selected ? `${styles.dynamicLabel} ${styles.inputSelected}` : styles.dynamicLabel}>{label}</div>
          {(meta && meta.touched) && meta.error && <div className={styles.fieldAsterix}><span>*</span></div>}
        </div>

      </div>
    )
  }
}

export default TextInput;
