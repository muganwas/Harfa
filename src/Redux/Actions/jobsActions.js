import Config from '../../components/Config';
import {
    FETCHING_JOB_REQUESTS,
    FETCHED_JOB_REQUESTS,
    FETCHING_JOB_REQUESTS_ERROR,
    FETCHING_JOB_REQUESTS_PROVIDERS,
    FETCHED_JOB_REQUESTS_PROVIDERS,
    FETCHING_JOB_REQUESTS_PROVIDERS_ERROR
} from '../types';

const PENDING_JOB_CUSTOMER = Config.baseURL+"jobrequest/user_status_check/";
const PENDING_JOB_PROVIDER = Config.baseURL+"jobrequest/customer_status_check/";

export const startFetchingJobCustomer = () => {
    return {
        type: FETCHING_JOB_REQUESTS
    }
}

export const fetchedJobCustomerInfo = payload => {
    return {
        type: FETCHED_JOB_REQUESTS,
        payload
    }
}

export const fetchCustomerJobInfoError = payload => {
    return {
        type: FETCHING_JOB_REQUESTS_ERROR,
        payload
    }
}
export const startFetchingJobProvider = () => {
    return {
        type: FETCHING_JOB_REQUESTS_PROVIDERS
    }
}

export const fetchedJobProviderInfo = payload => {
    return {
        type: FETCHED_JOB_REQUESTS_PROVIDERS,
        payload
    }
}

export const fetchProviderJobInfoError = payload => {
    return {
        type: FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
        payload
    }
}

export const getPendingJobRequest = ( props, userId, navTo ) => {
    return dispatch => {
        const { jobsInfo: { jobRequests }, navigation } = props;
        dispatch(startFetchingJobCustomer());
        fetch(PENDING_JOB_CUSTOMER + userId , {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
         })
         .then(response => response.json())
         .then(responseJson => {
            let newJobRequest = [...jobRequests];
            if (responseJson.result) {
                //const id = responseJson.data.id;
                var jobData = {
                    id: responseJson.data._id,
                    order_id: responseJson.data.order_id,
                    employee_id: responseJson.data.employee_details._id,
                    image: responseJson.data.employee_details.image,
                    fcm_id: responseJson.data.employee_details.fcm_id,
                    name: responseJson.data.employee_details.username,
                    surName: responseJson.data.employee_details.surname,
                    mobile: responseJson.data.employee_details.mobile,
                    description: responseJson.data.employee_details.description,
                    address: responseJson.data.employee_details.address,
                    lat: responseJson.data.employee_details.lat,
                    lang: responseJson.data.employee_details.lang,
                    service_name: responseJson.data.service_details.service_name,
                }
                //PendingJobRequest.Request = jobData;
                newJobRequest.push(jobData);
                dispatch(fetchedJobCustomerInfo(newJobRequest));
                /** navigate away */
                console.log('before navigating...')
                navigation.navigate(navTo);
            } 
            else {
                /** navigate away */
                dispatch(fetchedJobCustomerInfo(newJobRequest));
                navigation.navigate(navTo);
            }
         })
        .catch(error => {
            //alert("Error " + error);
            dispatch(fetchCustomerJobInfoError(error.message));
            console.log(JSON.stringify(responseJson));
        });
    }
}

export const getPendingJobRequestProvider = ( props, providerId, navTo ) => {
    return dispatch => {
        const { jobRequestsProviders, navigation }  = props;
        let newJobRequestsProviders = [...jobRequestsProviders];
        dispatch(startFetchingJobProvider());
        fetch(PENDING_JOB_PROVIDER+providerId , {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
         })
         .then(response => response.json())
         .then(responseJson => {
            if (responseJson.result) {
                //const id = responseJson.data.id;
                var jobData = {
                    id: responseJson.data._id,
                    order_id: responseJson.data.order_id,
                    user_id: responseJson.data.customer_details._id,
                    image: responseJson.data.customer_details.image,
                    fcm_id: responseJson.data.customer_details.fcm_id,
                    name: responseJson.data.customer_details.username,
                    mobile: responseJson.data.customer_details.mobile,
                    dob: responseJson.data.customer_details.dob,
                    address: responseJson.data.customer_details.address,
                    lat: responseJson.data.customer_details.lat,
                    lang: responseJson.data.customer_details.lang,
                    service_name: responseJson.data.service_details.service_name,
                    chat_status: responseJson.data.chat_status,
                    status: responseJson.data.status,
                    delivery_address: responseJson.data.delivery_address,
                    delivery_lat: responseJson.data.delivery_lat,
                    delivery_lang: responseJson.data.delivery_lang,
                }
                //ProPendingRequest.Request = jobData;
                newJobRequestsProviders.push(jobData)
                dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
                console.log('before navigating...')
                navigation.navigate(navTo);
            }
            else {
                dispatch(fetchedJobProviderInfo(newJobRequestsProviders));
                navigation.navigate(navTo);
            }
         })
        .catch((error) => {
            dispatch(fetchProviderJobInfoError(error.message));
            //alert("Error " + error);
            console.log(JSON.stringify(responseJson));
        });
    }     
}