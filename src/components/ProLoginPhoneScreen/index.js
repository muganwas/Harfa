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
  ActivityIndicator,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import 'react-native-gesture-handler';
import {
  getPendingJobRequest,
  getPendingJobRequestProvider,
  getAllWorkRequestPro,
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import {
  updateUserDetails,
  updateUserAuthToken,
  updateProviderDetails,
  updateProviderAuthToken,
} from '../../Redux/Actions/userActions';
import {
  updateConfirmationObject,
  updateNumberSent,
  updateValidationCode,
  updateMobileNumber,
} from '../../Redux/Actions/validationActions';
import WaitingDialog from '../WaitingDialog';
import firebaseAuth from '@react-native-firebase/auth';
import TextInputMask from 'react-native-text-input-mask';
import {phoneNumberCheck, sanitizeMobileNumber} from '../../misc/helpers';
import DialogComponent from '../DialogComponent';
import {
  themeRed,
  inactiveBackground,
  black,
  white,
  lightGray,
} from '../../Constants/colors';
import {phoneLoginTask} from '../../controllers/users';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'employee/register/create';
const PRO_GET_PROFILE = Config.baseURL + 'employee/';
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

class LoginPhoneScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      accountType: props.navigation.getParam('accountType'),
      opacity: 1,
      isLoading: false,
      isErrorToast: '',
      firebaseId: '',
      loginType: 'phone',
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
    const {
      updateMobileNumber,
      updateNumberSent,
      updateConfirmationObject,
      validationInfo: {numberSent, confirmation},
    } = this.props;
    updateMobileNumber('');
    updateNumberSent(false);
    updateValidationCode('');
    updateConfirmationObject(null);
    if (!numberSent && !confirmation) {
      this.props.navigation.goBack();
    }
    return true;
  };

  phoneConfirmationTask = async number => {
    const {updateConfirmationObject, updateNumberSent} = this.props;
    try {
      updateNumberSent(true);
      await firebaseAuth()
        .signInWithPhoneNumber(number)
        .then(confirmation => {
          updateConfirmationObject(confirmation);
        });
    } catch (e) {
      const message =
        e.message && e.message.indexOf('Unable to resolve')
          ? 'Please check your interenet connection and try again.'
          : 'Something went wrong, try again later.';
      this.leftButtonActon = () => {
        this.setState({
          isLoading: false,
          showDialog: false,
          dialogType: null,
        });
      };
      this.rightButtonAction = () => this.phoneConfirmationTask(number);
      this.setState({
        isLoading: false,
        showDialog: true,
        dialogType: 'fb',
        dialogTitle: 'OOPS!',
        dialogDesc: message,
        dialogLeftText: 'Cancel',
        dialogRightText: 'Retry',
      });
    }
  };

  phoneLoginCustomerTask = async () =>
    await phoneLoginTask({
      userType: 'Provider',
      accountType: this.state.accountType,
      loginType: this.state.loginType,
      firebaseId: this.state.firebaseId,
      fetchJobRequests: this.props.fetchProvidersJobRequests,
      fetchJobRequestHistory: this.props.fetchJobRequestHistory,
      validationInfo: this.props.validationInfo,
      updateUserDetails: this.props.updateProviderDetails,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      registerURL: REGISTER_URL,
      getProfileURL: PRO_GET_PROFILE,
      onError: msg => {
        this.leftButtonActon = () => {
          this.props.updateNumberSent(false);
          this.setState({
            isLoading: false,
            showDialog: false,
            dialogType: null,
          });
        };
        this.rightButtonAction = () => {
          this.phoneLoginCustomerTask();
          this.setState({
            showDialog: false,
            dialogType: null,
          });
        };
        this.setState({
          isLoading: false,
          showDialog: true,
          dialogType: 'error',
          dialogTitle: 'OOPS!',
          dialogDesc: msg,
          dialogLeftText: 'Cancel',
          dialogRightText: 'Retry',
        });
      },
      props: this.props,
    });

  checkValidation = async () => {
    const wrongPhoneNumberFormat = 'Please enter a proper phone number';
    const noPhoneNumber = 'Please fill in your phone number';
    const noCountryCode = 'Please check your internet connection';
    const {
      validationInfo: {mobile, countryCode, countryAlpha2},
    } = this.props;
    if (!countryCode) {
      this.setState({error: noCountryCode});
    } else if (String(mobile.trim()) === String(countryCode.trim()))
      this.setState({error: noPhoneNumber});
    else {
      const number = await sanitizeMobileNumber(mobile, countryCode, false);
      phoneNumberCheck(number, countryAlpha2).then(isValid => {
        if (!isValid) this.setState({error: wrongPhoneNumberFormat});
        else {
          this.phoneConfirmationTask(number);
        }
      });
    }
  };

  confirmValidationCode = code => {
    const {
      validationInfo: {confirmation},
    } = this.props;
    if (code && confirmation) {
      confirmation
        .confirm(code)
        .then(response => {
          /*const {
            additionalUserInfo: {isNewUser},
            user: {_user},
          } = response;*/
          if (response) this.phoneLoginCustomerTask();
        })
        .catch(e => {
          const message =
            e.code.indexOf('invalid-verification') > -1
              ? 'You used a wrong code, please try again.'
              : 'Something went wrong, please try again';
          this.leftButtonActon = () => {
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
            dialogDesc: message,
            dialogLeftText: 'OK',
            dialogRightText: 'Retry',
          });
        });
    }
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
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
    const {
      validationInfo: {
        confirmation,
        numberSent,
        validationCode,
        mobile,
        countryCode,
      },
      updateValidationCode,
      updateMobileNumber,
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
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
                onPress={this.handleBackButtonClick}>
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
              <View style={{padding: 20}}>
                <Text style={{textAlign: 'center', fontWeight: '500'}}>
                  Make sure you can receive messages on the provided number,
                  we'll send you a OTP
                </Text>
              </View>
              { this.state.error && <Text
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </Text> }
              <View style={[styles.textInputView, {marginTop: 5}]}>
                {!confirmation && !numberSent && (
                  <Image
                    style={{width: 15, height: 15, marginLeft: 5}}
                    source={require('../../icons/mobile.png')}
                  />
                )}
                {numberSent ? (
                  <TextInput
                    style={{
                      width: screenWidth - 85,
                      height: 50,
                      marginLeft: 10,
                      color: black,
                    }}
                    value={validationCode}
                    onChangeText={text => updateValidationCode(text)}
                  />
                ) : (
                  <TextInputMask
                    style={{
                      width: screenWidth - 85,
                      height: 50,
                      marginLeft: 10,
                      color: black,
                    }}
                    refInput={ref => {
                      this.input = ref;
                    }}
                    keyboardType="phone-pad"
                    placeholder={`${countryCode} 000 000 000`}
                    value={mobile}
                    onChangeText={phoneNumberInput => {
                      this.setState({
                        error: '',
                      });
                      updateMobileNumber(phoneNumberInput);
                    }}
                    mask={`${countryCode} [000] [000] [000]`}
                  />
                )}
              </View>
              <TouchableOpacity
                style={
                  !confirmation && numberSent
                    ? styles.buttonContainerInactive
                    : styles.buttonContainer
                }
                disabled={!confirmation && numberSent}
                onPress={
                  confirmation && numberSent
                    ? () => this.confirmValidationCode(validationCode)
                    : this.checkValidation
                }>
                <View style={{flex: 1}}>
                  {numberSent ? (
                    !confirmation ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={styles.text}>Send OTP</Text>
                    )
                  ) : (
                    <Text style={styles.text}>Request OTP</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{padding: 5}}
              onPress={() => {
                if (confirmation && numberSent) this.checkValidation();
                else
                  this.props.navigation.navigate('Register', {
                    accountType: this.state.accountType,
                  });
              }}>
              <Text
                style={{
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: 13,
                  marginBottom: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {confirmation && numberSent && 'Request new code'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
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
    validationInfo: state.validationInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchJobRequests: (props, providerId, navTo) => {
      dispatch(getPendingJobRequest(props, providerId, navTo));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    updateUserAuthToken: authToken => {
      dispatch(updateUserAuthToken(authToken));
    },
    updateValidationCode: code => {
      dispatch(updateValidationCode(code));
    },
    updateConfirmationObject: confirmation => {
      dispatch(updateConfirmationObject(confirmation));
    },
    updateNumberSent: sent => {
      dispatch(updateNumberSent(sent));
    },
    updateMobileNumber: number => {
      dispatch(updateMobileNumber(number));
    },
    fetchProvidersJobRequests: (props, providerId, navTo) => {
      dispatch(getPendingJobRequestProvider(props, providerId, navTo));
    },
    fetchJobRequestHistory: providerId => {
      dispatch(getAllWorkRequestPro(providerId));
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    updateProviderAuthToken: token => {
      dispatch(updateProviderAuthToken(token));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoginPhoneScreen);

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
  buttonContainerInactive: {
    width: 175,
    height: 40,
    backgroundColor: inactiveBackground,
    shadowColor: white,
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
