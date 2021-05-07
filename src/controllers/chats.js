import {cloneDeep} from 'lodash';
import {imageExists} from '../misc/helpers';
import Config from '../components/Config';

const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
const PRO_INFO_UPDATE = Config.baseURL + 'employee/';

export const acceptChatRequest = async (
  {
    pos,
    fetchedPendingJobInfo,
    providerDetails,
    jobRequests,
    setSelectedJobRequest,
    toggleLoading,
    onError,
    navigate,
  },
  redirect = true,
) => {
  let newjobRequests = cloneDeep(jobRequests);
  const {
    id,
    user_id,
    fcm_id,
    name,
    service_name,
    order_id,
    image,
    mobile,
    dob,
    address,
    lat,
    lang,
    status,
    delivery_address,
    delivery_lat,
    delivery_lang,
  } = jobRequests[pos];

  setSelectedJobRequest(jobRequests[pos]);
  toggleLoading();
  const data = {
    main_id: id,
    chat_status: '1',
    status: 'Pending',
    notification: {
      fcm_id,
      title: 'Chat Request Accepted',
      type: 'ChatAcceptance',
      notification_by: 'Employee',
      save_notification: true,
      user_id,
      employee_id: providerDetails.providerId,
      order_id,
      body:
        'Chat request has been accepted by ' +
        providerDetails.name +
        ' Request Id : ' +
        order_id,
      data: {
        user_id,
        providerId: providerDetails.id,
        ProviderData: JSON.stringify(providerDetails),
        serviceName: service_name,
        orderId: order_id,
        mainId: id,
        chat_status: '1',
        status: 'Pending',
      },
    },
  };
  try {
    await fetch(REJECT_ACCEPT_REQUEST, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(async responseJson => {
        if (responseJson.result) {
          toggleLoading();
          let jobData = {
            id: responseJson.data.id,
            order_id,
            user_id,
            image,
            fcm_id,
            name,
            mobile,
            dob,
            address,
            lat,
            lang,
            service_name,
            chat_status: '1',
            status,
            delivery_address,
            delivery_lat,
            delivery_lang,
          };

          imageExists(image).then(res => {
            jobData.imageAvailable = res;
          });

          newjobRequests[pos] = jobData;
          fetchedPendingJobInfo(newjobRequests);
          if (redirect) navigate();
        } else {
          console.log(
            'something went wrong with accepting chat --',
            responseJson,
          );
          onError('Something went wrong');
        }
      })
      .catch(error => {
        console.log('Error >>> ' + error);
        onError(error.message);
      });
  } catch (e) {
    console.log('Error >>> ' + e);
    onError(e.message);
  }
};

export const rejectJobRequest = async (
  {
    pos,
    fetchedPendingJobInfo,
    providerDetails,
    jobRequestsProviders,
    toggleLoading,
    onError,
    navigate,
  },
  redirect = true,
) => {
  toggleLoading();
  let newjobRequestsProviders = cloneDeep(jobRequestsProviders);
  const {id, user_id, fcm_id, service_name, order_id} = jobRequestsProviders[
    pos
  ];
  const data = {
    main_id: id,
    chat_status: '0',
    status: 'Rejected',
    notification: {
      fcm_id: fcm_id,
      title: 'Chat Request Rejected',
      type: 'JobRejection',
      notification_by: 'Employee',
      save_notification: true,
      user_id: user_id,
      employee_id: providerDetails.providerId,
      order_id: order_id,
      body:
        'Chat request has been accepted by ' +
        providerDetails.name +
        ' Request Id : ' +
        order_id,
      data: {
        providerId: providerDetails.id,
        serviceName: service_name,
        orderId: order_id,
        mainId: id,
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
        if (responseJson.result) {
          toggleLoading();
          newjobRequestsProviders.splice(pos, 1);
          fetchedPendingJobInfo(newjobRequestsProviders);
        } else {
          onError('Something went wrong');
        }
        if (redirect) navigate();
      })
      .catch(error => {
        onError(error.message);
      });
  } catch (e) {
    onError(e.message);
  }
};

export const updateAvailabilityInMongoDB = async ({
  userData,
  providerDetails,
  updateProviderDetails,
  online,
  onSuccess,
  onError,
}) => {
  try {
    let newProDits = cloneDeep(providerDetails);
    await fetch(PRO_INFO_UPDATE + providerDetails.providerId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
        const {result, data} = response;
        if (result && data) {
          newProDits.online = data.online;
          updateProviderDetails(newProDits);
          onSuccess(response.message, online, data.online);
        } else {
          onError(response.message);
        }
      })
      .catch(error => {
        console.log('Error :' + error);
        onError('Someting went wrong, please try again later');
      });
  } catch (e) {
    console.log('Error :' + e);
    onError('Something went wrong, please try again later');
  }
};
