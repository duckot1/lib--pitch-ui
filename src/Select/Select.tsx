import React, { Component } from 'react';
import * as styles from './Select.module.scss';
import animation from '../assets/js/animations';

import Scroller from '../Scroller/Scroller'

interface Option {
  name: string;
  value: string | number;
}

type SelectOption = (value: string | number) => void

interface OptionProps {
  option: Option;
  selectOption: SelectOption;
}

const Option = (props: OptionProps) => {
  const { name, value } = props.option
  return (
    <div onClick={() => {props.selectOption(value)}} className={"option"}>
      <p>{name}</p>
    </div>
  )
}

interface DropdownProps {
  expanded: boolean;
  options: Option[];
  selectOption: SelectOption;
}

interface DropdownState {
  scroller: boolean;
  contentsId: string;
  scrollerId: string;
}

class Dropdown extends Component<DropdownProps, DropdownState> {

  private contents: React.RefObject<HTMLInputElement>
  private dropdown: React.RefObject<HTMLInputElement>

  constructor(props) {
    super(props)

    var id = function () {
      return '_' + Math.random().toString(36).substr(2, 9)
    }

    this.state = {
      scroller: false,
      contentsId: id(),
      scrollerId: id()
    }

    this.contents = React.createRef()
    this.dropdown = React.createRef()
  }

  componentDidUpdate(prevProps) {
    let { expanded } = this.props
    const { scrollerId, contentsId } = this.state

    let contents       = document.getElementById(contentsId),
      dropdown       = this.dropdown.current,
      scroller       = document.getElementById(scrollerId),
      sectionHeight = 0
    if (contents) {
      sectionHeight  = contents.scrollHeight
    }

    if (sectionHeight > 165) {
      sectionHeight = 165
    } else if (scroller) {
      scroller.style.display = 'none';
    }
    if (!prevProps.expanded && expanded) {
      dropdown.style.border = '#95A5A6 1px solid'

      // Check if off page
      if (dropdown.getBoundingClientRect().y + sectionHeight > window.innerHeight) {
        dropdown.style.bottom = '0'
        animation.expandDropdownUp(dropdown, sectionHeight)
      } else {
        dropdown.style.top = '0'
        animation.expandDropdownDown(dropdown, sectionHeight)
      }
      // animation.expandDropdownUp(dropdown, sectionHeight)
    } else if (prevProps.expanded && !expanded) {
      dropdown.style.border = 'none'
      animation.collapseDropdown(dropdown)
    }
  }

  render() {
    const { options } = this.props
    const { contentsId, scrollerId } = this.state
    return(
      <div className="main-drop">
        <div ref={this.dropdown} className="dropdown-container">
          <Scroller scrollerId={scrollerId} scrollerClass="select-scroller">
            <div id={contentsId} className="select-dropdown">
              {options.map((option, index) => <Option {...this.props} key={index} option={option} />)}
            </div>
          </Scroller>
        </div>
      </div>
    )
  }
}

interface Input {
  name: string;
  value: string | number;
}

type UpdateValue = (name: string, value: string | number) => void

interface SelectProps {
  input: Input;
  updateValue: UpdateValue;
  options: Option[];
  label?: string;
  className?: string;
}

interface SelectState {
  expanded: boolean;
  selected?: boolean;
}

class Select extends Component<SelectProps, SelectState> {

  private dropdown: React.RefObject<HTMLInputElement>;

  constructor(props) {
    super(props);

    let selected = false;
    if (props.input.value) selected = true;

    this.state = {
      expanded: false,
      selected
    }

    this.dropdown = React.createRef();
  }

  selectOption = (value) => {
    this.props.updateValue(this.props.input.name, value);
    let newState = {expanded: false}
    this.setState(newState)
  }

  handleFocus = (e) => {
    this.setState({
      selected: true,
      expanded: true
    })
  }

