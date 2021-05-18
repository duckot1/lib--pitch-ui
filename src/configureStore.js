import { createStore, combineReducers } from 'redux'

import modalReducer from './Modal/modalReducer'



const configureStore = () => createStore(combineReducers({

  /* API REDUCERS */

  // Hardware
  modal: modalReducer,
}), ['Use redux'])

export default configureStore