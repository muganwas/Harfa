import io from 'socket.io-client';
import {
  BASE_URL_CLOUD,
  BASE_URL_LOCAL,
  WEB_CLIENT_ID,
  BASE_URL_LOCAL_ALT,
  BASE_URL_LOCAL_ALT_1,
  BASE_URL_LOCAL_ALT_2,
  COUNTRY_CODE,
  COUNTRY_PHONE_CODE,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
} from 'react-native-dotenv';
//local --
export default class Config {
  static clientId = WEB_CLIENT_ID;
  static baseURL = BASE_URL_CLOUD;
  static countryCode = COUNTRY_CODE;
  static countryPhoneCode = COUNTRY_PHONE_CODE;
  static apiKey = FIREBASE_API_KEY;
  static authDomain = FIREBASE_AUTH_DOMAIN;
  static databaseURL = FIREBASE_DATABASE_URL;
  static projectId = FIREBASE_PROJECT_ID;
  static storageBucket = FIREBASE_STORAGE_BUCKET;
  static messagingSenderId = FIREBASE_MESSAGING_SENDER_ID;
  static appId = FIREBASE_APP_ID;
  static socket = io(this.baseURL, {
    autoConnect: false,
    transports: ['websocket'],
  });
}
