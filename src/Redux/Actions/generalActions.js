import {
    FETCHED_COORDINATES,
    FETCHING_COORDINATES,
    FETCHING_COORDINATES_ERROR,
    FETCHING_OTHERS_COORDINATES,
    FETCHED_OTHERS_COORDINATES,
    FETCHING_OTHERS_COORDINATES_ERROR
} from '../types';

export const updatingCoordinates = () => {
    return {
        type: FETCHING_COORDINATES
    }
}

export const updateCoordinates = payload => {
    return {
        type: FETCHED_COORDINATES,
        payload
    }
}

export const updateCoordinatesError = payload => {
    return {
        type: FETCHING_COORDINATES_ERROR,
        payload
    }
}

export const updatingOthersCoordinates = () => {
    return {
        type: FETCHING_OTHERS_COORDINATES
    }
}

export const updateOthersCoordinates = payload => {
    return {
        type: FETCHED_OTHERS_COORDINATES,
        payload
    }
}

export const updateOthersCoordinatesError = payload => {
    return {
        type: FETCHING_OTHERS_COORDINATES_ERROR,
        payload
    }
}