  handleBlur = () => {
    const { value } = this.props.input;
    let newState: SelectState = {expanded: false}
    if ((!value || value !== 0)) newState.selected = false;
    this.setState(newState)
  }

  toggleDropdown = () => {
    const { expanded } = this.state,
      { value } = this.props.input;
    let newState: SelectState = {expanded: !expanded}
    if ((!value || value !== 0) && expanded) {
      newState.selected = false;
    } else {
      newState.selected = true;
    }
    this.setState(newState)
  }

  render() {
    let { options, input, label, className } = this.props,
      { expanded } = this.state;
    let selectedOption = options.find(option => option.value === input.value)

    return (
      <div>
        <div tabIndex={0} onBlur={this.handleBlur} className={`select-container ${className} ${styles[className]}`}>
          <div onClick={this.toggleDropdown} style={{position: 'relative'}} className={input.value ? `value ${styles.newInputContainer}` : `value unselected ${styles.newInputContainer}`}>
            <div className={this.state.selected || (input.value || input.value === 0) ? `${styles.dynamicLabel} ${styles.inputSelected}` : styles.dynamicLabel}>{label}</div>
            {(input.value || input.value === 0) && <div className={`${styles.dynamicLabel} select-value`}>{selectedOption.name}</div>}
          </div>
          <div onClick={this.toggleDropdown} className="dropdown-symbol">
            <svg width="6px" height="5px" viewBox="0 0 6 5" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
              <defs></defs>
              <g id="Symbols" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="📱/Dropdown/Simple-+-Label" transform="translate(-185.000000, -36.000000)">
                  <image id="icon" transform="translate(188.000000, 38.000000) scale(-1, 1) rotate(-90.000000) translate(-188.000000, -38.000000) " x="184" y="34" width="8" height="8" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABGdBTUEAA1teXP8meAAAAlZJREFUeAHt3TFOw1AQhOFAwXWgpUeIAgrug0TLmTgUDQVQwXPxpGjkvDib8YgoP5KVbJzdFd+QhMKIzYYvBBBAAAEEEEAAAQQQQAABBFYSeGhzX1aazdg9Avft/Fc7ftvxtue5nDYLbONPARCCGXg0bg6fEEZixnMjfEIwQs+Nmj5w+3t+x951ywfznOARjy35ye9h/LQ9j0fsolUEwBeQZAl+Ult2gS8gyRL8pLbsAl9AkiX4SW3ZBb6AJEvwk9qyC3wBSZbgJ7VlF/gCkizBT2rLLvAFJFmCn9SWXeALSLIEP6ktu8AXkGQJflJbdoEvIMkS/KS27AJfQJIl+Elt2QW+gCRL8JPasgt8AUmW4Ce1ZRf4ApIswU9qyy7wBSRZ3rVlSy8Rn543XVLOl0ngts35bEe/DHx0yyXiJvQ+5qbd+QC/c4xvL8enI2cvIlvObMmhb0FPZ+YT+Xb5EI4wj5cc+msor4SxZ+ksIZTYvE2E4PUsTSOEEpu3iRC8nqVphFBi8zYRgtezNI0QSmzeJkLwepamEUKJzdtECF7P0jRCKLF5mwjB61maRgglNm8TIXg9S9MIocTmbSIEr2dpGiGU2LxNhOD1LE0jhBKbt4kQvJ6laYRQYvM2EYLXszSNEEps3iZC8HqWphFCic3bRAhez9I0QiixeZsIwetZmnZSIfyHP9AoKQ+a3tu553Z8D57TT121O9e94NYrsOSV8OpdyTQVGIUAvmqtVM+FAP5K2LvGbocA/i6llR/nn3muDMx4BBBAAAEEEEAAAQQQQOAkBP4AJH0mEFWhNxMAAAAASUVORK5CYII="></image>
                </g>
              </g>
            </svg>
          </div>
          <Dropdown expanded={expanded} selectOption={this.selectOption} options={options} />
        </div>

      </div>
    )
  }
}

export default Select;
