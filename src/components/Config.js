import { 
  BASE_URL_CLOUD,
  BASE_URL_LOCAL,
  FIREBASE_API_KEY, 
  FIREBASE_APP_ID, 
  FIREBASE_AUTH_DOMAIN, 
  FIREBASE_DATABASE_URL, 
  FIREBASE_PROJECT_ID, 
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID
} from 'react-native-dotenv';
//local
export default class Config {
  static baseURL = BASE_URL_LOCAL
  static apiKey = FIREBASE_API_KEY
  static authDomain = FIREBASE_AUTH_DOMAIN
  static databaseURL = FIREBASE_DATABASE_URL
  static projectId = FIREBASE_PROJECT_ID
  static storageBucket = FIREBASE_STORAGE_BUCKET
  static messagingSenderId = FIREBASE_MESSAGING_SENDER_ID
  static appId = FIREBASE_APP_ID
}