import {cloneDeep} from 'lodash';
import Config from '../../components/Config';
import {
  FETCHING_JOB_REQUESTS,
  FETCHED_JOB_REQUESTS,
  FETCHING_JOB_REQUESTS_ERROR,
  FETCHING_JOB_REQUESTS_PROVIDERS,
  FETCHED_JOB_REQUESTS_PROVIDERS,
  FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
  SET_SELECTED_JOB_REQUEST,
  FETCHED_ALL_JOB_REQUESTS_PRO,
  FETCH_ALL_JOB_REQUESTS_PRO_ERROR,
  FETCHED_ALL_JOB_REQUESTS_CLIENT,
  FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR,
  FETCHED_DATA_WORK_SOURCE,
  FETCH_DATA_WORK_SOURCE_ERROR,
  UPDATE_ACTIVE_REQUREST,
  UPDATE_BOOKING_COMPLETE_DATA,
  UPDATE_REJECTED_BOOKINGS_DATA,
} from '../types';

import {imageExists} from '../../misc/helpers';

const PENDING_JOB_PROVIDER =
  Config.baseURL + 'jobrequest/provider_status_check/';
const PENDING_JOB_CUSTOMER =
  Config.baseURL + 'jobrequest/customer_status_check/';
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
const CUSTOMER_BOOKING_HISTORY =
  Config.baseURL + 'jobrequest/customer_request/';

export const startFetchingJobCustomer = () => {
  return {
    type: FETCHING_JOB_REQUESTS,
  };
};

export const fetchedJobCustomerInfo = payload => {
  return {
    type: FETCHED_JOB_REQUESTS,
    payload,
  };
};

export const fetchCustomerJobInfoError = payload => {
  return {
    type: FETCHING_JOB_REQUESTS_ERROR,
    payload,
  };
};

export const updateCompletedBookingData = payload => {
  return {
    type: UPDATE_BOOKING_COMPLETE_DATA,
    payload,
  };
};

export const updateFailedBookingData = payload => {
  return {
    type: UPDATE_REJECTED_BOOKINGS_DATA,
    payload,
  };
};

export const startFetchingJobProvider = () => {
  return {
    type: FETCHING_JOB_REQUESTS_PROVIDERS,
  };
};

export const fetchedJobProviderInfo = payload => {
  return {
    type: FETCHED_JOB_REQUESTS_PROVIDERS,
    payload,
  };
};

export const fetchProviderJobInfoError = payload => {
  return {
    type: FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
    payload,
  };
};

export const setSelectedJobRequest = payload => {
  return {
    type: SET_SELECTED_JOB_REQUEST,
    payload,
  };
};

export const fetchedAllJobRequestsPro = payload => {
  return {
    type: FETCHED_ALL_JOB_REQUESTS_PRO,
    payload,
  };
};

export const fetchAllJobRequestsProError = () => {
  return {
    type: FETCH_ALL_JOB_REQUESTS_PRO_ERROR,
  };
};

export const fetchedAllJobRequestsClient = payload => {
  return {
    type: FETCHED_ALL_JOB_REQUESTS_CLIENT,
    payload,
  };
};

export const fetchAllJobRequestsClientError = () => {
  return {
    type: FETCH_ALL_JOB_REQUESTS_CLIENT_ERROR,
  };
};

export const fetchedDataWorkSource = payload => {
  return {
    type: FETCHED_DATA_WORK_SOURCE,
    payload,
  };
};

export const updateActiveRequest = payload => {
  return {
    type: UPDATE_ACTIVE_REQUREST,
    payload,
  };
};

export const fetchDataWorkSourceError = () => {
  return {
    type: FETCH_DATA_WORK_SOURCE_ERROR,
  };
};

export const getPendingJobRequest = (props, userId, navTo) => {
  //has to change to accomodate multiple requests
  return dispatch => {
    const {navigation} = props;
    dispatch(startFetchingJobCustomer());
    try {
      fetch(PENDING_JOB_CUSTOMER + userId + '/pending', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          let newJobRequest = [];
          if (responseJson.result) {
            //const id = responseJson.data.id;
            responseJson.data.map(async (job, index) => {
              if (job && job.employee_details) {
                let jobData = {
                  id: job._id,
                  order_id: job.order_id,
                  employee_id: job.employee_details && job.employee_details._id,
                  image: job.employee_details && job.employee_details.image,
                  fcm_id: job.employee_details && job.employee_details.fcm_id,
                  name: job.employee_details && job.employee_details.username,
                  surName: job.employee_details && job.employee_details.surname,
                  status: job.status,
                  chat_status: job.chat_status,
                  mobile: job.employee_details && job.employee_details.mobile,
                  description:
                    job.employee_details && job.employee_details.description,
                  address: job.employee_details && job.employee_details.address,
                  lat: job.employee_details && job.employee_details.lat,
                  lang: job.employee_details && job.employee_details.lang,
                  service_name: job.service_details.service_name,
                  employee_details: job.employee_details,
                };
                //PendingJobRequest.Request = jobData;
                //check if image is reachable
                job.employee_details &&
                  imageExists(job.employee_details.image).then(res => {
                    jobData.imageAvailable = res;
                  });
                newJobRequest.push(jobData);
              }
            });
            dispatch(fetchedJobCustomerInfo(newJobRequest));
            /** navigate away */
            console.log('before navigating...');
            if (navigation && navTo) navigation.navigate(navTo);
          } else {
            /** navigate away */
            dispatch(fetchedJobCustomerInfo(newJobRequest));
            if (navigation && navTo) navigation.navigate(navTo);
          }
        })
        .catch(error => {
          //alert("Error " + error);
          dispatch(fetchCustomerJobInfoError(error.message));
        });
    } catch (e) {
      dispatch(fetchCustomerJobInfoError(e.message));
    }
  };
};

