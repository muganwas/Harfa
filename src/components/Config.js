
 
export default class Config {
  static BASEURL = process.env.BASEURL
  static apiKey = process.env.FIREBASE_API_KEY
  static authDomain = process.env.FIREBASE_AUTH_DOMAIN
  static databaseURL = process.env.FIREBASE_DATABASE_URL
  static projectId = process.env.FIREBASE_PROJECT_ID
  static storageBucket = process.env.FIREBASE_STORAGE_BUCKET
  static messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID
  static appId = process.env.FIREBASE_APP_ID
}