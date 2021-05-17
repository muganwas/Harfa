import {cloneDeep} from 'lodash';
import Config from '../components/Config';

const ASK_FOR_REVIEW = Config.baseURL + 'notification/addreviewrequest';
const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';

export const requestClientForReview = async ({
  item,
  fetchJobRequestHistory,
  providerDetails,
  toggleIsLoading,
  onSuccess,
  onError,
}) => {
  if (item.customer_review !== 'Requested' && item.customer_rating === '') {
    toggleIsLoading();
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

export const submitClientReview = async ({
  rating,
  review,
  item,
  providerDetails,
  toggleIsLoading,
  onSuccess,
  onError,
}) => {
  toggleIsLoading();
  const reviewData = {
    main_id: this.state.mainId,
    type: 'Employee',
    rating: rating,
    review: review,
    notification: {
      fcm_id: item.user_details.fcm_id,
      type: 'Review',
      notification_by: 'Employee',
      title: 'Given Review',
      save_notification: true,
      senderName: providerDetails.name,
      senderId: providerDetails.providerId,
      body:
        providerDetails.name +
        ' ' +
        providerDetails.surname +
        ' has given you a review',
    },
  };
  try {
    await fetch(REVIEW_RATING, {
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
          onSuccess('Review submitted');
        } else {
          onError('Something went wrong');
        }
      })
      .catch(error => {
        console.log('Error :' + error);
        onError("Couldn't submit review");
      })
      .done();
  } catch (e) {
    console.log('Error :' + e);
    onError('Something went wrong, please try again later');
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
  toggleIsLoading();
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
          toggleIsLoading();
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
