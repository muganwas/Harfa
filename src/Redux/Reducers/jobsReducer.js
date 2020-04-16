import {
    FETCHING_JOB_REQUESTS,
    FETCHED_JOB_REQUESTS,
    FETCHING_JOB_REQUESTS_ERROR,
    FETCHING_JOB_REQUESTS_PROVIDERS,
    FETCHED_JOB_REQUESTS_PROVIDERS,
    FETCHING_JOB_REQUESTS_PROVIDERS_ERROR,
    SET_SELECTED_JOB_REQUEST,
} from '../types';

const initialState = {
    selectedJobRequest: null,
    jobRequests: [],
    jobRequestsProviders: [],
    requestsProvidersFetched: false,
    fetchingRequestsProviders: false,
    requestsProvidersError: null,
    requestsFetched: false,
    fetchingRequests: false,
    requestsError: null
}

const jobsReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_JOB_REQUESTS: 
            return {
                ...state,
                feching: true,
                requestsFetched: false,
                requestsError: null
            }
        case FETCHED_JOB_REQUESTS: 
            return {
                ...state,
                jobRequests: action.payload,
                requestsFetched: true,
                fetchingRequests: false,
                requestsError: null
            }
        case FETCHING_JOB_REQUESTS_ERROR: 
            return {
                ...state,
                requestsError: action.payload,
                requestsFetched: false,
                fetchingRequests: false
            }
        case FETCHING_JOB_REQUESTS_PROVIDERS: 
            return {
                ...state,
                fetchingRequestsProviders: true,
                requestsProvidersFetched: false,
                requestsProvidersError: null
            }
        case FETCHED_JOB_REQUESTS_PROVIDERS: 
            return {
                ...state,
                jobRequestsProviders: action.payload,
                requestsProvidersFetched: true,
                fetchingRequestsProviders: false,
                requestsProvidersError: null
            }
        case FETCHING_JOB_REQUESTS_PROVIDERS_ERROR: 
            return {
                ...state,
                requestsProvidersError: action.payload,
                requestsProvidersFetched: false,
                fetchingRequestsProviders: false
            }
        case SET_SELECTED_JOB_REQUEST: 
            return {
                ...state,
                selectedJobRequest: action.payload
            }
        default: 
            return state;
    }
}

export default jobsReducer;