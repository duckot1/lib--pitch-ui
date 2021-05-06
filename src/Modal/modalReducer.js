import {
  TOGGLE_MODAL
} from './actionTypes'

export default function(state = {active: false, type: ''}, action) {
  switch (action.type) {
    case TOGGLE_MODAL:
      return action.payload;
    default:
      return state;
  }
}
