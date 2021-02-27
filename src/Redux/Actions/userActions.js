import database from '@react-native-firebase/database';
import Config from '../../../src/components/Config';
import {
  UPDATE_PROVIDER_DETAILS,
  UPDATE_USER_DETAILS,
  UPDATE_NEW_USER_INFO,
  RESET_USER_DETAILS,
  UPDATE_USER_AUTH_TOKEN,
  UPDATE_PROVIDER_AUTH_TOKEN,
} from '../types';

const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const USER_GET_PROFILE = Config.baseURL + 'users/';

export const updateProviderDetails = payload => {
  return {
    type: UPDATE_PROVIDER_DETAILS,
    payload,
  };
};

export const updateNewUserInfo = payload => {
  return {
    type: UPDATE_NEW_USER_INFO,
    payload,
  };
};

export const updateUserDetails = payload => {
  return {
    type: UPDATE_USER_DETAILS,
    payload,
  };
};

export const resetUserDetails = () => {
  return {
    type: RESET_USER_DETAILS,
  };
};

export const updateUserAuthToken = payload => {
  return {
    type: UPDATE_USER_AUTH_TOKEN,
    payload,
  };
};

export const updateProviderAuthToken = payload => {
  return {
    type: UPDATE_PROVIDER_AUTH_TOKEN,
    payload,
  };
};

export const fetchProviderProfile = (userId, fcmToken) => {
  return dispatch => {
    try {
      fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(async responseJson => {
          let status;
          if (responseJson && responseJson.result) {
            const id = responseJson.data.id;
            const usersRef = database().ref(`users/${id}`);
            await usersRef.once('value', snapshot => {
              const value = snapshot.val();
              if (value) status = value.status;
              else {
                usersRef
                  .set({status: responseJson.data.status})
                  .then(() => {
                    console.log('status set');
                  })
                  .catch(e => {
                    console.log(e.message);
                  });
              }
            });
            var providerData = {
              providerId: responseJson.data.id,
              name: responseJson.data.username,
              email: responseJson.data.email,
              password: responseJson.data.password,
              imageSource: responseJson.data.image,
              surname: responseJson.data.surname,
              mobile: responseJson.data.mobile,
              services: responseJson.data.services,
              description: responseJson.data.description,
              address: responseJson.data.address,
              lat: responseJson.data.lat,
              lang: responseJson.data.lang,
              invoice: responseJson.data.invoice,
              firebaseId: responseJson.data.id,
              status: status != undefined ? status : responseJson.data.status,
              fcmId: responseJson.data.fcm_id,
              accountType: responseJson.data.account_type,
            };
            dispatch(updateProviderDetails(providerData));
          }
        })
        .catch(error => {
          console.log('pro profile fetch error', error);
        });
    } catch (e) {
      console.log('pro profile fetch error', e);
    }
  };
};

export const fetchUserProfile = (userId, fcmToken) => {
  return dispatch => {
    try {
      fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(async responseJson => {
          if (responseJson && responseJson.result) {
            let userData = {
              userId: responseJson.data.id,
              accountType: responseJson.data.acc_type,
              email: responseJson.data.email,
              password: responseJson.data.password,
              username: responseJson.data.username,
              image: responseJson.data.image,
              mobile: responseJson.data.mobile,
              dob: responseJson.data.dob,
              address: responseJson.data.address,
              lat: responseJson.data.lat,
              lang: responseJson.data.lang,
              firebaseId: responseJson.data.id,
              fcmId: responseJson.data.fcm_id,
            };
            const id = responseJson.data.id;
            const usersRef = database().ref(`users/${id}`);
            await usersRef.once('value', snapshot => {
              const value = snapshot.val();
              if (value) status = value.status;
              else {
                usersRef
                  .set({status: responseJson.data.status})
                  .then(() => {
                    console.log('status set');
                  })
                  .catch(e => {
                    console.log(e.message);
                  });
              }
            });
            dispatch(updateUserDetails(userData));
          }
        })
        .catch(error => {
          console.log('user profile fetch error --', error);
        });
    } catch (e) {
      console.log('user profile fetch error --', e);
    }
  };
};
