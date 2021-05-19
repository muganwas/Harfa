import {
  FETCHING_NOTIFICATIONS,
  FETCHED_NOTIFICATIONS,
  FETCHING_NOTIFICATIONS_ERROR,
  UPDATE_NOTIFICATIONS,
} from '../types';

export const startFetchingNotification = payload => {
  return {
    type: FETCHING_NOTIFICATIONS,
    payload,
  };
};

export const updateNotifications = payload => {
  return {
    type: UPDATE_NOTIFICATIONS,
    payload,
  };
};

export const notificationsFetched = payload => {
  return {
    type: FETCHED_NOTIFICATIONS,
    payload,
  };
};

export const notificationError = payload => {
  return {
    type: FETCHING_NOTIFICATIONS_ERROR,
    payload,
  };
};
