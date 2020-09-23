import {
    FETCHING_MESSAGES,
    FETCHED_MESSAGES,
    FETCHING_MESSAGES_ERROR,
    FETCHED_DB_MESSAGES
} from '../types';

export const startFetchingMessages = payload => {
    return {
      type: FETCHING_MESSAGES,
      payload
    }
}

export const messagesFetched = payload => {
    return {
      type: FETCHED_MESSAGES,
      payload
    }
}

export const dbMessagesFetched = payload => {
  return {
    type: FETCHED_DB_MESSAGES,
    payload
  }
}

export const messagesError = payload => {
    return {
      type: FETCHING_MESSAGES_ERROR,
      payload
    }
}