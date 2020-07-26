import {
    UPDATE_PROVIDER_DETAILS,
    UPDATE_USER_DETAILS
} from '../types';

export const updateProviderDetails = payload => {
    return {
        type: UPDATE_PROVIDER_DETAILS,
        payload
    }
}

export const updateUserDetails = payload => {
    return {
        type: UPDATE_USER_DETAILS,
        payload
    }
}