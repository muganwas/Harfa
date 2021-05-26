import {cloneDeep} from 'lodash';
import database from '@react-native-firebase/database';
import Geolocation from 'react-native-geolocation-service';
import SimpleToast from 'react-native-simple-toast';

import Config from '../components/Config';

const ASK_FOR_REVIEW = Config.baseURL + 'notification/addreviewrequest';
const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
const SERVICES_URL = Config.baseURL + 'service/getall';

export const requestClientForReview = async ({
  item,
  fetchJobRequestHistory,
  providerDetails,
  toggleIsLoading,
  onSuccess,
  onError,
}) => {
  if (item.customer_review !== 'Requested' && item.customer_rating === '') {
    toggleIsLoading(true);
    const askReviewData = {
      order_id: item._id,
      user_id: item.user_id,
      employee_id: providerDetails.providerId,
      notification: {
        fcm_id: item.user_details.fcm_id,
        type: 'ReviewRequest',
        notification_by: 'Employee',
        title: 'Ask For Review',
        save_notification: true,
        user_id: item.user_id,
        employee_id: providerDetails.providerId,
        order_id: item._id,
        body:
          providerDetails.name +
          ' ' +
          providerDetails.surname +
          ' waiting for your feedback',
      },
    };
    try {
      await fetch(ASK_FOR_REVIEW, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(askReviewData),
      })
        .then(response => response.json())
        .then(response => {
          if (response.result) {
            toggleIsLoading();
            onSuccess('Request submitted successfully');
            fetchJobRequestHistory(providerDetails.providerId);
          } else {
            onError('Something went wrong');
          }
        })
        .catch(error => {
          console.log('Error :' + error);
          onError('Something went wrong');
        })
        .done();
    } catch (e) {
      console.log('Error :' + e);
      onError('Something went wrong, try again');
    }
  } else if (item.customer_review == 'Requested') {
    onError('You have already asked, Please wait for customer feedback');
  }
};

export const jobCancelTask = async ({
  currRequestPos,
  toggleIsLoading,
  fetchedPendingJobInfo,
  jobRequests,
  userDetails,
  onError,
  navigate,
}) => {
  toggleIsLoading(true);
  try {
    let newJobRequests = cloneDeep(jobRequests);
    const data = {
      main_id: jobRequests[currRequestPos].id,
      chat_status: '1',
      status: 'Cancelled',
      notification: {
        fcm_id: jobRequests[currRequestPos].fcm_id,
        title: 'Job Cancelled',
        type: 'JobCancellation',
        user_id: userDetails.userId,
        employee_id: jobRequests[currRequestPos].employee_id,
        order_id: jobRequests[currRequestPos].order_id,
        notification_by: 'Customer',
        save_notification: true,
        body:
          'Job request has been cancelled by client' +
          ' Request Id : ' +
          jobRequests[currRequestPos].order_id,
        data: {
          ProviderId: jobRequests[currRequestPos].employee_id,
          image: jobRequests[currRequestPos].image
            ? jobRequests[currRequestPos].image
            : 'null',
          fcmId: jobRequests[currRequestPos].fcm_id,
          name: jobRequests[currRequestPos].name,
          surname: jobRequests[currRequestPos].surname,
          mobile: jobRequests[currRequestPos].mobile,
          description: jobRequests[currRequestPos].description,
          address: jobRequests[currRequestPos].address,
          lat: jobRequests[currRequestPos].lat,
          lang: jobRequests[currRequestPos].lang,
          serviceName: jobRequests[currRequestPos].service_name,
          orderId: jobRequests[currRequestPos].order_id,
          mainId: jobRequests[currRequestPos].id,
          chat_status: jobRequests[currRequestPos].chat_status,
          status: 'Cancelled',
          delivery_address: jobRequests[currRequestPos].delivery_address,
          delivery_lat: jobRequests[currRequestPos].delivery_lat,
          delivery_lang: jobRequests[currRequestPos].delivery_lang,
        },
      },
    };
    await fetch(REJECT_ACCEPT_REQUEST, {
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
          toggleIsLoading(false);
          newJobRequests.splice(currRequestPos, 1);
          fetchedPendingJobInfo(newJobRequests);
          navigate && navigate('Dashboard');
        } else {
          onError('An error has occurred, please try again later');
        }
      })
      .catch(error => {
        console.log('cancel job error --', error);
        onError("Couldn't cancel job, please try again later");
      });
  } catch (e) {
    console.log('Error >>> ' + e);
    onError("Couldn't cancel job, please try again later");
  }
};

