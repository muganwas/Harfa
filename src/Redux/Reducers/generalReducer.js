import {
    FETCHING_GENERAL_INFO,
    FETCHED_GENERAL_INFO,
    FETCHING_GENERAL_INFO_ERROR,
    FETCHED_COORDINATES,
    FETCHING_COORDINATES,
    FETCHING_COORDINATES_ERROR,
    FETCHING_OTHERS_COORDINATES,
    FETCHED_OTHERS_COORDINATES,
    FETCHING_OTHERS_COORDINATES_ERROR
} from '../types';

const initialState = {
    usersCoordinates: null,
    othersCoordinates: null,
    coordinatesFetched: false,
    fetchingCoordinates: false,
    fetched: false,
    fetching: false,
    error: null,
    coordinatesError: null
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
        case FETCHING_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: true,
                coordinatesFetched: false,
            }
        case FETCHED_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: true,
                usersCoordinates: action.payload
            }
        case FETCHING_COORDINATES_ERROR: {
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: false,
                coordinatesError: action.payload
            }
        }
        case FETCHING_OTHERS_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: true,
                coordinatesFetched: false,
            }
        case FETCHED_OTHERS_COORDINATES: 
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: true,
                othersCoordinates: action.payload
            }
        case FETCHING_OTHERS_COORDINATES_ERROR: {
            return {
                ...state,
                fetchingCoordinates: false,
                coordinatesFetched: false,
                coordinatesError: action.payload
            }
        }
        default: 
            return state;
    }
}

export default generalReducer;