export const getAllWorkRequestClient = clientId => {
  return dispatch => {
    try {
      fetch(CUSTOMER_BOOKING_HISTORY + clientId + '/null')
        .then(response => response.json())
        .then(async responseJson => {
          let newAllClientDetails = responseJson.data
            ? cloneDeep(responseJson.data)
            : [];
          let dataWorkSource = [];
          if (responseJson.result) {
            for (let i = 0; i < responseJson.data.length; i++) {
              if (responseJson.data[i]) {
                responseJson.data[i].employee_details &&
                  imageExists(responseJson.data[i].employee_details.image).then(
                    res => {
                      newAllClientDetails[i].imageAvailable = res;
                    },
                  );
                if (responseJson.data[i].chat_status == '1') {
                  dataWorkSource.push(responseJson.data[i]);
                } else if (responseJson.data[i].chat_status == '0') {
                  if (responseJson.data[i].status != 'Pending') {
                    dataWorkSource.push(responseJson.data[i]);
                  }
                }
              }
            }
            dispatch(fetchedDataWorkSource(dataWorkSource));
            dispatch(fetchedAllJobRequestsClient(newAllClientDetails));
          }
          dispatch(fetchedDataWorkSource(dataWorkSource));
          dispatch(fetchedAllJobRequestsClient(newAllClientDetails));
        })
        .catch(error => {
          console.log(error);
          dispatch(fetchAllJobRequestsClientError());
        });
    } catch (e) {
      console.log(e);
      dispatch(fetchAllJobRequestsClientError());
    }
  };
};

export const getAllWorkRequestPro = providerId => {
  return dispatch => {
    try {
      fetch(BOOKING_HISTORY + providerId + '/Cancelled')
        .then(response => response.json())
        .then(async responseJson => {
          let newAllProvidersDetails = responseJson.data
            ? cloneDeep(responseJson.data)
            : [];
          let dataWorkSource = [];
          if (responseJson.result) {
            for (let i = 0; i < responseJson.data.length; i++) {
              imageExists(responseJson.data[i].user_details.image).then(res => {
                newAllProvidersDetails[i].imageAvailable = res;
              });
              if (responseJson.data[i].chat_status === '1') {
                dataWorkSource.push(responseJson.data[i]);
              } else if (responseJson.data[i].chat_status === '0') {
                if (responseJson.data[i].status !== 'Pending') {
                  dataWorkSource.push(responseJson.data[i]);
                }
              }
            }
          }
          dispatch(fetchedDataWorkSource(dataWorkSource));
          dispatch(fetchedAllJobRequestsPro(newAllProvidersDetails));
        })
        .catch(error => {
          dispatch(fetchDataWorkSourceError());
          dispatch(fetchAllJobRequestsProError());
          console.log(error);
        });
    } catch (e) {
      dispatch(fetchDataWorkSourceError());
      dispatch(fetchAllJobRequestsProError());
      console.log(e);
    }
  };
};

export const getPendingJobRequestProvider = (props, providerId, navTo) => {
  return dispatch => {
    const {navigation} = props;
    let newJobRequestsProviders = [];
    dispatch(startFetchingJobProvider());
    try {
      fetch(PENDING_JOB_PROVIDER + providerId + '/pending', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson.result) {
            responseJson.data.map(async (job, index) => {
              if (job && job.customer_details) {
                var jobData = {
                  id: job._id,
                  order_id: job.order_id,
                  user_id: job.customer_details && job.customer_details._id,
                  image: job.customer_details && job.customer_details.image,
                  fcm_id: job.customer_details && job.customer_details.fcm_id,
                  name: job.customer_details && job.customer_details.username,
                  mobile: job.customer_details && job.customer_details.mobile,
                  dob: job.customer_details && job.customer_details.dob,
                  address: job.customer_details && job.customer_details.address,
                  lat: job.customer_details && job.customer_details.lat,
                  lang: job.customer_details && job.customer_details.lang,
                  service_name: job.service_details.service_name,
                  chat_status: job.chat_status,
                  status: job.status,
                  delivery_address: job.delivery_address,
                  delivery_lat: job.delivery_lat,
                  delivery_lang: job.delivery_lang,
                  customer_details: job.customer_details,
                };
                //check if image is reachable
                job.customer_details &&
                  imageExists(job.customer_details.image).then(res => {
                    jobData.imageAvailable = res;
                  });
                newJobRequestsProviders.push(jobData);
              }
            });
            dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
            if (navigation && navTo) navigation.navigate(navTo);
          } else {
            dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
            if (navigation && navTo) navigation.navigate(navTo);
          }
        })
        .catch(error => {
          dispatch(fetchProviderJobInfoError(error.message));
          //alert("Error " + error);
          console.log(JSON.stringify(responseJson));
        });
    } catch (e) {
      dispatch(fetchProviderJobInfoError(e.message));
    }
  };
};
