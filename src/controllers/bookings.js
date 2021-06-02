import {imageExists} from '../misc/helpers';
import {cloneDeep} from 'lodash';
import SimpleToast from 'react-native-simple-toast';
import Config from '../components/Config';

const BOOKING_REQUEST = Config.baseURL + 'jobrequest/addjobrequest';

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
              imageExists(newData[i]?.user_details?.image).then(res => {
                if (newData[i]?.user_details)
                  newData[i].user_details.imageAvailable = res;
              });
            else
              imageExists(newData[i]?.employee_details?.image).then(res => {
                if (newData[i]?.employee_details)
                  newData[i].employee_details.imageAvailable = res;
              });
            if (newData[i].chat_status === '1') {
              if (newData[i].status === 'Completed') {
                bookingCompleteData.push(newData[i]);
              } else if (newData[i].status === 'Rejected') {
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
        console.log('Booking fetch error', error);
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

export const requestForBooking = async ({
  fcm_id,
  providerId,
  serviceId,
  serviceName,
  userDetails,
  online,
  navigation,
  onRequestSending,
  onSuccess,
  onError,
  goBack,
}) => {
  if (!userDetails.lang) {
    onError(true, 'Please provide your address first');
    setTimeout(
      () =>
        navigation.navigate('SelectAddress', {
          onGoBack: goBack,
        }),
      400,
    );
  } else if (!userDetails.mobile) {
    onError(true, 'Please update mobile first');
  } else {
    onRequestSending();
    const data = {
      user_id: userDetails.userId,
      employee_id: providerId,
      service_id: serviceId,
      delivery_address: userDetails.address,
      delivery_lat: userDetails.lat,
      delivery_lang: userDetails.lang,
      notification: {
        fcm_id,
        title: 'Booking Request',
        body: 'You have a booking request from ' + userDetails.username,
        save_notification: true,
        user_id: userDetails.userId,
        employee_id: providerId,
        notification_by: 'Customer',
        data: {
          userId: userDetails.userId,
          serviceName: serviceName,
          delivery_address: userDetails.address,
          delivery_lat: userDetails.lat,
          delivery_lang: userDetails.lang,
        },
      },
    };
    if (!online) {
      onError(
        true,
        'Service provider is Offline and might take a while to respond',
      );
    }
    try {
      fetch(BOOKING_REQUEST, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson.result) {
            onSuccess('Waiting for acceptance...');
          } else {
            if (responseJson.message === 'Already Exist') {
              onError(
                false,
                'You already have a running job with this provider',
              );
            } else if (responseJson.message === 'Service provider busy') {
              onError(
                false,
                'Service provider is currently busy. please try another service provider',
              );
            } else if (responseJson.message === 'Service provider is offline') {
              onError(
                false,
                'Service provider is offline. Book another service provider',
              );
            } else {
              onError(true, 'Something went wrong');
            }
          }
        })
        .catch(error => {
          console.log('pro req error ', error);
          onError(true, 'Something went wrong, try again later');
        });
    } catch (e) {
      console.log('Pro request err !', e);
      onError(true, 'Something went wrong, try again later');
    }
  }
};
