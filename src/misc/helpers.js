import axios from 'axios';
import {PhoneNumberUtil} from 'google-libphonenumber';
import {cloneDeep} from 'lodash';
import moment from 'moment';

const phoneUtil = PhoneNumberUtil.getInstance();
const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
const passwordRegex = /[^\w\d]*(([0-9]+.*[A-Z]+.*)|[A-Z]+.*([0-9]+.*))/;

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

export const sanitizeMobileNumber = async (
  mobile = '',
  countryCode,
  removeCode = true,
) => {
  let pN;
  if (mobile && mobile.length > 0) {
    pN = mobile;
    if (pN.indexOf(countryCode) > -1 && removeCode) {
      pN = pN.replace(countryCode, '0');
    }
    pN = pN.replace(/ /g, '');
  }
  return pN;
};

export const emailCheck = (
  email = '',
  setEmail = () => {},
  setError = () => {},
) => {
  const wrongEmailFormat = 'Please enter an proper email address';
  const noEmailAddress = 'Please fill in your email address';
  if (emailRegex && email && email.length > 0) {
    if (email.match(emailRegex)) setEmail(email);
    else setError(wrongEmailFormat);
  } else setError(noEmailAddress);
};

export const passwordCheck = (
  password = '',
  setPassword = () => {},
  setError = () => {},
) => {
  const wrongPassFormat =
    'Your password must have a number, capital letter and symbol';
  const noPassword = 'Please fill enter a password';
  const shortpassword = 'Your password is too short';
  if (passwordRegex && password && password.length > 0) {
    if (password.length < 8) setError(shortpassword);
    else if (password.match(passwordRegex)) setPassword(password);
    else setError(wrongPassFormat);
  } else setError(noPassword);
};

export const getDistance = (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 == lat2 && lon1 == lon2) {
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
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
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
