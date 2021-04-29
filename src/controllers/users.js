import messaging from '@react-native-firebase/messaging';
import firebaseAuth from '@react-native-firebase/auth';
import rNES from 'react-native-encrypted-storage';
import SimpleToast from 'react-native-simple-toast';
import database from '@react-native-firebase/database';
import Config from '../components/Config';

const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const USER_GET_PROFILE = Config.baseURL + 'users/';

export const getFCMToken = async (
  userId = '',
  onSuccess = () => {},
  onError = () => {},
) => {
  messaging()
    .getToken()
    .then(async fcmToken => {
      if (fcmToken) {
        try {
          const userType = await rNES.getItem('userType');
          onSuccess(userId, userType, fcmToken);
        } catch (e) {
          SimpleToast('Something went wrong, try again.');
        }
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const getUserType = async (
  onMessagingEnabled = () => {},
  onMessagingDisabled = () => {},
  onError = () => {},
) => {
  messaging()
    .requestPermission()
    .then(authStatus => {
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        onMessagingEnabled();
      } else {
        onMessagingDisabled();
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const autoLogin = async (
  {userId, userType, fcmToken},
  setLoading,
  inhouseLogin,
  goTo,
) => {
  if (userId !== null) {
    setLoading();
    rNES
      .getItem('auth')
      .then(storedInfo => {
        if (storedInfo) {
          const {email, password} = JSON.parse(storedInfo);
          firebaseAuth()
            .signInWithEmailAndPassword(email, password)
            .then(res => {
              inhouseLogin(userId, userType, fcmToken);
            })
            .catch(error => {
              SimpleToast.show(
                'Something went wrong, try closing and reopening app',
              );
            });
        } else inhouseLogin(userId, userType, fcmToken);
      })
      .catch(e => {
        console.log('storage error', e);
      });
  } else {
    console.log('No Logged User');
    goTo('AfterSplash');
  }
};

export const synchroniseOnlineStatus = async (id, savedStatus) => {
  let status = savedStatus;
  const usersRef = database().ref(`users/${id}`);
  await usersRef.once('value', snapshot => {
    const value = snapshot.val();
    if (value) status = value.status;
    else {
      usersRef
        .set({status})
        .then(() => {
          console.log('status set');
        })
        .catch(e => {
          console.log(e.message);
        });
    }
  });
  return status;
};

export const inhouseLogin = (
  {userId, userType, fcmToken, props},
  onLoginFailure,
  stopLoading,
) => {
  const {
    fetchPendingJobProviderInfo,
    fetchJobRequestHistoryPro,
    fetchJobRequestHistoryClient,
    fetchPendingJobRequest,
    updateProviderDetails,
    updateUserDetails,
  } = props;
  if (userType === 'Provider') {
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
          let onlineStatus;
          if (responseJson && responseJson.result) {
            const id = responseJson.data.id;
            onlineStatus = await synchroniseOnlineStatus(
              id,
              responseJson.data.online,
            );
            let providerData = {
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
              online: onlineStatus,
              status: responseJson.data.status,
              fcmId: responseJson.data.fcm_id,
              accountType: responseJson.data.account_type,
            };
            updateProviderDetails(providerData);
            fetchJobRequestHistoryPro(userId);
            fetchPendingJobProviderInfo(props, userId, 'ProHome');
          } else onLoginFailure();
        })
        .catch(error => {
          stopLoading();
          SimpleToast('Something went wrong, try again later');
          console.log('login error', error);
        });
    } catch (e) {
      stopLoading();
      SimpleToast('Something went wrong, try again later');
      console.log('login error', e);
    }
  } else if (userType === 'User') {
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
          let onlineStatus;
          if (responseJson && responseJson.result) {
            const id = responseJson.data.id;
            onlineStatus = await synchroniseOnlineStatus(
              id,
              responseJson.data.online,
            );
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
              online: onlineStatus,
              lang: responseJson.data.lang,
              firebaseId: responseJson.data.id,
              fcmId: responseJson.data.fcm_id,
            };

            updateUserDetails(userData);
            //Check if any Ongoing Request
            fetchJobRequestHistoryClient(userId);
            fetchPendingJobRequest(props, userId, 'Home');
          } else onLoginFailure();
        })
        .catch(error => {
          stopLoading();
          SimpleToast('Something went wrong, try again later');
          console.log('login error', error);
        });
    } catch (e) {
      stopLoading();
      SimpleToast('Something went wrong, try again later');
      console.log('login error', e);
    }
  }
};
