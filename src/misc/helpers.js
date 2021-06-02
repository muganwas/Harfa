import axios from 'axios';
import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Polyline from '@mapbox/polyline';
import messaging from '@react-native-firebase/messaging';
import {exitApp} from 'react-native-exit-app';
import {MAPS_API_KEY} from 'react-native-dotenv';
import {PhoneNumberUtil} from 'google-libphonenumber';
import ImagePicker from 'react-native-image-picker';
import {cloneDeep} from 'lodash';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';

const phoneUtil = PhoneNumberUtil.getInstance();
const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
const passwordRegex = /[^\w\d]*(([0-9]+.*[A-Z]+.*)|[A-Z]+.*([0-9]+.*))/;

export const locationPermissionRequest = async (action = () => {}) => {
  try {
    if (Platform.OS === 'ios') Geolocation.requestAuthorization();
    else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        action();
      } else {
        SimpleToast.show('You have denied location permission');
        exitApp();
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export const returnCoordDetails = async ({lat = '', lng = ''}) => {
  let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
  let msg = {};
  lat &&
    lng &&
    (await fetch(url)
      .then(resp => resp.json())
      .then(resp => {
        if (resp.status.toLowerCase() === 'ok')
          msg = {
            address: resp?.results[0]?.formatted_address,
            msg: 'ok',
          };
        else msg = {msg: 'error'};
      })
      .catch(e => {
        console.log('address error ', e);
        msg = {msg: 'error'};
      }));
  return msg;
};

export const phoneNumberCheck = async (phoneNumber, countryLetterCode) => {
  if (phoneNumber && phoneNumber.length > 0) {
    try {
      const number = phoneUtil.parseAndKeepRawInput(
        phoneNumber,
        countryLetterCode,
      );
      const isValid = phoneUtil.isValidNumber(number);
      return isValid;
    } catch (e) {
      return false;
    }
  } else return false;
};

export const checkNoficationsAvailability = async () => {
  if (Platform.OS === 'android') {
    try {
      const authStatus = await messaging().requestPermission();
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          messaging()
            .getInitialNotification()
            .then(remoteMessage => {
              if (remoteMessage) {
                console.log(
                  'Notification caused app to open from quit state:',
                  remoteMessage.notification,
                );
                //setInitialRoute(remoteMessage.data.type);
              }
            });
        } else {
          try {
            await messaging().requestPermission();
            console.log('FCM permission granted');
          } catch (error) {
            console.log('FCM Permission Error', error);
            SimpleToast.show(
              "FCM Permission Error, you can't receive notifications",
            );
          }
        }
      } else {
        console.log('FCM Token not available');
        SimpleToast.show(
          "FCM Token not available, you can't receive notifications",
        );
      }
    } catch (e) {
      console.log('Error initializing FCM', e);
      SimpleToast.show(
        "Error initializing FCM, you can't receive notifications",
      );
    }
  }
};

export const sanitizeMobileNumber = async (
  mobile = '',
  countryCode,
  removeCode = true,
) => {
  let pN;
  if (mobile && mobile.length > 0) {
    pN = mobile;
    if (pN.indexOf(countryCode) > -1 && removeCode) {
      pN = pN.replace(countryCode, '');
    } else if (String(pN[0]) === '0') {
      pN = pN.slice(pN[1], pN.length);
    }
    pN = pN.replace(/ /g, '');
  }
  return pN;
};

export const emailCheck = async (email = '', setEmail, setError) => {
  const wrongEmailFormat = 'Please enter a proper email address';
  const noEmailAddress = 'Please fill in your email address';
  if (email) {
    if (email.match(emailRegex)) {
      if (setEmail && typeof setEmail === 'function') {
        setEmail(email);
        return;
      } else {
        return true;
      }
    } else {
      if (setError && typeof setError === 'function') {
        setError(wrongEmailFormat);
        return;
      } else return wrongEmailFormat;
    }
  } else {
    if (setError && typeof setError === 'function') {
      setError(noEmailAddress);
      return;
    } else return noEmailAddress;
  }
};

export const passwordCheck = async (password = '', setPassword, setError) => {
  const wrongPassFormat =
    'Your password must have a number, and capital letter';
  const noPassword = 'Please fill enter a password';
  const shortpassword = 'Your password is too short';
  if (password) {
    if (password.length < 8) {
      if (setError && typeof setError === 'function') {
        setError(shortpassword);
        return;
      } else return shortpassword;
    } else if (password.length >= 8 && password.match(passwordRegex)) {
      if (setPassword && typeof setPassword === 'function') {
        setPassword(password);
        return;
      } else return true;
    } else {
      if (setError && typeof setError === 'function') {
        setError(wrongPassFormat);
        return;
      } else return wrongPassFormat;
    }
  } else {
    if (setError && typeof setError === 'function') {
      setError(noPassword);
      return;
    } else return noPassword;
  }
};

export const getDistance = (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') {
      dist = dist * 1.609344;
    }
    if (unit === 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }
};

export const chatDate = timestamp => {
  let result = '';
  if (timestamp)
    result = moment(timestamp)
      .local()
      .format('DD-MM. HH:mm');
  return result;
};

export const sortByTime = (array, ascending = true) => {
  let messages = cloneDeep(array);
  if (ascending)
    messages.sort((a, b) => {
      return parseFloat(a.time) - parseFloat(b.time);
    });
  else
    messages.sort(function(a, b) {
      return parseFloat(b.time) - parseFloat(a.time);
    });
  return messages;
};

export const imageExists = async image_url => {
  let result;
  if (image_url)
    await axios
      .get(image_url)
      .then(res => {
        result = true;
      })
      .catch(e => {
        //console.log(e.message);
        result = false;
      });
  else result = false;
  return result;
};

export const selectPhoto = async callback => {
  const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1,
  };
  ImagePicker.showImagePicker(options, response => {
    if (response.didCancel) {
      SimpleToast.show('You cancelled image selection', SimpleToast.SHORT);
    } else if (response.error) {
      SimpleToast.show('Something went wrong, try again.');
    } else {
      const source = {uri: response.uri};
      callback({
        imageURI: source,
        imageDataObject: response,
        error: '',
      });
    }
  });
};

export const getDirections = async ({startLoc, destinationLoc, onSuccess}) => {
  if (startLoc && destinationLoc) {
    try {
      fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${MAPS_API_KEY}`,
      )
        .then(resp => resp.json())
        .then(async respJson => {
          if (respJson && respJson.routes[0]) {
            const points = Polyline.decode(
              respJson.routes[0].overview_polyline.points,
            );
            let coords = await points.map((point, index) => {
              return {
                latitude: point[0],
                longitude: point[1],
              };
            });
            onSuccess(coords);
          }
        });
    } catch (error) {
      console.log('get loc error', error);
      SimpleToast.show('Something went wrong, try again later.');
    }
  } else {
    SimpleToast.show(
      'Destination co-ordinates missing, try later',
      SimpleToast.LONG,
    );
  }
};
