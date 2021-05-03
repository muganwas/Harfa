import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import ShakingText from 'react-native-shaking-text';
import 'react-native-gesture-handler';
import {GoogleSignin, statusCodes} from '@react-native-community/google-signin';
import {
  getPendingJobRequest,
  getAllWorkRequestClient,
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import {
  updateUserDetails,
  updateUserAuthToken,
} from '../../Redux/Actions/userActions';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import {themeRed, black, white, lightGray} from '../../Constants/colors';
import {
  facebookLoginTask,
  fbGmailLoginTask,
  responseFbCallback,
  googleLoginTask,
  checkValidation,
  authenticateTask,
} from '../../controllers/users';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'users/register/create';
const USER_GET_PROFILE = Config.baseURL + 'users/';
const AUTHENTICATE_URL = Config.baseURL + 'users/authenticate';
const Android = Platform.OS === 'android';

const STATUS_BAR_HEIGHT = !Android ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return !Android ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" backgroundColor={white} />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

class FacebookGoogleScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      accountType: props.navigation.getParam('accountType'),
      email: '',
      password: '',
      opacity: 1,
      isLoading: false,
      firebaseId: '',
      loginType: null,
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
    GoogleSignin.configure();
    const {navigation} = this.props;
    navigation.addListener('willFocus', async () => {
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  };

  showDialogAction = (
    {title, message, leftButtonText, rightButtonText, dialogType},
    leftButtonAction,
    rightButtonAction,
  ) => {
    this.leftButtonActon = leftButtonAction;
    this.rightButtonAction = rightButtonAction;
    this.setState({
      isLoading: false,
      showDialog: true,
      dialogType: dialogType || '...',
      dialogTitle: title,
      dialogDesc: message,
      dialogLeftText: leftButtonText,
      dialogRightText: rightButtonText,
    });
  };

  responseFbCallbackCustomer = (error, result) =>
    responseFbCallback(
      error,
      result,
      (firebaseId, loginType) => this.setState({firebaseId, loginType}),
      this.fbGoogleLoginTaskCustomer,
    );

  googleLoginTaskCustomer = async () =>
    await googleLoginTask(
      (firebaseId, loginType) => this.setState({firebaseId, loginType}),
      this.fbGoogleLoginTaskCustomer,
    );

  fbGoogleLoginTaskCustomer = async (name, email, image, loginType) =>
    await fbGmailLoginTask({
      name,
      email,
      image,
      userType: 'User',
      firebaseId: this.state.firebaseId,
      accountType: this.state.accountType,
      registerUrl: REGISTER_URL,
      fetchProfileUrl: USER_GET_PROFILE,
      loginType,
      updateAppUserDetails: this.props.updateUserDetails,
      fetchAppUserJobRequests: this.props.fetchJobRequests,
      fetchJobRequestHistory: this.props.fetchJobRequestHistory,
      toggleLoading: this.changeWaitingDialogVisibility,
      onError: message =>
        this.showDialogAction(
          {
            title: 'LOGIN ERROR!',
            message,
            leftButtonText: 'Cancel',
            rightButtonText: 'Retry',
            dialogType: 'Error',
          },
          this.toggleDialogVisibility,
          () => {
            this.toggleDialogVisibility();
            this.fbGoogleLoginTaskCustomer(name, email, image, loginType);
          },
        ),
      props: this.props,
    });

  authenticateTaskCustomer = async () =>
    await authenticateTask({
      email: this.state.email,
      password: this.state.password,
      userType: 'User',
      authURL: AUTHENTICATE_URL,
      fetchAppUserJobRequests: this.props.fetchJobRequests,
      fetchJobRequestHistory: this.props.fetchJobRequestHistory,
      updateAppUserDetails: this.props.updateUserDetails,
      toggleLoading: this.changeWaitingDialogVisibility,
      onError: message =>
        this.showDialogAction(
          {
            title: 'AUTH ERROR!',
            message,
            leftButtonText: 'Cancel',
            rightButtonText: 'Retry',
            dialogType: 'Error',
          },
          this.toggleDialogVisibility,
          () => {
            this.toggleDialogVisibility();
            this.authenticateTaskCustomer();
          },
        ),
      props: this.props,
    });

  changeWaitingDialogVisibility = bool =>
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));

  toggleDialogVisibility = dialogType =>
    this.setState(prevState => ({
      isLoading: false,
      showDialog: !prevState.showDialog,
      dialogType: !prevState.dialogType ? dialogType : null,
    }));

  render() {
    const {
      email,
      password,
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
    } = this.state;
    const {updateUserAuthToken} = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null}
          transparent={true}
          animation="fade"
          width={screenWidth - 80}
          changeDialogVisibility={this.toggleDialogVisibility}
          leftButtonAction={this.leftButtonActon}
          rightButtonAction={this.rightButtonAction}
          isLoading={false}
          titleText={dialogTitle}
          descText={dialogDesc}
          leftButtonText={dialogLeftText}
          rightButtonText={dialogRightText}
        />
        <KeyboardAwareScrollView
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            alwaysBounceVertical: true,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <View
              style={{
                height: 200,
                width: screenWidth,
                backgroundColor: white,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  alignSelf: 'flex-start',
                  justifyContent: 'center',
                  marginLeft: 5,
                  marginTop: 15,
                }}
                onPress={() => this.props.navigation.goBack()}>
                <Image
                  style={{
                    width: 20,
                    tintColor: black,
                    height: 20,
                    alignSelf: 'center',
                  }}
                  source={require('../../icons/arrow_back.png')}
                />
              </TouchableOpacity>
              <Image
                style={{width: 140, height: 140}}
                source={require('../../images/kuchapa_logo.png')}
                resizeMode="contain"
              />
            </View>
            <View style={styles.logincontainer}>
              <ShakingText
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </ShakingText>
              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/email.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Email"
                  value={this.state.email}
                  onChangeText={emailInput =>
                    this.setState({email: emailInput})
                  }
                />
              </View>
              <View style={[styles.textInputView, {marginTop: 5}]}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/ic_lock_64dp.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 50,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Password"
                  value={this.state.password}
                  secureTextEntry={true}
                  onChangeText={passwordInput =>
                    this.setState({error: '', password: passwordInput})
                  }
                />
              </View>
              <View
                style={{
                  width: '100%',
                  marginTop: 10,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('LoginPhoneScreen')
                  }>
                  <Text
                    style={{
                      color: black,
                      fontWeight: 'bold',
                      fontSize: 13,
                      marginBottom: 5,
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                      alignSelf: 'flex-end',
                    }}>
                    Login with Phone Number
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('ForgotPassword')
                  }>
                  <Text
                    style={{
                      color: black,
                      fontWeight: 'bold',
                      fontSize: 13,
                      marginBottom: 5,
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                      alignSelf: 'flex-end',
                    }}>
                    Forgot password
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() =>
                  checkValidation(
                    email,
                    password,
                    e => this.setState({error: e}),
                    this.authenticateTaskCustomer,
                  )
                }>
                <Text style={styles.text}>Login</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text
                style={{
                  color: black,
                  fontSize: 13,
                  marginBottom: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                or Login with
              </Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity
                style={[styles.buttonFGContainer, {backgroundColor: '#3c599b'}]}
                onPress={() =>
                  facebookLoginTask(
                    updateUserAuthToken,
                    this.responseFbCallbackCustomer,
                  )
                }>
                <Image
                  style={{width: 20, height: 20}}
                  source={require('../../icons/facebook.png')}
                />
                <Text style={styles.text}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonFGContainer, {backgroundColor: '#DD4D3B'}]}
                onPress={this.googleLoginTaskCustomer}>
                <Image
                  style={{width: 20, height: 20}}
                  source={require('../../icons/google.png')}
                />
                <Text style={styles.text}>Gmail</Text>
              </TouchableOpacity>
              <View />
            </View>
            <TouchableOpacity
              style={{padding: 5}}
              onPress={() =>
                this.props.navigation.navigate('Register', {
                  accountType: this.state.accountType,
                })
              }>
              <Text
                style={{
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: 13,
                  marginBottom: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={this.changeWaitingDialogVisibility}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
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
    fetchJobRequests: (props, providerId, navTo) => {
      dispatch(getPendingJobRequest(props, providerId, navTo));
    },
    fetchJobRequestHistory: clientId => {
      dispatch(getAllWorkRequestClient(clientId));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    updateUserAuthToken: authToken => {
      dispatch(updateUserAuthToken(authToken));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FacebookGoogleScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightGray,
  },
  logincontainer: {
    width: screenWidth - 15,
    flexDirection: 'column',
    height: 275,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 4,
  },
  separator: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ebebeb',
    marginTop: 5,
    marginBottom: 5,
  },
  textInputView: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    width: 175,
    height: 40,
    backgroundColor: themeRed,
    shadowColor: black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonFGContainer: {
    width: screenWidth / 2 - 30,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 5,
    marginBottom: 10,
    marginLeft: 10,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: white,
    textAlign: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
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
});
