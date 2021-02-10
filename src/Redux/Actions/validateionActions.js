import {
  UPDATE_VALIDATION_CODE,
  UPDATE_NUMBER_SENT,
  UPDATE_CONFIRMATION_OBJECT,
  RESET_VALIDATION,
  UPDATE_MOBILE_NUMBER,
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
