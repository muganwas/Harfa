import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Image, StatusBar, ActivityIndicator, Platform, Alert, BackHandler } from 'react-native';
import { createAppContainer, } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import AsyncStorage from '@react-native-community/async-storage';
import RNExitApp from 'react-native-exit-app';
import firebase from 'react-native-firebase';
import HomeScreen from './HomeScreen';
import DashboardScreen from './DashboardScreen';
import AfterSplashScreen from './AfterSplashScreen';
import AccountTypeScreen from './AccountTypeScreen';
import FacebookGoogleScreen from './FacebookGoogleScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ProFacebookGoogleScreen from './ProFacebookGoogleScreen';
import ProForgotPasswordScreen from './ProForgotPasswordScreen';
import ProRegisterFBScreen from './ProRegisterFBScreen';
import ProRegisterScreen from './ProRegisterScreen';
import ProServiceSelectScreen from './ProServiceSelectScreen';
import ProHomeScreen from './ProHomeScreen';
import ProAccountTypeScreen from './ProAccountTypeScreen';
import SelectAddressScreen from './SelectAddressScreen';
import Config from './Config';
import ProviderDetails from './ProviderDetails';
import UserDetails from './UserDetails';
import { getPendingJobRequest, getPendingJobRequestProvider, getAllWorkRequestPro, getAllWorkRequestClient } from '../Redux/Actions/jobsActions';

const PRO_GET_PROFILE = Config.baseURL + "employee/";
const USER_GET_PROFILE = Config.baseURL + "users/";
const database = firebase.database();

class SplashScreen extends Component {

    constructor(props) {
        super(props);

        this.state = {
            id: null,
            isLoading: false,
        };
    };

    componentDidMount() {
        setTimeout(this.splashTimeOut, 3000);
    }

    componentDidUpdate() {
        const { jobsInfo: { requestsProvidersFetched, requestsFetched } } = this.props;
        if (requestsProvidersFetched && requestsFetched && this.state.isLoading === true) this.setState({ isLoading: false });
    }

    splashTimeOut = () => {
        AsyncStorage.getItem('userId')
            .then((userId) => this.getUserType(userId));
    }

    getUserType = async userId => {

        firebase.messaging().hasPermission().
            then(async enabled => {
                if (enabled) {
                    this.getFCMToken(userId);
                }
                else {
                    await firebase.messaging().requestPermission()
                        .then(() => {
                            this.getFCMToken(userId);
                        })
                        .catch(error => {
                            Alert.alert(
                                "Permission Request",
                                "You don't have permission for notification. Please enable notification then try again ",
                                [
                                    {
                                        text: 'Back',
                                        onPress: () => {
                                            if (Platform.OS == 'android')
                                                BackHandler.exitApp();
                                            else
                                                RNExitApp.exitApp();
                                        },
                                        style: 'cancel',
                                    },
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            if (Platform.OS == 'android')
                                                BackHandler.exitApp();
                                            else
                                                RNExitApp.exitApp();
                                        },
                                    },
                                ]
                            );

                            //User has rejected permissions
                        });
                }
            });
    }

    getFCMToken = async userId => {

        const fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
            console.log("Splash FCMID >> " + fcmToken);

            AsyncStorage.getItem('userType')
                .then((userType) => this.autoLogin(userId, userType, fcmToken));
        }
        else {
            // user doesn't have a device token yet
            console.log("User don't have Token")
        }
    }

    autoLogin = (userId, userType, fcmToken) => {
        const { fetchPendingJobProviderInfo, fetchJobRequestHistoryPro, fetchJobRequestHistoryClient, fetchPendingJobRequest } = this.props;
        if (userId !== null) {
            this.setState({
                isLoading: true,
            });
            if (userType == 'Provider') {
                fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                })
                    .then((response) => response.json())
                    .then(async responseJson => {
                        var status;
                        if (responseJson.result) {

                            const id = responseJson.data.id;
                            const usersRef = database.ref(`users/${id}`);
                            await usersRef.once('value', snapshot => {
                                const value = snapshot.val();
                                if (value)
                                    status = value.status;
                                else {
                                    usersRef.set({ 'status': responseJson.data.status }).then(() => {
                                        console.log('status set');
                                    }).
                                        catch(e => {
                                            console.log(e.message);
                                        });
                                }
                            });
                            var providerData = {
                                providerId: responseJson.data.id,
                                name: responseJson.data.username,
                                email: responseJson.data.email,
                                password: responseJson.data.password,
                                imageSource: responseJson.data.image,
                                surname: responseJson.data.surname,
                                mobile: responseJson.data.mobile,
                                services: responseJson.data.services,
                                description: responseJson.data.description,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                invoice: responseJson.data.invoice,
                                status: status != undefined ? status : responseJson.data.status,
                                fcmId: responseJson.data.fcm_id,
                                accountType: responseJson.data.account_type
                            }
                            ProviderDetails.Provider = providerData;
                            fetchJobRequestHistoryPro(userId);
                            fetchPendingJobProviderInfo(this.props, userId, 'ProHome');
                        }
                        else {
                            this.setState({
                                isLoading: false
                            })
                            Alert.alert(
                                "OOPS !",
                                responseJson.message,
                                [
                                    {
                                        text: 'Cancel',
                                        onPress: () => console.log('Cancel Pressed'),
                                    },
                                    {
                                        text: 'Retry',
                                        onPress: () => this.autoLogin(userId, userType, fcmToken),
                                    },
                                ]
                            );
                        }
                    })
                    .catch(error => {
                        this.setState({
                            isLoading: false
                        })
                        alert(error);
                        console.log('error in autologin')
                        console.log(JSON.stringify(responseJson));
                    });
            }
            else if (userType == 'User') {

                fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                })
                    .then(response => response.json())
                    .then(responseJson => {
                        if (responseJson.result) {
                            var userData = {
                                userId: responseJson.data.id,
                                accountType: responseJson.data.acc_type,
                                email: responseJson.data.email,
                                password: responseJson.data.password,
                                username: responseJson.data.username,
                                image: responseJson.data.image,
                                mobile: responseJson.data.mobile,
                                dob: responseJson.data.dob,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                fcmId: responseJson.data.fcm_id,
                            }
                            UserDetails.User = userData;
                            //Check if any Ongoing Request 
                            fetchJobRequestHistoryClient(userId);
                            fetchPendingJobRequest(this.props, userId, 'Home');
                        }
                        else {
                            this.setState({
                                isLoading: false
                            })
                            Alert.alert(
                                "OOPS !",
                                responseJson.message,
                                [
                                    {
                                        text: 'Cancel',
                                        onPress: () => console.log('Cancel Pressed'),
                                    },
                                    {
                                        text: 'Retry',
                                        onPress: () => this.autoLogin(userId, userType, fcmToken),
                                    },
                                ]
                            );
                        }
                    }).
                    catch((error) => {
                        this.setState({
                            isLoading: false
                        })
                        alert(error);
                        console.log(JSON.stringify(responseJson));
                    });
            }
        }
        else {
            console.log("No Logged User");
            this.props.navigation.navigate("AfterSplash");
        }
    }

    render() {

        return (
            <View style={styles.container}>

                <StatusBar barStyle='light-content' backgroundColor='#000000' />

                <Image
                    style={{ width: 250, height: 250 }}
                    source={require('../images/harfa_logo.png')} />

                {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )}
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        jobsInfo: state.jobsInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchPendingJobRequest: (props, uid, navigateTo) => {
            dispatch(getPendingJobRequest(props, uid, navigateTo));
        },
        fetchPendingJobProviderInfo: (props, proId, navigateTo) => {
            dispatch(getPendingJobRequestProvider(props, proId, navigateTo));
        },
        fetchJobRequestHistoryPro: providerId => {
            dispatch(getAllWorkRequestPro(providerId));
        },
        fetchJobRequestHistoryClient: clientId => {
            dispatch(getAllWorkRequestClient(clientId));
        }
    }
}

