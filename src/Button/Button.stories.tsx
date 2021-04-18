// @ts-ignore
import React, { useState, useEffect } from "react";
import '../index.scss'
import { Button } from './Button';

export default {
    title: "Button",
    component: Button
};

export const Primary = () => {
    return (
      <Button
        // Table props
        disabled={false}
        className={'btn--primary'}
        // type={'submit'}
        handleClick={() => console.log('click')}
      >Hello</Button>
    );
}

export const Long = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'btn--long'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

export const Medium = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'btn--medium'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

export const Thin = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'btn--thin'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

export const Border = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'btn--border'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

export const Link = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'link'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

export const Plain = () => {
  return (
    <Button
      // Table props
      disabled={false}
      className={'btn--plain'}
      // type={'submit'}
      handleClick={() => console.log('click')}
    >Hello</Button>
  );
}

