import messaging from '@react-native-firebase/messaging';
import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';
import Axios from 'axios';
import {GoogleSignin, statusCodes} from '@react-native-community/google-signin';
import firebaseAuth from '@react-native-firebase/auth';
import rNES from 'react-native-encrypted-storage';
import SimpleToast from 'react-native-simple-toast';
import axios from 'axios';
import {cloneDeep} from 'lodash';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import Config from '../components/Config';
import {
  emailCheck,
  passwordCheck,
  sanitizeMobileNumber,
  phoneNumberCheck,
} from '../misc/helpers';

const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const USER_GET_PROFILE = Config.baseURL + 'users/';
const storageRef = storage().ref('/users_info');

export const checkForUserType = async navigate =>
  await rNES.getItem('userType').then(result => {
    if (!result) navigate('AfterSplash');
  });

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
          SimpleToast.show('Something went wrong, please try again.');
        }
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const checkValidation = async (
  email,
  password,
  setErrorMessage,
  callback,
) => {
  const emailMsg = await emailCheck(email);
  const passwordMsg = await passwordCheck(password);
  if (emailMsg === true && passwordMsg === true) {
    typeof callback === 'function' && callback();
    return;
  }
  if (emailMsg && emailMsg !== true) {
    setErrorMessage(emailMsg);
    return;
  }
  if (passwordMsg && passwordMsg !== true) {
    setErrorMessage(passwordMsg);
    return;
  }
};

export const getUserType = async (
  onMessagingEnabled = () => {},
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
        onError();
      }
    })
    .catch(error => {
      onError(error);
    });
};

export const googleLoginTask = async (
  setStateVars = (firebaseId, loginType) => {},
  callback = (name, email, image, loginType) => {},
) => {
  try {
    await GoogleSignin.hasPlayServices();
    var result = await GoogleSignin.signIn();
    const {
      user: {name, email, photo, id},
    } = result;
    setStateVars(id, 'google');
    callback(name, email, photo, 'google');
  } catch (error) {
    console.log('Google signin error', e.message);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      SimpleToast.show('You cancelled sign in.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      SimpleToast.show('Sign in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      SimpleToast.show(
        'You need to install play services to use this sign in method.',
      );
    } else {
      SimpleToast.show('Something went wrong, please try again.');
    }
  }
};