const AppStackNavigator = createStackNavigator({
    Splash:
    {
        screen: connect(mapStateToProps, mapDispatchToProps)(SplashScreen),
        navigationOptions: {
            header: null
        }
    },
    AfterSplash: {
        screen: AfterSplashScreen,
        navigationOptions: {
            header: null
        }
    },
    // LoginPhone : {
    //     screen: LoginPhoneScreen,
    //     navigationOptions: {
    //         header: null
    //     }
    // },
    FacebookGoogle: {
        screen: FacebookGoogleScreen,
        navigationOptions: {
            header: null
        }
    },
    ForgotPassword: {
        screen: ForgotPasswordScreen,
        navigationOptions: {
            header: null
        }
    },
    // Verification: {
    //     screen: VerificationScreen,
    //     navigationOptions: {
    //         header: null
    //     }
    // },
    Register: {
        screen: RegisterScreen,
        navigationOptions: {
            header: null
        }
    },
    Dashboard: {
        screen: DashboardScreen,
        navigationOptions: {
            header: null
        }
    },
    Home: {
        screen: HomeScreen,
        navigationOptions: {
            header: null
        }
    },
    AccountType: {
        screen: AccountTypeScreen,
        navigationOptions: {
            header: null
        }
    },
    ProFacebookGoogle: {
        screen: ProFacebookGoogleScreen,
        navigationOptions: {
            header: null
        }
    },
    ProForgotPassword: {
        screen: ProForgotPasswordScreen,
        navigationOptions: {
            header: null
        }
    },
    ProAccountType: {
        screen: ProAccountTypeScreen,
        navigationOptions: {
            header: null
        }
    },
    ProRegisterFB: {
        screen: ProRegisterFBScreen,
        navigationOptions: {
            header: null
        }
    },
    ProRegister: {
        screen: ProRegisterScreen,
        navigationOptions: {
            header: null
        }
    },
    ProServiceSelect: {
        screen: ProServiceSelectScreen,
        navigationOptions: {
            header: null
        }
    },
    SelectAddress: {
        screen: SelectAddressScreen,
        navigationOptions: {
            header: null
        }
    },
    ProHome: {
        screen: ProHomeScreen,
        navigationOptions: {
            header: null
        }
    },
});

const App = createAppContainer(AppStackNavigator);
export default App;

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    }
}