export const acceptJobTask = async ({
  receiverId,
  orderId,
  fcm_id,
  deliveryAddress,
  deliveryLat,
  deliveryLang,
  serviceName,
  mainId,
  providerDetails,
  dataWorkSource,
  fetchedDataWorkSource,
  fetchedPendingJobInfo,
  jobRequestsProviders,
  getAllWorkRequestPro,
  toggleIsLoading,
  currRequestPos,
  onSuccess,
  onError,
}) => {
  toggleIsLoading(true);
  let newDWS = cloneDeep(dataWorkSource);
  let dataWSPos;
  await newDWS.map((wks, i) => {
    if (wks.order_id === orderId) dataWSPos = i;
  });
  const data = {
    main_id: mainId,
    chat_status: '1',
    status: 'Accepted',
    notification: {
      fcm_id,
      title: 'Job Accepted',
      type: 'JobAcceptence',
      notification_by: 'Employee',
      user_id: receiverId,
      employee_id: providerDetails.providerId,
      order_id: orderId,
      save_notification: true,
      body:
        'Your request has been accepted by ' +
        providerDetails.name +
        ' ' +
        providerDetails.surname +
        ' Request Id : ' +
        orderId,
      data: {
        userId: receiverId,
        providerId: providerDetails.providerId,
        ProviderData: providerDetails,
        serviceName: serviceName,
        orderId: orderId,
        mainId: mainId,
        chat_status: '1',
        status: 'Accepted',
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat,
        delivery_lang: deliveryLang,
      },
    },
  };
  try {
    fetch(REJECT_ACCEPT_REQUEST, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(responseJson => {
        let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
        if (responseJson.data) {
          onSuccess();
          if (dataWSPos || dataWSPos === 0) {
            newDWS[dataWSPos].status = 'Accepted';
            fetchedDataWorkSource(newDWS);
          }
          newjobRequestsProviders[currRequestPos].chat_status =
            responseJson.data.chat_status;
          newjobRequestsProviders[currRequestPos].status =
            responseJson.data.status;
          fetchedPendingJobInfo(newjobRequestsProviders);
          getAllWorkRequestPro(providerDetails.providerId);
          //Send Location to Firebase for tracking
          Geolocation.getCurrentPosition(position => {
            let locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            let updates = {};
            updates['tracking/' + orderId] = locationData;
            database()
              .ref()
              .update(updates);
          });
        } else {
          onError();
          SimpleToast.show('Something went wrong, please try again later');
        }
      })
      .catch(error => {
        console.log('Error >>> ' + error);
        toggleIsLoading(false);
        SimpleToast.show('Something went wrong, please try again later');
      });
  } catch (e) {
    console.log('Error >>> ' + e);
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, please try again later');
  }
};

export const rejectJobTask = async ({
  orderId,
  receiverId,
  currRequestPos,
  mainId,
  fcm_id,
  serviceName,
  deliveryAddress,
  deliveryLat,
  deliveryLang,
  dataWorkSource,
  providerDetails,
  toggleIsLoading,
  fetchedPendingJobInfo,
  fetchedDataWorkSource,
  jobRequestsProviders,
  navigation,
  onSuccess,
  onError,
}) => {
  toggleIsLoading(true);
  let newDWS = cloneDeep(dataWorkSource);
  let dataWSPos;
  await newDWS.map((wks, i) => {
    if (wks.order_id === orderId) dataWSPos = i;
  });
  const data = {
    main_id: mainId,
    chat_status: '1',
    status: 'Rejected',
    notification: {
      fcm_id,
      title: 'Job Rejected',
      type: 'JobRejection',
      notification_by: 'Employee',
      save_notification: true,
      user_id: receiverId,
      employee_id: providerDetails.providerId,
      order_id: orderId,
      body:
        'Your request has been rejected by ' +
        providerDetails.name +
        ' Request Id : ' +
        orderId,
      data: {
        ProviderId: providerDetails.providerId,
        image: providerDetails.imageSource
          ? providerDetails.imageSource
          : 'null',
        fcmId: providerDetails.fcmId,
        name: providerDetails.name,
        surname: providerDetails.surname,
        mobile: providerDetails.mobile,
        description: providerDetails.description,
        address: providerDetails.address,
        lat: providerDetails.lat,
        lang: providerDetails.lang,
        serviceName: serviceName,
        orderId: orderId,
        mainId: mainId,
        chat_status: '0',
        status: 'Rejected',
        delivery_address: deliveryAddress,
        delivery_lat: deliveryLat,
        delivery_lang: deliveryLang,
      },
    },
  };
  try {
    fetch(REJECT_ACCEPT_REQUEST, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(responseJson => {
        let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
        if (responseJson.result) {
          onSuccess();
          if (dataWSPos || dataWSPos === 0) {
            newDWS.splice(dataWSPos, 1);
            fetchedDataWorkSource(newDWS);
          }
          newjobRequestsProviders.splice(currRequestPos, 1);
          fetchedPendingJobInfo(newjobRequestsProviders);
          navigation.navigate('ProDashboard');
        } else {
          onError();
          SimpleToast.show('Something went wrong, please try again later');
        }
      })
      .catch(error => {
        console.log('Error >>> ' + error);
        toggleIsLoading(false);
        SimpleToast.show('Something went wrong, please try again later');
      });
  } catch (e) {
    console.log('Error >>> ' + e);
    toggleIsLoading(false);
    SimpleToast.show('Something went wrong, please try again later');
  }
};

export const fetchServices = async ({onSuccess, onError}) => {
  await fetch(SERVICES_URL)
    .then(response => response.json())
    .then(responseJson => {
      onSuccess(responseJson.data);
    })
    .catch(error => {
      console.log(error);
      onError('An error has occurred, check your internet connection');
    });
};
