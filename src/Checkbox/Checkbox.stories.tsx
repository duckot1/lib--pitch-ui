// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import Checkbox from './Checkbox';

export default {
    title: "Checkbox",
    component: Checkbox
};

export const Primary = () => {
    const [value, setValue] = useState(false)
    return (
      <Checkbox
        input={{value}}
        label='Select (click me!)'
        onClicked={(value) => setValue(value)}
        checked={value}
      />
    );
}
