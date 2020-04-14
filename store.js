import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import generalReducer from './src/Redux/Reducers/generalReducer';
import notificationsReducer from './src/Redux/Reducers/notificationsReducer';
import messagesReducer from './src/Redux/Reducers/messagesReducer';
import jobsReducer from './src/Redux/Reducers/jobsReducer';

const rootReducer = combineReducers({
  generalInfo: generalReducer,
  notificationsInfo: notificationsReducer,
  messagesInfo: messagesReducer,
  jobsInfo: jobsReducer
});

const configureStore = () => {
  return createStore(rootReducer, applyMiddleware(thunk));
}

export default configureStore;