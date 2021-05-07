import Config from '../components/Config';

const ASK_FOR_REVIEW = Config.baseURL + 'notification/addreviewrequest';
const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';

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
