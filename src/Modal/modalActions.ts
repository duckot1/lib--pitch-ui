import { TOGGLE_MODAL } from './actionTypes';

import { ModalSettings } from './Modal.types'

export type ToggleModal = (modal: ModalSettings) => {type: typeof TOGGLE_MODAL, payload: ModalSettings}

export const toggleModal:ToggleModal = (modal) => {
  return {
    type: TOGGLE_MODAL,
    payload: modal
  }
}
