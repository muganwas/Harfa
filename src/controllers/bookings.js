import {imageExists} from '../misc/helpers';
import {cloneDeep} from 'lodash';
import SimpleToast from 'react-native-simple-toast';

export const getAllBookings = async ({
  userId,
  userType,
  toggleIsLoading,
  bookingHistoryURL,
  onSuccess,
}) => {
  toggleIsLoading(true);
  try {
    let bookingCompleteData = [];
    let bookingRejectData = [];
    await fetch(bookingHistoryURL + userId + '/bookings')
      .then(response => response.json())
      .then(async responseJson => {
        if (responseJson.result && responseJson.data) {
          console.log(responseJson.data);
          let newData = cloneDeep(responseJson.data);
          for (let i = 0; i < newData.length; i++) {
            if (userType === 'Provider')
              imageExists(newData[i].user_details.image).then(res => {
                if (newData[i].user_details)
                  newData[i].user_details.imageAvailable = res;
              });
            else
              imageExists(newData[i].employee_details.image).then(res => {
                if (newData[i].employee_details)
                  newData[i].employee_details.imageAvailable = res;
              });
            if (newData[i].chat_status == '1') {
              if (newData[i].status === 'Completed') {
                bookingCompleteData.push(newData[i]);
              } else if (newData[i].status == 'Rejected') {
                bookingRejectData.push(newData[i]);
              }
            } else {
              if (newData[i].status === 'Rejected') {
                bookingRejectData.push(newData[i]);
              }
            }
          }
          onSuccess(bookingCompleteData, bookingRejectData);
        } else {
          toggleIsLoading(false);
        }
      })
      .catch(error => {
        console.log(error);
        toggleIsLoading(false);
        SimpleToast.show(
          'Something went wrong, check your internet connection',
        );
      });
  } catch (e) {
    console.log(e);
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, please try again');
  }
};

export const reviewTask = async ({
  rating,
  review,
  main_id,
  fcm_id,
  senderName,
  senderId,
  userType,
  notification_by,
  notificationType,
  reviewURL,
  onSuccess,
  toggleIsLoading,
}) => {
  toggleIsLoading(true);
  const reviewData = {
    main_id,
    type: userType,
    rating: rating,
    review: review,
    notification: {
      fcm_id,
      type: notificationType,
      notification_by,
      title: 'Given Review',
      save_notification: true,
      senderName,
      senderId,
      body: senderName + ' has given you a review',
    },
  };
  try {
    fetch(reviewURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    })
      .then(response => response.json())
      .then(response => {
        if (response.result) {
          onSuccess();
          SimpleToast.show('Review Submitted');
        } else {
          toggleIsLoading();
          SimpleToast.show('Something went wrong, please try again.');
        }
      })
      .catch(error => {
        console.log('Error :' + error);
        toggleIsLoading();
        SimpleToast.show('Something went wrong, please try again.');
      })
      .done();
  } catch (e) {
    console.log('Error :' + e);
    toggleIsLoading();
    SimpleToast.show('Something went wrong, please try again.');
  }
};
