import React, { Component } from 'react';

import _ from 'lodash'

import styles from './Scroller.module.scss';

interface ScrollerProps {
  children: JSX.Element;
  padding?: string;
  border?: boolean;
  scrollerId?: string;
  scrollerClass?: string;
}

let borderStyle = {
  borderBottom: '1px solid #e3e3e3',
  // borderTop: '1px solid #e3e3e3'
}

class Scroller extends Component<ScrollerProps> {

  private inner: React.RefObject<HTMLInputElement>;
  private container: React.RefObject<HTMLInputElement>;
  private scroller: React.RefObject<HTMLInputElement>;

  static defaultProps = {
    scrollerClass: 'form-scroller'
  }

  constructor(props) {
    super(props);

    this.inner      = React.createRef();
    this.container  = React.createRef();
    this.scroller   = React.createRef();
  }

  componentDidMount() {
    let containerHeight    = this.container.current.getBoundingClientRect().height,
      innerHeight        = this.inner.current.getBoundingClientRect().height;
    if (innerHeight <= containerHeight) {
      this.scroller.current.style.display = 'none'
    }
  }

  scrollBar(e) {
    this.updateScrollPosition(e.target, this.inner.current, this.scroller.current);
  }

  renderChildren() {
    return React.cloneElement(this.props.children, {
      ref: this.inner
    })
  }

  updateScrollPosition(container, inner, scroller) {
    let containerTop       = container.getBoundingClientRect().top,
      containerHeight    = container.getBoundingClientRect().height,
      innerTop           = inner.getBoundingClientRect().top,
      innerHeight        = inner.getBoundingClientRect().height,
      innerRelativeTop   = containerTop - innerTop,
      scrollerHeight     = scroller.getBoundingClientRect().height,
      scrollOffset       = (containerHeight - scrollerHeight) / containerHeight,
      scrollBarHeight    = containerHeight * (innerRelativeTop / (innerHeight - containerHeight));
    this.scroller.current.style.top = `${scrollBarHeight * scrollOffset}px`
  }

  render() {
    const { padding, border, scrollerClass, scrollerId } = this.props
    return(
      <div style={border ? borderStyle : {}} className={styles.scrollerContainer}>
        <div style={{padding: padding ? padding : 0}} onScroll={this.scrollBar.bind(this)} ref={this.container}>
          {this.renderChildren()}
        </div>
        <div id={scrollerId} ref={this.scroller} className={scrollerClass}>
        </div>
      </div>
    )
  }
}

export default Scroller;
