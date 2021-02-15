import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  Image,
  StatusBar,
  ActivityIndicator,
  Platform,
  BackHandler,
  Dimensions,
} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import AsyncStorage from '@react-native-community/async-storage';
import RNExitApp from 'react-native-exit-app';
import firebaseAuth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import SimpleToast from 'react-native-simple-toast';
import database from '@react-native-firebase/database';
import HomeScreen from '../HomeScreen';
import DashboardScreen from '../DashboardScreen';
import ProDashboardScreen from '../ProDashboardScreen';
import AfterSplashScreen from '../AfterSplashScreen';
import AccountTypeScreen from '../AccountTypeScreen';
import FacebookGoogleScreen from '../FacebookGoogleScreen';
import RegisterScreen from '../RegisterScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import ProFacebookGoogleScreen from '../ProFacebookGoogleScreen';
import ProForgotPasswordScreen from '../ProForgotPasswordScreen';
import ProRegisterFBScreen from '../ProRegisterFBScreen';
import ProRegisterScreen from '../ProRegisterScreen';
import ProServiceSelectScreen from '../ProServiceSelectScreen';
import LoginPhoneScreen from '../LoginPhoneScreen';
import ProLoginPhoneScreen from '../ProLoginPhoneScreen';
import ProHomeScreen from '../ProHomeScreen';
import ProAccountTypeScreen from '../ProAccountTypeScreen';
import SelectAddressScreen from '../SelectAddressScreen';
import DialogComponent from '../DialogComponent';
import Config from '../Config';
import {
  updateUserDetails,
  updateProviderDetails,
} from '../../Redux/Actions/userActions';
import {
  getPendingJobRequest,
  getPendingJobRequestProvider,
  getAllWorkRequestPro,
  getAllWorkRequestClient,
} from '../../Redux/Actions/jobsActions';
import {fetchCountryCodes} from '../../Redux/Actions/validateionActions';
import {white} from '../../Constants/colors';

const screenWidth = Dimensions.get('screen').width;
const PRO_GET_PROFILE = Config.baseURL + 'employee/';
const USER_GET_PROFILE = Config.baseURL + 'users/';

class SplashScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      id: null,
      isLoading: false,
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      dialogLeftText: 'Cancel',
      dialogRightText: 'Retry',
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    setTimeout(this.splashTimeOut, 3000);
    const {fetchCountryCodes} = this.props;
    fetchCountryCodes();
  }

  componentDidUpdate() {
    const {
      jobsInfo: {requestsProvidersFetched, requestsFetched},
    } = this.props;
    if (
      requestsProvidersFetched &&
      requestsFetched &&
      this.state.isLoading === true
    )
      this.setState({isLoading: false});
  }

  splashTimeOut = () => {
    AsyncStorage.getItem('userId').then(userId => this.getUserType(userId));
  };

  getUserType = async userId => {
    messaging()
      .requestPermission()
      .then(authStatus => {
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          this.getFCMToken(userId);
        } else {
          this.leftButtonActon = null;
          this.rightButtonAction = () => {
            if (Platform.OS == 'android') BackHandler.exitApp();
            else RNExitApp.exitApp();
          };
          this.setState({
            isLoading: false,
            showDialog: true,
            dialogType: 'fb',
            dialogTitle: 'ENABLE NOTIFICATIONS!',
            dialogDesc:
              "You don't have permission for notification. Please enable notification then try again",
            dialogLeftText: 'Cancel',
            dialogRightText: 'Ok',
          });
        }
      })
      .catch(error => {
        this.leftButtonActon = null;
        this.rightButtonAction = () => {
          if (Platform.OS == 'android') BackHandler.exitApp();
          else RNExitApp.exitApp();
        };
        this.setState({
          isLoading: false,
          showDialog: true,
          dialogType: 'fb',
          dialogTitle: 'ENABLE NOTIFICATIONS!',
          dialogDesc:
            "You don't have permission for notification. Please enable notification then try again",
          dialogLeftText: 'Cancel',
          dialogRightText: 'Ok',
        });
      });
  };

  getFCMToken = async userId => {
    messaging()
      .getToken()
      .then(fcmToken => {
        if (fcmToken) {
          AsyncStorage.getItem('userType').then(userType =>
            this.autoLogin(userId, userType, fcmToken),
          );
        }
      })
      .catch(error => {
        this.leftButtonActon = null;
        this.rightButtonAction = () => {
          if (Platform.OS == 'android') BackHandler.exitApp();
          else RNExitApp.exitApp();
        };
        this.setState({
          isLoading: false,
          showDialog: true,
          dialogType: 'fb',
          dialogTitle: 'AUTH TOKEN!',
          dialogDesc:
            'Your device has not received an authentication token, check your internet connection and try again later',
          dialogLeftText: 'Cancel',
          dialogRightText: 'Ok',
        });
      });
  };

  inhouseLogin = (userId, userType, fcmToken) => {
    const {
      fetchPendingJobProviderInfo,
      fetchJobRequestHistoryPro,
      fetchJobRequestHistoryClient,
      fetchPendingJobRequest,
      updateProviderDetails,
      updateUserDetails,
    } = this.props;
    if (userType == 'Provider') {
      fetch(PRO_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(async responseJson => {
          var status;
          if (responseJson && responseJson.result) {
            const id = responseJson.data.id;
            const usersRef = database().ref(`users/${id}`);
            await usersRef.once('value', snapshot => {
              const value = snapshot.val();
              if (value) status = value.status;
              else {
                usersRef
                  .set({status: responseJson.data.status})
                  .then(() => {
                    console.log('status set');
                  })
                  .catch(e => {
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
              firebaseId: responseJson.data.id,
              status: status != undefined ? status : responseJson.data.status,
              fcmId: responseJson.data.fcm_id,
              accountType: responseJson.data.account_type,
            };
            updateProviderDetails(providerData);
            fetchJobRequestHistoryPro(userId);
            fetchPendingJobProviderInfo(this.props, userId, 'ProHome');
          } else {
            this.leftButtonActon = () => {
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.rightButtonAction = async () => {
              await this.autoLogin(userId, userType, fcmToken);
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.setState({
              isLoading: false,
              showDialog: true,
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: responseJson.message,
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          }
        })
        .catch(error => {
          this.setState({
            isLoading: false,
          });
          alert(error);
        });
    } else if (userType == 'User') {
      fetch(USER_GET_PROFILE + userId + '?fcm_id=' + fcmToken, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(async responseJson => {
          if (responseJson && responseJson.result) {
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
              firebaseId: responseJson.data.id,
              fcmId: responseJson.data.fcm_id,
            };
            const id = responseJson.data.id;
            const usersRef = database().ref(`users/${id}`);
            await usersRef.once('value', snapshot => {
              const value = snapshot.val();
              if (value) status = value.status;
              else {
                usersRef
                  .set({status: responseJson.data.status})
                  .then(() => {
                    console.log('status set');
                  })
                  .catch(e => {
                    console.log(e.message);
                  });
              }
            });
            updateUserDetails(userData);
            //Check if any Ongoing Request
            fetchJobRequestHistoryClient(userId);
            fetchPendingJobRequest(this.props, userId, 'Home');
          } else {
            this.leftButtonActon = () => {
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.rightButtonAction = async () => {
              await this.autoLogin(userId, userType, fcmToken);
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.setState({
              isLoading: false,
              showDialog: true,
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: responseJson.message,
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          }
        })
        .catch(error => {
          this.setState({
            isLoading: false,
          });
          alert(error);
        });
    }
  };

  autoLogin = async (userId, userType, fcmToken) => {
    if (userId !== null) {
      this.setState({
        isLoading: true,
      });
      AsyncStorage.getItem('auth')
        .then(storedInfo => {
          if (storedInfo) {
            const {email, password} = JSON.parse(storedInfo);
            firebaseAuth()
              .signInWithEmailAndPassword(email, password)
              .then(res => {
                this.inhouseLogin(userId, userType, fcmToken);
              })
              .catch(error => {
                SimpleToast.show(
                  'Something went wrong, try closing and reopening app',
                );
              });
          } else this.inhouseLogin(userId, userType, fcmToken);
        })
        .catch(e => {
          console.log('asyncstorage error', e);
        });
    } else {
      console.log('No Logged User');
      this.props.navigation.navigate('AfterSplash');
    }
  };

  changeDialogVisibility = () =>
    this.setState(prevState => ({showDialog: !prevState.showDialog}));

  render() {
    const {
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
    } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={white} />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null}
          transparent={true}
          animation="fade"
          width={screenWidth - 80}
          changeDialogVisibility={this.changeDialogVisibility}
          leftButtonAction={this.leftButtonActon}
          rightButtonAction={this.rightButtonAction}
          isLoading={false}
          titleText={dialogTitle}
          descText={dialogDesc}
          leftButtonText={dialogLeftText}
          rightButtonText={dialogRightText}
        />
        <Image
          style={{width: 150, height: 150}}
          source={require('../../images/kuchapa_logo.png')}
          resizeMode={'contain'}
        />

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator style={{height: 80}} color="#C00" size="large" />
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
  };
};

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
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    fetchCountryCodes: () => {
      dispatch(fetchCountryCodes());
    },
  };
};

const SplashScreenComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SplashScreen);

const AppStackNavigator = createStackNavigator({
  Splash: {
    screen: SplashScreenComponent,
    navigationOptions: {
      header: null,
    },
  },
  AfterSplash: {
    screen: AfterSplashScreen,
    navigationOptions: {
      header: null,
    },
  },
  FacebookGoogle: {
    screen: FacebookGoogleScreen,
    navigationOptions: {
      header: null,
    },
  },
  ForgotPassword: {
    screen: ForgotPasswordScreen,
    navigationOptions: {
      header: null,
    },
  },
  Register: {
    screen: RegisterScreen,
    navigationOptions: {
      header: null,
    },
  },
  LoginPhoneScreen: {
    screen: LoginPhoneScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProLoginPhoneScreen: {
    screen: ProLoginPhoneScreen,
    navigationOptions: {
      header: null,
    },
  },
  Dashboard: {
    screen: DashboardScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProDashboard: {
    screen: ProDashboardScreen,
    navigationOptions: {
      header: null,
    },
  },
  Home: {
    screen: HomeScreen,
    navigationOptions: {
      header: null,
    },
  },
  AccountType: {
    screen: AccountTypeScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProFacebookGoogle: {
    screen: ProFacebookGoogleScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProForgotPassword: {
    screen: ProForgotPasswordScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProAccountType: {
    screen: ProAccountTypeScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProRegisterFB: {
    screen: ProRegisterFBScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProRegister: {
    screen: ProRegisterScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProServiceSelect: {
    screen: ProServiceSelectScreen,
    navigationOptions: {
      header: null,
    },
  },
  SelectAddress: {
    screen: SelectAddressScreen,
    navigationOptions: {
      header: null,
    },
  },
  ProHome: {
    screen: ProHomeScreen,
    navigationOptions: {
      header: null,
    },
  },
});

const App = createAppContainer(AppStackNavigator);
export default App;

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
};
