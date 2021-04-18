// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import Scroller from './Scroller';

export default {
    title: "Scroller",
    component: Scroller
};

export const Primary = () => {
    return (
      <div style={{height: '400px'}}>
        <Scroller scrollerClass={'form-scroller'}>
          <div style={{height: '1000px'}}>Hello everyone!!</div>
        </Scroller>
      </div>

    );
}
