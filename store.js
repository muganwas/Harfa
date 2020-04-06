import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import generalReducer from './src/Redux/Reducers/generalReducer';
import notifications from './src/Redux/Reducers/notificationsReducer';
import messages from './src/Redux/Reducers/messagesReducer';

applyMiddleware(thunk);
const rootReducer = combineReducers({
  generalInfo: generalReducer,
  notificationsInfo: notifications,
  messages: messages
});

const configureStore = () => {
  return createStore(rootReducer);
}

export default configureStore;