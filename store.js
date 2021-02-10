import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import generalReducer from './src/Redux/Reducers/generalReducer';
import notificationsReducer from './src/Redux/Reducers/notificationsReducer';
import messagesReducer from './src/Redux/Reducers/messagesReducer';
import jobsReducer from './src/Redux/Reducers/jobsReducer';
import userReducer from './src/Redux/Reducers/userReducer';
import validationReducer from './src/Redux/Reducers/validationReducer';

const rootReducer = combineReducers({
  generalInfo: generalReducer,
  notificationsInfo: notificationsReducer,
  messagesInfo: messagesReducer,
  jobsInfo: jobsReducer,
  userInfo: userReducer,
  validationInfo: validationReducer,
});

const configureStore = () => {
  return createStore(rootReducer, applyMiddleware(thunk, logger));
};

export default configureStore;
