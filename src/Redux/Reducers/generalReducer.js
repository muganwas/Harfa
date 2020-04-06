import {
    FETCHING_GENERAL_INFO,
    FETCHED_GENERAL_INFO,
    FETCHING_GENERAL_INFO_ERROR
} from '../types';

const initialState = {
    generalInfo: null,
    fetched: false,
    fetching: false,
    error: null
}

const generalReducer = (state=initialState, action) => {
    switch(action.type){
        case FETCHING_GENERAL_INFO: 
            return {
                ...state,
                fetching: true,
                fetched: false,
                error: null
            }
        case FETCHED_GENERAL_INFO: 
            return{
                ...state,
                fetched: true,
                generalInfo: action.payload,
                fetching: false,
                error: null
            }
        case FETCHING_GENERAL_INFO_ERROR:
            return {
                ...state,
                fetched: false,
                fetching: false,
                error: action.payload
            }
        default: 
            return state;
    }
}

export default generalReducer;