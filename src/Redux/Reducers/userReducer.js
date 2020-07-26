import {
    UPDATE_PROVIDER_DETAILS,
    UPDATE_USER_DETAILS,
    RESET_USER_DETAILS
} from '../types';

const initialState = {
    userDetails: {
        userId: '',
        accountType: '',
        email: '',
        password: '',
        username: '',
        image: '',
        mobile: '',
        dob: '',
        address: '',
        lat: 0,
        lang: 0,
        fcmId: '',
    },
    providerDetails: {
        providerId: '',
        name: '',
        email: '',
        password: '',
        imageSource: '',
        surname: '',
        mobile: '',
        services: [],
        description: '',
        address: '',
        lat: 0,
        lang: 0,
        invoice: '',
        status: '',
        fcmId: '',
        accountType: '',
    },
    providerDetailsFetched: false,
    userDetailsFetched: false
}

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case UPDATE_PROVIDER_DETAILS:
            return {
                ...state,
                providerDetails: action.payload,
                providerDetailsFetched: true
            }
        case UPDATE_USER_DETAILS:
            return {
                ...state,
                userDetails: action.payload,
                userDetailsFetched: true
            }
        case RESET_USER_DETAILS:
            return {
                ...state,
                userDetails: {
                    userId: '',
                    accountType: '',
                    email: '',
                    password: '',
                    username: '',
                    image: '',
                    mobile: '',
                    dob: '',
                    address: '',
                    lat: 0,
                    lang: 0,
                    fcmId: '',
                },
                providerDetails: {
                    providerId: '',
                    name: '',
                    email: '',
                    password: '',
                    imageSource: '',
                    surname: '',
                    mobile: '',
                    services: [],
                    description: '',
                    address: '',
                    lat: 0,
                    lang: 0,
                    invoice: '',
                    status: '',
                    fcmId: '',
                    accountType: '',
                }
            }
        default:
            return {
                ...state
            }
    }
}

export default userReducer;