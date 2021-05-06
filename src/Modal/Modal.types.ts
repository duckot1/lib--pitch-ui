import {JSXElementConstructor} from "react";

export interface ModalSettings {
  handleProceed?: HandleProceed;
  handleClose?: HandleClose;
  active?: boolean;
  type?: string;
  ChildComponent?: JSXElementConstructor<any>;
  className?: string;
  hideCancel?: boolean;
  message?: string;
  width?: string;
  wrapper?: boolean;
  title?: string;
}

type HandleProceed = (...args: any[]) => void
type HandleClose = (...args: any[]) => void
