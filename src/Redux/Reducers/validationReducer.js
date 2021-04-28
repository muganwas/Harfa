import {
  UPDATE_VALIDATION_CODE,
  UPDATE_NUMBER_SENT,
  UPDATE_CONFIRMATION_OBJECT,
  RESET_VALIDATION,
  UPDATE_MOBILE_NUMBER,
  UPDATE_COUNTRY_CODE,
  UPDATE_COUNTRY_ALPHA_2,
} from '../types';
import Config from '../../components/Config';

const initialState = {
  validationCode: '',
  mobile: '',
  countryCode: Config.defaultCCode,
  countryAlpha2: Config.defaultAlpha2,
  numberSent: false,
  confirmation: null,
};

const validationReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_VALIDATION_CODE:
      return {
        ...state,
        validationCode: action.payload,
      };
    case UPDATE_NUMBER_SENT:
      return {
        ...state,
        numberSent: action.payload,
      };
    case UPDATE_MOBILE_NUMBER:
      return {
        ...state,
        mobile: action.payload,
      };
    case UPDATE_CONFIRMATION_OBJECT:
      return {
        ...state,
        confirmation: action.payload,
      };
    case UPDATE_COUNTRY_CODE:
      return {
        ...state,
        countryCode: action.payload,
      };
    case UPDATE_COUNTRY_ALPHA_2:
      return {
        ...state,
        countryAlpha2: action.payload,
      };
    case RESET_VALIDATION:
      return {
        validationCode: '',
        numberSent: false,
        confirmation: null,
        countryCode: Config.defaultCCode,
        countryAlpha2: Config.defaultAlpha2,
      };
    default:
      return {
        ...state,
      };
  }
};

export default validationReducer;
