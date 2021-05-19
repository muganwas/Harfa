import {
  UPDATE_PROVIDER_DETAILS,
  UPDATE_USER_DETAILS,
  RESET_USER_DETAILS,
  UPDATE_NEW_USER_INFO,
  UPDATE_USER_AUTH_TOKEN,
  UPDATE_PROVIDER_AUTH_TOKEN,
} from '../types';

const initialState = {
  newUser: {},
  userDetails: {
    userId: '',
    accountType: '',
    email: '',
    password: '',
    username: '',
    image: '',
    mobile: '',
    dob: '',
    address: '',
    online: '',
    lat: 0,
    lang: 0,
    fcmId: '',
    firebaseId: '',
    authToken: null,
  },
  providerDetails: {
    providerId: '',
    name: '',
    email: '',
    password: '',
    imageSource: '',
    surname: '',
    mobile: '',
    services: [],
    description: '',
    address: '',
    lat: 0,
    lang: 0,
    invoice: '',
    online: '',
    status: '',
    fcmId: '',
    accountType: '',
    firebaseId: '',
    authToken: null,
  },
  providerDetailsFetched: false,
  userDetailsFetched: false,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_PROVIDER_DETAILS:
      return {
        ...state,
        providerDetails: action.payload,
        providerDetailsFetched: true,
      };
    case UPDATE_USER_DETAILS:
      return {
        ...state,
        userDetails: action.payload,
        userDetailsFetched: true,
      };
    case UPDATE_PROVIDER_AUTH_TOKEN:
      return {
        ...state,
        providerDetails: {...state.providerDetails, authToken: action.payload},
      };
    case UPDATE_USER_AUTH_TOKEN:
      return {
        ...state,
        userDetails: {...state.userDetails, authToken: action.payload},
      };
    case RESET_USER_DETAILS:
      return {
        newUser: {},
        userDetails: {
          userId: '',
          accountType: '',
          email: '',
          password: '',
          username: '',
          image: '',
          mobile: '',
          dob: '',
          address: '',
          online: '',
          lat: 0,
          lang: 0,
          fcmId: '',
          firebaseId: '',
          authToken: null,
        },
        providerDetails: {
          providerId: '',
          name: '',
          email: '',
          password: '',
          imageSource: '',
          surname: '',
          mobile: '',
          services: [],
          description: '',
          address: '',
          online: '',
          lat: 0,
          lang: 0,
          invoice: '',
          status: '',
          fcmId: '',
          accountType: '',
          firebaseId: '',
          authToken: null,
        },
        providerDetailsFetched: false,
        userDetailsFetched: false,
      };
    case UPDATE_NEW_USER_INFO:
      return {
        ...state,
        newUser: action.payload,
      };
    default:
      return {
        ...state,
      };
  }
};

export default userReducer;
