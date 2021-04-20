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
import ShakingText from 'react-native-shaking-text';
import AsyncStorage from '@react-native-community/async-storage';
import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import {
  getPendingJobRequest,
  getAllWorkRequestClient,
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import {
  updateUserDetails,
  updateUserAuthToken,
} from '../../Redux/Actions/userActions';
import {
  updateConfirmationObject,
  updateNumberSent,
  updateValidationCode,
  updateMobileNumber,
} from '../../Redux/Actions/validateionActions';
import WaitingDialog from '../WaitingDialog';
import firebaseAuth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import simpleToast from 'react-native-simple-toast';
import Axios from 'axios';
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

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'users/register/create';
const USER_GET_PROFILE = Config.baseURL + 'users/';
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
      updateValidationCode,
      updateConfirmationObject,
      validationInfo: {confirmation, numberSent},
    } = this.props;
    updateMobileNumber('');
    updateNumberSent(false);
    updateValidationCode('');
    updateConfirmationObject(null);
    if (!confirmation && !numberSent) {
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
        this.props.updateNumberSent(false);
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

  phoneLoginCustomerTask = async () => {
    this.setState({
      isLoading: true,
    });
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      const {
        fetchJobRequests,
        fetchJobRequestHistory,
        updateUserDetails,
        validationInfo: {mobile, countryCode},
        updateNumberSent,
      } = this.props;
      const newMobile = await sanitizeMobileNumber(mobile, countryCode, false);
      const userData = {
        acc_type: this.state.accountType,
        username: newMobile,
        mobile: newMobile,
        fcm_id: fcmToken,
        type: this.state.loginType,
      };
      try {
        Axios.post(REGISTER_URL, {data: JSON.stringify(userData)})
          .then(async responseJson => {
            if (responseJson.status === 200 && responseJson.data.createdDate) {
              const usersRef = database().ref(`users/${responseJson.data.id}`);
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
              const id = responseJson.data.id;
              try {
                /** get stored profile if exists */
                fetch(USER_GET_PROFILE + id + '?fcm_id=' + fcmToken, {
                  method: 'GET',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                })
                  .then(response => response.json())
                  .then(async response => {
                    this.setState({
                      isLoading: false,
                      isErrorToast: true,
                    });
                    if (response && response.result) {
                      const userId = response.data.id;
                      const data = {
                        userId: response.data.id,
                        accountType: response.data.acc_type,
                        email: response.data.email,
                        password: response.data.password,
                        username: response.data.username,
                        image: response.data.image,
                        mobile: response.data.mobile,
                        dob: response.data.dob,
                        address: response.data.address,
                        lat: response.data.lat,
                        lang: response.data.lang,
                        firebaseId: this.state.firebaseId,
                        fcmId: response.data.fcm_id,
                      };
                      updateUserDetails(data);
                      //Store data like sharedPreference
                      AsyncStorage.setItem('userId', userId);
                      AsyncStorage.setItem('userType', 'User');
                      AsyncStorage.setItem('email', response.data.email);
                      AsyncStorage.setItem('firebaseId', this.state.firebaseId);
                      //Check if any Ongoing Request
                      fetchJobRequestHistory(userId);
                      fetchJobRequests(this.props, userId, 'Home');
                    } else {
                      const userData = {
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
                        firebaseId: this.state.firebaseId,
                      };
                      updateUserDetails(userData);
                      //Store data like sharedPreference
                      AsyncStorage.setItem('userId', id);
                      AsyncStorage.setItem('userType', 'User');
                      AsyncStorage.setItem('email', email);
                      AsyncStorage.setItem('firebaseId', this.state.firebaseId);
                      fetchJobRequestHistory(id);
                      fetchJobRequests(this.props, id, 'Home');
                    }
                  })
                  .catch(error => {
                    this.setState({
                      isLoading: false,
                    });
                    SimpleToast('Something went wrong', SimpleToast.SHORT);
                  });
              } catch (e) {
                this.setState({
                  isLoading: false,
                });
                SimpleToast(
                  'Something went wrong, try again',
                  SimpleToast.SHORT,
                );
              }
            } else {
              this.leftButtonActon = () => {
                this.setState({
                  isLoading: false,
                  showDialog: false,
                  dialogType: null,
                });
              };
              this.rightButtonAction = () => {
                this.phoneLoginCustomerTask();
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
                dialogDesc: responseJson.data.message || 'Something went wrong',
                dialogLeftText: 'Cancel',
                dialogRightText: 'Retry',
              });
            }
          })
          .catch(error => {
            this.leftButtonActon = () => {
              updateNumberSent(false);
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.rightButtonAction = () => {
              this.phoneLoginCustomerTask();
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
              dialogDesc: 'Something went wrong',
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          })
          .done();
      } catch (e) {
        this.leftButtonActon = () => {
          updateNumberSent(false);
          this.setState({
            isLoading: false,
            showDialog: false,
            dialogType: null,
          });
        };
        this.rightButtonAction = () => {
          this.phoneLoginCustomerTask();
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
          dialogDesc: 'Something went wrong, try again.',
          dialogLeftText: 'Cancel',
          dialogRightText: 'Retry',
        });
      }
    } else {
      this.setState({isLoading: false});
      simpleToast.show(
        'Something went wrong, we could not retrieve your fcm token, restart app and try again',
        simpleToast.SHORT,
      );
    }
  };

  checkValidation = async () => {
    const wrongPhoneNumberFormat = 'Please enter a proper phone number';
    const noPhoneNumber = 'Please fill in your phone number';
    const noCountryCode = 'Please check your internet connection';
    const {
      validationInfo: {mobile, countryCode, countryAlpha2},
    } = this.props;
    if (!countryCode) this.setState({error: noCountryCode});
    else if (String(mobile.trim()) === String(countryCode.trim()))
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
    this.setState({
      isLoading: bool,
    });
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
        countryCode,
        mobile,
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
              <ShakingText
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                  marginBottom: 10,
                }}>
                {this.state.error}
              </ShakingText>
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
                    placeholder={`${countryCode || '+231'} 000 000 000`}
                    value={mobile}
                    onChangeText={phoneNumberInput => {
                      this.setState({
                        error: '',
                      });
                      updateMobileNumber(phoneNumberInput);
                    }}
                    mask={`${countryCode || '+231'} [000] [000] [000]`}
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
    fetchJobRequestHistory: clientId => {
      dispatch(getAllWorkRequestClient(clientId));
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
