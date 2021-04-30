import database from '@react-native-firebase/database';
import {
  UPDATE_VALIDATION_CODE,
  UPDATE_NUMBER_SENT,
  UPDATE_CONFIRMATION_OBJECT,
  RESET_VALIDATION,
  UPDATE_MOBILE_NUMBER,
  UPDATE_COUNTRY_CODE,
  UPDATE_COUNTRY_ALPHA_2,
} from '../types';

export const updateValidationCode = payload => {
  return {
    type: UPDATE_VALIDATION_CODE,
    payload,
  };
};

export const updateMobileNumber = payload => {
  return {
    type: UPDATE_MOBILE_NUMBER,
    payload,
  };
};

export const updateCountryCode = payload => {
  return {
    type: UPDATE_COUNTRY_CODE,
    payload,
  };
};

export const updateCountryAlpha2 = payload => {
  return {
    type: UPDATE_COUNTRY_ALPHA_2,
    payload,
  };
};

export const updateNumberSent = payload => {
  return {
    type: UPDATE_NUMBER_SENT,
    payload,
  };
};

export const updateConfirmationObject = payload => {
  return {
    type: UPDATE_CONFIRMATION_OBJECT,
    payload,
  };
};

export const resetValidateon = () => {
  return {
    type: RESET_VALIDATION,
  };
};

export const fetchCountryCodes = () => {
  return dispatch => {
    const countryCodeRef = database().ref('constants/countryCode');
    const countryAlpha2Ref = database().ref('constants/countryAlpha2');
    try {
      countryCodeRef
        .once('value')
        .then(code => {
          dispatch(updateCountryCode(code.val()));
        })
        .catch(e => {
          console.log(e?.code, e?.message);
        });
    } catch (e) {
      console.log('fetch country code err ', e);
    }
    try {
      countryAlpha2Ref
        .once('value')
        .then(code => {
          dispatch(updateCountryAlpha2(code.val()));
        })
        .catch(e => {
          console.log(e?.code, e?.message);
        });
    } catch (e) {
      console.log('fetch country alpha ', e);
    }
  };
};