export const responseFbCallback = (
  error,
  result,
  setStateVars,
  callback = (name, email, imageURL, loginType) => {},
) => {
  if (!error) {
    const {
      id,
      name,
      email,
      picture: {
        data: {url},
      },
    } = result;
    setStateVars(id, 'facebook');
    callback(name, email, url, 'facebook');
  }
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
            .then(() => {
              inhouseLogin(userId, userType, fcmToken);
            })
            .catch(error => {
              SimpleToast.show(
                'Something went wrong, try closing and reopening app',
              );
              console.log('firebase auth error', error);
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

export const inhouseLogin = ({
  userId,
  userType,
  fcmToken,
  onLoginFailure,
  fetchPendingJobInfo,
  fetchJobRequestHistory,
  updateAppUserDetails,
  props,
}) => {
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  const provider = userType === 'Provider';
  const fetchProfileUrl = provider ? PRO_GET_PROFILE : USER_GET_PROFILE;
  try {
    fetch(fetchProfileUrl + userId + '?fcm_id=' + fcmToken, {
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
          let data = provider
            ? {
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
              }
            : {
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
          updateAppUserDetails(data);
          fetchJobRequestHistory(userId);
          fetchPendingJobInfo(props, userId, home);
        } else onLoginFailure(responseJson.message);
      })
      .catch(error => {
        const message =
          error.message && error.message.indexOf('Network') > -1
            ? 'Check your internet connection and try again'
            : 'Something went wrong, try again later';
        onLoginFailure(message);
        console.log('login error - 1', error.message);
      });
  } catch (e) {
    const message =
      error.message && error.message.indexOf('Network') > -1
        ? 'Check your internet connection and try again'
        : 'Something went wrong, try again later';
    onLoginFailure(message);
    console.log('login error - 2', e);
  }
};

export const facebookLoginTask = async (updateAuthToken, responseCallback) => {
  LoginManager.logInWithPermissions(['public_profile', 'email']).then(
    result => {
      if (result.isCancelled) {
        console.log('Login cancelled');
      } else {
        AccessToken.getCurrentAccessToken()
          .then(data => {
            updateAuthToken(data.accessToken);
            const infoRequest = new GraphRequest(
              '/me?fields=email,name,picture',
              null,
              responseCallback,
            );
            // Start the graph request.
            new GraphRequestManager().addRequest(infoRequest).start();
          })
          .catch(e => {
            SimpleToast.show('Something went wrong, try again later');
            console.log('token access error', e);
          });
      }
    },
    error => {
      SimpleToast.show('Something went wrong, try again later');
      console.log('Login fail with error: ' + error);
    },
  );
};

export const fbGmailLoginTask = async ({
  name,
  email,
  image,
  userType,
  firebaseId,
  accountType,
  loginType,
  updateAppUserDetails,
  fetchAppUserJobRequests,
  fetchJobRequestHistory,
  onError,
  toggleLoading,
  registerUrl,
  fetchProfileUrl,
  props,
}) => {
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  const userTypeName = userType === 'Provider' ? 'Provider' : 'User';
  const provider = userType === 'Provider';
  toggleLoading();
  const fcmToken = await messaging().getToken();
  if (fcmToken) {
    const userData = {
      account_type: accountType,
      username: name,
      email,
      image,
      mobile: '',
      dob: '',
      fcm_id: fcmToken,
      type: loginType,
    };
    try {
      Axios.post(registerUrl, {data: JSON.stringify(userData)})
        .then(async responseJson => {
          if (responseJson.status === 200 && responseJson.data.createdDate) {
            const id = responseJson.data.id;
            const onlineStatus = await synchroniseOnlineStatus(
              id,
              responseJson.data.online,
            );
            try {
              const id = responseJson.data.id;
              fetch(fetchProfileUrl + id + '?fcm_id=' + fcmToken, {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
              })
                .then(response => response.json())
                .then(async response => {
                  toggleLoading();
                  if (response && response.result) {
                    const data = provider
                      ? {
                          providerId: response.data.id,
                          name: response.data.username,
                          email: response.data.email,
                          password: response.data.password,
                          imageSource: response.data.image,
                          surname: response.data.surname,
                          mobile: response.data.mobile,
                          services: response.data.services,
                          description: response.data.description,
                          address: response.data.address,
                          lat: response.data.lat,
                          lang: response.data.lang,
                          invoice: response.data.invoice,
                          firebaseId,
                          online: onlineStatus,
                          status: response.data.status,
                          fcmId: response.data.fcm_id,
                          accountType: responseJson.data.account_type,
                        }
                      : {
                          userId: response.data.id,
                          accountType: response.data.acc_type,
                          email: response.data.email,
                          password: response.data.password,
                          username: response.data.username,
                          image: response.data.image,
                          mobile: response.data.mobile,
                          dob: response.data.dob,
                          address: response.data.address,
                          lat: response.data.lat,
                          online: onlineStatus,
                          lang: response.data.lang,
                          firebaseId,
                          fcmId: response.data.fcm_id,
                        };
                    updateAppUserDetails(data);
                    //Store data like sharedPreference
                    rNES.setItem('userId', id);
                    rNES.setItem('userType', userTypeName);
                    rNES.setItem('email', data.email);
                    rNES.setItem('firebaseId', firebaseId);
                    fetchJobRequestHistory(id);
                    fetchAppUserJobRequests(props, id, home);
                  } else {
                    const data = provider
                      ? {
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
                          online: onlineStatus,
                          status: responseJson.data.status,
                          fcmId: responseJson.data.fcm_id,
                          accountType: responseJson.data.account_type,
                          firebaseId,
                        }
                      : {
                          userId: responseJson.data.id,
                          accountType: responseJson.data.acc_type,
                          email: responseJson.data.email,
                          password: responseJson.data.password,
                          username: responseJson.data.username,
                          image: responseJson.data.image,
                          mobile: responseJson.data.mobile,
                          dob: responseJson.data.dob,
                          address: responseJson.data.address,
                          online: onlineStatus,
                          lat: responseJson.data.lat,
                          lang: responseJson.data.lang,
                          fcmId: responseJson.data.fcm_id,
                          firebaseId,
                        };
                    updateAppUserDetails(data);
                    //Store data like sharedPreference
                    rNES.setItem('userId', id);
                    rNES.setItem('userType', userTypeName);
                    rNES.setItem('email', data.email);
                    rNES.setItem('firebaseId', firebaseId);
                    fetchJobRequestHistory(id);
                    fetchAppUserJobRequests(props, id, home);
                  }
                })
                .catch(error => {
                  console.log('profile fetch error --', error);
                  onError(error.message);
                });
            } catch (e) {
              console.log('reg error --', e);
              onError(e.message);
            }
          } else {
            const message =
              responseJson.message === 'Email not found'
                ? "You're not registered, register then login"
                : responseJson.data?.message?.indexOf('deactivated') > -1
                ? 'Your account is currently innactive, contact admin'
                : responseJson.message
                ? responseJson.message
                : 'Something went wrong, please try again later';
            onError(message);
          }
        })
        .catch(error => {
          console.log('fbgmail login err --', error);
          onError(
            error.message || 'Something went wrong, please try again later.',
          );
        })
        .done();
    } catch (e) {
      console.log('fbgmail login err --', e);
      onError('Something went wrong, please try again later.');
    }
  } else {
    onError(
      'Your device has no fcm token, check your internet connection and try again.',
    );
  }
};

export const authenticateTask = async ({
  email,
  password,
  userType,
  authURL,
  fetchAppUserJobRequests,
  updateAppUserDetails,
  fetchJobRequestHistory,
  toggleLoading,
  onError,
  props,
}) => {
  toggleLoading();
  const fcmToken = await messaging().getToken();
  const provider = userType === 'Provider';
  const home = userType === 'Provider' ? 'ProHome' : 'Home';
  if (fcmToken) {
    firebaseAuth()
      .signInWithEmailAndPassword(email, password)
      .then(result => {
        const {user} = result;
        if (user && typeof user === 'object') {
          const {
            _user: {uid},
          } = user;
          const data = {
            email,
            password,
            loginType: 'Firebase',
            fcm_id: fcmToken,
          };
          try {
            fetch(authURL, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
              .then(response => response.json())
              .then(async responseJson => {
                if (responseJson && responseJson.result) {
                  const onlineStatus = await synchroniseOnlineStatus(
                    responseJson.data.id,
                    responseJson.data.online,
                  );
                  toggleLoading();
                  const id = responseJson.data.id;
                  const data = provider
                    ? {
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
                        online: onlineStatus,
                        status: responseJson.data.status,
                        fcmId: responseJson.data.fcm_id,
                        accountType: responseJson.data.account_type,
                        firebaseId: uid,
                      }
                    : {
                        userId: responseJson.data.id,
                        accountType: responseJson.data.acc_type,
                        email: responseJson.data.email,
                        password: responseJson.data.password,
                        username: responseJson.data.username,
                        image: responseJson.data.image,
                        mobile: responseJson.data.mobile,
                        dob: responseJson.data.dob,
                        online: onlineStatus,
                        address: responseJson.data.address,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        fcmId: responseJson.data.fcm_id,
                        firebaseId: uid,
                      };
                  updateAppUserDetails(data);
                  //Store data like sharedPreference
                  rNES.setItem('userId', id);
                  rNES.setItem('userType', userType);
                  const auth = {
                    email,
                    password,
                  };
                  rNES.setItem('auth', JSON.stringify(auth));
                  rNES.setItem('firebaseId', uid);
                  fetchJobRequestHistory(id);
                  fetchAppUserJobRequests(props, id, home);
                } else {
                  onError(responseJson.message);
                }
              })
              .catch(error => {
                console.log('Error :' + error);
                onError('Something went wrong, please try again later.');
              })
              .done();
          } catch (e) {
            console.log('Error :' + e);
            onError('Something went wrong, please try again.');
          }
        } else {
          onError('Something went wrong, please try again later.');
        }
      })
      .catch(error => {
        toggleLoading();
        if (error.code === 'auth/user-not-found') {
          onError("You've not registered yet, please register first");
        } else if (error.code === 'auth/wrong-password') {
          onError('You entered a wrong password!');
        } else {
          onError('Something went wrong, please try again later.');
        }
      });
  } else {
    onError(
      'Your device has no fcm token, check your internet connection and try again.',
    );
  }
};

export const forgotPasswordTask = async ({
  email,
  toggleLoading,
  forgotPasswordURL,
  onSuccess,
  onError,
}) => {
  toggleLoading();
  try {
    const data = {
      email,
    };
    await fetch(forgotPasswordURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.result) {
          const msg =
            responseJson.message ||
            'Check you registered email address for further instructions.';
          onSuccess(msg);
        } else {
          const msg =
            responseJson.message || 'Something went wrong, please try again';
          onError(msg);
        }
      })
      .catch(error => {
        const errorMsg = error.message;
        const basicMsg = 'Something went wrong, Try again later';
        let msg;
        if (errorMsg && errorMsg.indexOf('Network') > -1) {
          msg = 'Please check your internet connection and try again.';
        }
        if (!msg) {
          msg = basicMsg;
        }
        onError(msg);
        console.log('reset 1 err', errorMsg);
      })
      .done();
  } catch (e) {
    const errorMsg = e.message;
    const basicMsg = 'Something went wrong, Try again later';
    let msg;
    if (errorMsg && errorMsg.indexOf('Network') > -1) {
      msg = 'Please check your internet connection and try again.';
    }
    if (!msg) {
      msg = basicMsg;
    }
    onError(msg);
    console.log('reset 2 err', errorMsg);
  }
};

export const updateProfileImageTask = async ({
  userId,
  imageObject,
  firebaseId,
  userDetails,
  updateUserDetails,
  toggleIsLoading,
  updateURL,
}) => {
  toggleIsLoading(true);
  const {fileName, path} = imageObject;
  const userDataRef = storageRef.child(`/${firebaseId}/${fileName}`);
  userDataRef
    .putFile(path)
    .then(uploadRes => {
      const {state} = uploadRes;
      if (state === 'success') {
        userDataRef.getDownloadURL().then(urlResult => {
          axios
            .post(updateURL + userId, {
              type: imageObject.type,
              uri: urlResult,
              name: imageObject.fileName,
            })
            .then(async res => {
              let newUserDetails = cloneDeep(userDetails);
              /** cater for different names for user and client */
              newUserDetails.image = newUserDetails.imageSource = urlResult;
              await updateUserDetails(newUserDetails);
              toggleIsLoading(false);
              if (res && res.data.result) {
                SimpleToast.show(res.data.message);
              }
            })
            .catch(error => {
              console.log('Error :' + error);
              toggleIsLoading(false);
              SimpleToast.show('Something went wrong, try again later');
            });
        });
      } else {
        SimpleToast.show('Upload failed, try again please.');
      }
    })
    .catch(error => {
      console.log('image upload error', error.messge);
      SimpleToast.show('Something went wrong, try again later.');
    });
};

export const updateProfileInfo = async ({
  userId,
  fcmId,
  userData,
  fetchUserProfile,
  updateURL,
  onSuccess,
  toggleIsLoading,
}) => {
  try {
    await fetch(updateURL + userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then(response => response.json())
      .then(response => {
        if (response.result) {
          onSuccess(userData);
          SimpleToast.show(response.message);
          fetchUserProfile(userId, fcmId);
        } else {
          toggleIsLoading(false);
          SimpleToast.show(response.message);
        }
      })
      .catch(error => {
        console.log('profile update error :' + error);
        toggleIsLoading(false);
        SimpleToast.show('Something went wrong, try again later.');
      })
      .done();
  } catch (e) {
    console.log('profile update erroror :' + e);
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, try again later.');
  }
};

export const phoneLoginTask = async ({
  userType,
  accountType,
  loginType,
  firebaseId,
  fetchJobRequests,
  fetchJobRequestHistory,
  validationInfo,
  updateUserDetails,
  toggleIsLoading,
  registerURL,
  getProfileURL,
  onError,
  props,
}) => {
  toggleIsLoading(true);
  const fcmToken = await messaging().getToken();
  const Home = userType === 'Provider' ? 'ProHome' : 'Home';
  if (fcmToken) {
    try {
      const {mobile, countryCode} = validationInfo;
      const newMobile = await sanitizeMobileNumber(mobile, countryCode, false);
      const userData = {
        acc_type: accountType,
        username: newMobile,
        mobile: newMobile,
        fcm_id: fcmToken,
        type: loginType,
      };
      Axios.post(registerURL, {data: JSON.stringify(userData)})
        .then(async responseJson => {
          if (responseJson.status === 200 && responseJson.data.createdDate) {
            const id = responseJson.data.id;
            const onlineStatus = await synchroniseOnlineStatus(
              id,
              responseJson.data.online,
            );
            try {
              /** get stored profile if exists */
              fetch(getProfileURL + id + '?fcm_id=' + fcmToken, {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
              })
                .then(response => response.json())
                .then(async response => {
                  toggleIsLoading(false);
                  if (response && response.result) {
                    const data =
                      userType === 'Provider'
                        ? {
                            providerId: response.data.id,
                            name: response.data.username,
                            email: response.data.email,
                            password: response.data.password,
                            imageSource: response.data.image,
                            surname: response.data.surname,
                            mobile: response.data.mobile,
                            services: response.data.services,
                            description: response.data.description,
                            address: response.data.address,
                            lat: response.data.lat,
                            lang: response.data.lang,
                            invoice: response.data.invoice,
                            online: onlineStatus,
                            firebaseId,
                            status: response.data.status,
                            fcmId: response.data.fcm_id,
                            accountType: response.data.account_type,
                          }
                        : {
                            userId: response.data.id,
                            accountType: response.data.acc_type,
                            email: response.data.email,
                            password: response.data.password,
                            username: response.data.username,
                            image: response.data.image,
                            mobile: response.data.mobile,
                            dob: response.data.dob,
                            address: response.data.address,
                            online: onlineStatus,
                            lat: response.data.lat,
                            lang: response.data.lang,
                            firebaseId,
                            fcmId: response.data.fcm_id,
                          };
                    updateUserDetails(data);
                    //Store data like sharedPreference
                    rNES.setItem('userId', id);
                    rNES.setItem('userType', userType);
                    rNES.setItem('email', data.email);
                    rNES.setItem('firebaseId', firebaseId);
                    //Check if any Ongoing Request
                    fetchJobRequestHistory(id);
                    fetchJobRequests(props, id, Home);
                  } else {
                    const data =
                      userType === 'Provider'
                        ? {
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
                            online: onlineStatus,
                            invoice: responseJson.data.invoice,
                            status: responseJson.data.status,
                            fcmId: responseJson.data.fcm_id,
                            accountType: responseJson.data.account_type,
                            firebaseId,
                          }
                        : {
                            userId: responseJson.data.id,
                            accountType: responseJson.data.acc_type,
                            email: responseJson.data.email,
                            password: responseJson.data.password,
                            username: responseJson.data.username,
                            image: responseJson.data.image,
                            mobile: responseJson.data.mobile,
                            dob: responseJson.data.dob,
                            online: onlineStatus,
                            address: responseJson.data.address,
                            lat: responseJson.data.lat,
                            lang: responseJson.data.lang,
                            fcmId: responseJson.data.fcm_id,
                            firebaseId: this.state.firebaseId,
                          };
                    updateUserDetails(data);
                    //Store data like sharedPreference
                    rNES.setItem('userId', id);
                    rNES.setItem('userType', userType);
                    rNES.setItem('email', data.email);
                    rNES.setItem('firebaseId', firebaseId);
                    fetchJobRequestHistory(id);
                    fetchJobRequests(props, id, Home);
                  }
                })
                .catch(error => {
                  console.log('Phone auth err - 1 ', error);
                  toggleIsLoading(false);
                  SimpleToast.show('Something went wrong', SimpleToast.SHORT);
                });
            } catch (e) {
              console.log('Phone auth err - 2 ', e);
              toggleIsLoading(false);
              SimpleToast.show(
                'Something went wrong, try again',
                SimpleToast.SHORT,
              );
            }
          } else {
            onError(responseJson.data.message || 'Something went wrong');
          }
        })
        .catch(error => {
          console.log('Phone auth err - 3 ', error);
          onError('Something went wrong');
        })
        .done();
    } catch (e) {
      console.log('Phone auth err - 4 ', e);
      onError('Something went wrong, try again.');
    }
  } else {
    toggleIsLoading(false);
    SimpleToast.show(
      'Something went wrong, we could not retrieve your fcm token, restart app and try again',
      SimpleToast.SHORT,
    );
  }
};
