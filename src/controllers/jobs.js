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
  userType,
  currRequestPos,
  toggleIsLoading,
  updatePendingJobInfo,
  jobRequests,
  userDetails,
  onSuccess,
  onError,
  navigate,
}) => {
  toggleIsLoading(true);
  const dash = userType === 'Provider' ? 'ProDashboard' : 'Dashboard';
  try {
    let newJobRequests = cloneDeep(jobRequests);
    const data =
      userType === 'Provider'
        ? {
            main_id: jobRequests[currRequestPos]?.id,
            chat_status: '1',
            status: 'Cancelled',
            notification: {
              fcm_id: jobRequests[currRequestPos]?.customer_details?.fcm_id,
              title: 'Job Cancelled',
              type: 'JobCancellation',
              body:
                'Your job request has been cancelled by the service provder,' +
                ' Request Id : ' +
                jobRequests[currRequestPos]?.order_id,
              save_notification: true,
              user_id: jobRequests[currRequestPos]?.customer_details?._id,
              employee_id: userDetails.providerId,
              order_id: jobRequests[currRequestPos]?.order_id,
              notification_by: 'Employee',
              data: {
                ProviderId: userDetails.providerId,
                orderId: jobRequests[currRequestPos]?.order_id,
                mainId: jobRequests[currRequestPos]?.id,
              },
            },
          }
        : {
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
                orderId: jobRequests[currRequestPos].order_id,
                mainId: jobRequests[currRequestPos].id,
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
          onSuccess && onSuccess();
          toggleIsLoading(false);
          newJobRequests.splice(currRequestPos, 1);
          updatePendingJobInfo(newJobRequests);
          navigate && navigate(dash);
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
        orderId: orderId,
        mainId: mainId,
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
        orderId: orderId,
        mainId: mainId,
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

export const jobCompleteTask = async ({
  userType,
  currRequestPos,
  jobRequests,
  userDetails,
  updatePendingJobInfo,
  toggleIsLoading,
  onSuccess,
  onError,
  navigate,
  rejectAcceptURL,
}) => {
  toggleIsLoading(true);
  const dash = userType === 'Provider' ? 'ProDashboard' : 'Dashboard';
  try {
    let newJobRequests = cloneDeep(jobRequests);
    if (jobRequests[currRequestPos]) {
      const data =
        userType === 'Provider'
          ? {
              main_id: jobRequests[currRequestPos]?.id,
              chat_status: '1',
              status: 'Completed',
              notification: {
                fcm_id: jobRequests[currRequestPos]?.customer_details?.fcm_id,
                title: 'Job Completed',
                type: 'jobCompletion',
                body:
                  'Your job request has been completed by the service provder,' +
                  ' Request id: ' +
                  jobRequests[currRequestPos]?.order_id,
                save_notification: true,
                user_id: jobRequests[currRequestPos]?.customer_details?._id,
                employee_id: userDetails.providerId,
                order_id: jobRequests[currRequestPos]?.order_id,
                notification_by: 'Employee',
                data: {
                  ProviderId: userDetails.providerId,
                  orderId: jobRequests[currRequestPos]?.order_id,
                  mainId: jobRequests[currRequestPos]?.id,
                },
              },
            }
          : {
              main_id: jobRequests[currRequestPos]?.id,
              chat_status: '1',
              status: 'Completed',
              notification: {
                fcm_id: jobRequests[currRequestPos]?.fcm_id,
                title: 'Job Completed',
                body:
                  'Job Id : ' +
                  jobRequests[currRequestPos]?.order_id +
                  ' has been reported complete by the client.',
                type: 'Job Completed',
                user_id: userDetails.userId,
                employee_id: jobRequests[currRequestPos]?.employee_id,
                order_id: jobRequests[currRequestPos]?.order_id,
                notification_by: 'Customer',
                save_notification: true,
                data: {
                  ProviderId: jobRequests[currRequestPos]?.employee_id,
                  orderId: jobRequests[currRequestPos]?.order_id,
                  mainId: jobRequests[currRequestPos]?.id,
                },
              },
            };
      await fetch(rejectAcceptURL, {
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
            onSuccess();
            newJobRequests.splice(currRequestPos, 1);
            updatePendingJobInfo(newJobRequests);
            navigate(dash);
          } else {
            onError('An error has occurred, please try again later');
          }
        })
        .catch(error => {
          console.log('Error >>> ' + error);
          onError('Something went wrong, try again later');
        });
    } else {
      simpleToast.show('Something went wrong, try logging in and out of app');
    }
  } catch (e) {
    console.log('Error >>> ' + e);
    onError('Something went wrong, try again later');
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
