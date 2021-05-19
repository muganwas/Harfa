import {
  FETCHED_MESSAGES,
  FETCHED_DB_MESSAGES,
  FETCHING_MESSAGES,
  FETCHING_MESSAGES_ERROR,
  UPDATE_LATEST_CHATS,
  SET_LATEST_CHATS_ERROR,
} from '../types';

const initialState = {
  dataChatSource: {},
  latestChats: [],
  messages: {},
  fetchedLatestChats: false,
  latestChatsError: false,
  fetched: false,
  fetching: false,
  error: null,
};

const messagesReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCHING_MESSAGES:
      return {
        ...state,
        feching: true,
        fetched: false,
        error: null,
      };
    case FETCHED_MESSAGES:
      return {
        ...state,
        dataChatSource: action.payload,
        fetched: true,
        fetching: false,
        error: null,
      };
    case FETCHED_DB_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        error: null,
        fetched: true,
        fetching: false,
      };
    case FETCHING_MESSAGES_ERROR:
      return {
        ...state,
        error: action.payload,
        fetched: false,
        fetching: false,
      };
    case UPDATE_LATEST_CHATS:
      return {
        ...state,
        latestChats: action.payload,
        fetchedLatestChats: true,
        latestChatsError: false,
      };
    case UPDATE_LATEST_CHATS:
      return {
        ...state,
        latestChats: action.payload,
        fetchedLatestChats: true,
        latestChatsError: false,
      };
    case SET_LATEST_CHATS_ERROR:
      return {
        fetchedLatestChats: false,
        latestChatsError: true,
      };
    default:
      return {
        ...state,
      };
  }
};

export default messagesReducer;
