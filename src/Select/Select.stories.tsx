// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import Select from './Select';

export default {
    title: "Select",
    component: Select
};

export const Primary = () => {
    const [value, setValue] = useState(0)

    const options = [
        {name: "Tom", value: 0},
        {name: "Steve", value: 1}
    ]

    const updateValue = (name, value) => {
        setValue(value)
    }

    return (
      <div style={{height: '200px'}}>
          <Select
            input={{name: 'Name', value}}
            options={options}
            // label='Select something...'
            updateValue={updateValue}
          />
      </div>
    );
}
