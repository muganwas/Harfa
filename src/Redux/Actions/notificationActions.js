import {
    FETCHING_NOTIFICATIONS,
    FETCHED_NOTIFICATIONS,
    FETCHING_NOTIFICATIONS_ERROR
} from '../types';

export const startFetchingNotification = () => {
    return {
      type: FETCHING_NOTIFICATIONS
    }
}

export const notificationsFetched = payload => {
    return {
      type: FETCHED_NOTIFICATIONS,
      payload
    }
}

export const notificationError = payload => {
    return {
      type: FETCHING_NOTIFICATIONS_ERROR,
      payload
    }
  }