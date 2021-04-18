// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import TextInput from './TextInput';

export default {
    title: "TextInput",
    component: TextInput
};

export const Primary = () => {
    const [value, setValue] = useState('')
    return (
      <TextInput
        input={{value, name: 'Random', onChange: (e) => setValue(e.target.value)}}
        label='Text Input'
      />
    );
}
