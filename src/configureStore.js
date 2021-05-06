import { createStore, applyMiddleware, combineReducers } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'

import modalReducer from './Modal/modalReducer'



const configureStore = () => createStore(combineReducers({

  /* API REDUCERS */

  // Hardware
  modal: modalReducer,
}), composeWithDevTools(
  applyMiddleware(),
))

export default configureStore