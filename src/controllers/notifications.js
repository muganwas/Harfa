import SimpleToast from 'react-native-simple-toast';
import {cloneDeep} from 'lodash';
import {imageExists} from '../misc/helpers';

export const getAllNotifications = async ({
  userId,
  userType,
  toggleIsLoading,
  onSuccess,
  onError,
  notificationsURL,
}) => {
  toggleIsLoading(true);
  try {
    await fetch(notificationsURL + userId)
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.result) {
          let dataSource = cloneDeep(responseJson.data);
          if (userType === 'Provider') {
            dataSource?.map((item, i) => {
              imageExists(item.customer_details.image).then(res => {
                dataSource[i].customer_details.imageAvailable = res;
              });
            });
          } else {
            dataSource?.map((item, i) => {
              imageExists(item.employee_details.image).then(res => {
                dataSource[i].employee_details.imageAvailable = res;
              });
            });
          }
          onSuccess(dataSource);
        } else {
          onError();
        }
      })
      .catch(error => {
        console.log('Get all notifications error', error);
        onError();
        SimpleToast.show(
          'An error has occurred, check your internet connection!',
        );
      });
  } catch (e) {
    console.log('Get all notifications error', e);
    onError();
    SimpleToast.show('An error has occurred, try again.');
  }
};

export const deleteNotification = async ({
  userId,
  deleteNotificationURL,
  dataSource,
  onSuccess,
}) => {
  let altDataSource = cloneDeep(dataSource);
  try {
    await fetch(deleteNotificationURL + userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson) {
          const {
            data: {_id},
          } = responseJson;
          dataSource.map((notification, index) => {
            if (_id === notification._id) altDataSource.splice(index, 1);
          });
          onSuccess(altDataSource);
        }
      })
      .catch(e => {
        console.log('notification del err', e);
        SimpleToast.show(
          "Notification couldn't be deleted, try again later",
          SimpleToast.SHORT,
        );
      });
  } catch (e) {
    console.log('notification del err', e);
    SimpleToast.show(
      "Notification couldn't be deleted, try again later",
      SimpleToast.SHORT,
    );
  }
};

export const readNotification = async ({
  userId,
  dataSource,
  onSuccess,
  readNotificationURL,
}) => {
  let altDataSource = cloneDeep(dataSource);
  try {
    await fetch(readNotificationURL + userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson) {
          const {
            data: {_id, status},
          } = responseJson;
          dataSource.map((notification, index) => {
            if (_id === notification._id) altDataSource[index].status = status;
          });
          onSuccess(altDataSource);
        }
      })
      .catch(e => {
        console.log('read notification err', e);
        SimpleToast.show(
          "Notification couldn't be read, try again later",
          SimpleToast.SHORT,
        );
      });
  } catch (e) {
    console.log('read notification err', e);
    SimpleToast.show(
      "Notification couldn't be read, try again.",
      SimpleToast.SHORT,
    );
  }
};
