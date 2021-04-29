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
import rNES from 'react-native-encrypted-storage';
import RNExitApp from 'react-native-exit-app';
import SimpleToast from 'react-native-simple-toast';
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
import {
  getFCMToken,
  getUserType,
  autoLogin,
  inhouseLogin,
} from '../../controllers/users';
import {fetchCountryCodes} from '../../Redux/Actions/validationActions';
import {white} from '../../Constants/colors';

const screenWidth = Dimensions.get('screen').width;
const Android = Platform.OS === 'android';

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
    setTimeout(() => this.splashTimeOut(), 3000);
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

  splashTimeOut = async () => {
    try {
      const {navigation} = this.props;
      const userId = await rNES.getItem('userId');
      getUserType(
        () =>
          getFCMToken(
            userId,
            (userId, userType, fcmToken) =>
              autoLogin(
                {userId, userType, fcmToken},
                () => this.setState({isLoading: true}),
                (userId, userType, fcmToken) =>
                  inhouseLogin(
                    {userId, userType, fcmToken, props: this.props},
                    () => {
                      this.leftButtonActon = null;
                      this.rightButtonAction = () => {
                        this.setState({
                          isLoading: false,
                          showDialog: false,
                          dialogType: null,
                        });
                      };
                      this.setState({
                        isLoading: false,
                        showDialog: true,
                        dialogType: '...',
                        dialogTitle: 'OOPS!',
                        dialogDesc: responseJson.message,
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok',
                      });
                    },
                    () => this.setState({isLoading: false}),
                  ),
                () => navigation.navigate('AfterSplash'),
              ),
            e => {
              this.leftButtonActon = null;
              this.rightButtonAction = () => {
                if (Android) BackHandler.exitApp();
                else RNExitApp.exitApp();
              };
              this.setState({
                isLoading: false,
                showDialog: true,
                dialogType: '...',
                dialogTitle: 'AUTH TOKEN!',
                dialogDesc:
                  'Your device has not received an authentication token, check your internet connection and try again later',
                dialogLeftText: 'Cancel',
                dialogRightText: 'Ok',
              });
              console.log('get token error', e);
            },
          ),
        () => {
          this.leftButtonActon = null;
          this.rightButtonAction = () => {
            if (Android) BackHandler.exitApp();
            else RNExitApp.exitApp();
          };
          this.setState({
            isLoading: false,
            showDialog: true,
            dialogType: '...',
            dialogTitle: 'ENABLE NOTIFICATIONS!',
            dialogDesc:
              "You don't have permission for notification. Please enable notification then try again",
            dialogLeftText: 'Cancel',
            dialogRightText: 'Ok',
          });
        },
        e => {
          this.leftButtonActon = null;
          this.rightButtonAction = () => {
            if (Android) BackHandler.exitApp();
            else RNExitApp.exitApp();
          };
          this.setState({
            isLoading: false,
            showDialog: true,
            dialogType: '...',
            dialogTitle: 'ENABLE NOTIFICATIONS!',
            dialogDesc:
              "You don't have permission for notification. Please enable notification then try again",
            dialogLeftText: 'Cancel',
            dialogRightText: 'Ok',
          });
        },
      );
    } catch (e) {
      SimpleToast('Something went wrong, try again.');
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
