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
import rNES from 'react-native-encrypted-storage';
import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';
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
import firebaseAuth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import simpleToast from 'react-native-simple-toast';
import Axios from 'axios';
import DialogComponent from '../DialogComponent';
import {themeRed, black, white, lightGray} from '../../Constants/colors';
import SimpleToast from 'react-native-simple-toast';

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
      isErrorToast: '',
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

  responseFbCallbackCustomer = (error, result) => {
    if (error) {
      console.log('Error : ' + JSON.stringify(result));
    } else {
      const {
        id,
        name,
        email,
        picture: {
          data: {url},
        },
      } = result;
      this.setState({firebaseId: id, loginType: 'facebook'});
      this.fbGoogleLoginCustomerTask(name, email, url);
    }
  };

  facebookLoginTask = async () => {
    LoginManager.logInWithPermissions(['public_profile', 'email']).then(
      result => {
        if (result.isCancelled) {
          console.log('Login cancelled');
        } else {
          AccessToken.getCurrentAccessToken()
            .then(data => {
              const {updateUserAuthToken} = this.props;
              updateUserAuthToken(data.accessToken);
              const infoRequest = new GraphRequest(
                '/me?fields=email,name,picture',
                null,
                this.responseFbCallbackCustomer,
              );
              // Start the graph request.
              new GraphRequestManager().addRequest(infoRequest).start();
            })
            .catch(err => {
              this.setState({error: 'Could not authenticate, try again later'});
            });
        }
      },
      error => {
        console.log('Login fail with error: ' + error);
      },
    );
  };

  googleLoginTask = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      var result = await GoogleSignin.signIn();
      const {
        user: {name, email, photo, id},
      } = result;
      this.setState({firebaseId: id, loginType: 'google'});
      this.fbGoogleLoginCustomerTask(name, email, photo);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        console.log('SIGNIN CANCELLED >>');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        console.log('IN_PROGRESS >>');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        console.log('PLAY_SERVICES_NOT_AVAILABLE >>');
      } else {
        // some other error happened
        console.log('Error : ' + error.message);
      }
    }
  };

  fbGoogleLoginCustomerTask = async (name, email, image) => {
    this.setState({
      isLoading: true,
    });
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      const {
        fetchJobRequests,
        fetchJobRequestHistory,
        updateUserDetails,
      } = this.props;
      const userData = {
        acc_type: this.state.accountType,
        username: name,
        email: email,
        image: image,
        mobile: '',
        dob: '',
        fcm_id: fcmToken,
        type: this.state.loginType,
      };
      try {
        Axios.post(REGISTER_URL, {data: JSON.stringify(userData)})
          .then(async responseJson => {
            let status;
            if (responseJson.status === 200 && responseJson.data.createdDate) {
              const usersRef = database().ref(`users/${responseJson.data.id}`);
              await usersRef.once('value', snapshot => {
                const value = snapshot.val();
                if (value) status = value.status;
                else {
                  usersRef
                    .set({status: responseJson.data.online})
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
                        online: status ? status : response.data.online,
                        lang: response.data.lang,
                        firebaseId: this.state.firebaseId,
                        fcmId: response.data.fcm_id,
                      };
                      updateUserDetails(data);
                      //Store data like sharedPreference
                      rNES.setItem('userId', userId);
                      rNES.setItem('userType', 'User');
                      rNES.setItem('email', response.data.email);
                      rNES.setItem('firebaseId', this.state.firebaseId);
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
                        online: status ? status : responseJson.data.online,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        fcmId: responseJson.data.fcm_id,
                        firebaseId: this.state.firebaseId,
                      };
                      updateUserDetails(userData);
                      //Store data like sharedPreference
                      rNES.setItem('userId', id);
                      rNES.setItem('userType', 'User');
                      rNES.setItem('email', email);
                      rNES.setItem('firebaseId', this.state.firebaseId);
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
                this.fbGoogleLoginCustomerTask(name, email, image);
                this.setState({
                  showDialog: false,
                  dialogType: null,
                });
              };
              this.setState({
                isLoading: false,
                showDialog: true,
                dialogType: 'fb',
                dialogTitle: 'OOPS!',
                dialogDesc: responseJson.data.message,
                dialogLeftText: 'Cancel',
                dialogRightText: 'Retry',
              });
            }
          })
          .catch(error => {
            console.log('Error :' + error);
            this.leftButtonActon = () => {
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.rightButtonAction = () => {
              this.fbGoogleLoginCustomerTask(name, email, image);
              this.setState({
                showDialog: false,
                dialogType: null,
              });
            };
            this.setState({
              isLoading: false,
              showDialog: true,
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: 'Something went wrong, try again later.',
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          })
          .done();
      } catch (e) {
        console.log('Error :' + e);
        this.leftButtonActon = () => {
          this.setState({
            isLoading: false,
            showDialog: false,
            dialogType: null,
          });
        };
        this.rightButtonAction = () => {
          this.fbGoogleLoginCustomerTask(name, email, image);
          this.setState({
            showDialog: false,
            dialogType: null,
          });
        };
        this.setState({
          isLoading: false,
          showDialog: true,
          dialogType: 'fb',
          dialogTitle: 'OOPS!',
          dialogDesc: 'Something went wrong, try again later.',
          dialogLeftText: 'Cancel',
          dialogRightText: 'Retry',
        });
      }
    } else {
      this.setState({isLoading: false});
      simpleToast.show(
        'Something went wrong, try again later',
        simpleToast.SHORT,
      );
    }
  };

  checkValidation = () => {
    if (this.state.email == '')
      this.setState({error: 'Please enter a valid email address'});
    else if (this.state.password == '')
      this.setState({error: 'Enter Password'});
    else this.authenticateTask();
  };

  authenticateTask = async () => {
    const {
      fetchJobRequests,
      fetchJobRequestHistory,
      updateUserDetails,
    } = this.props;
    this.setState({
      isLoading: true,
    });
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      firebaseAuth()
        .signInWithEmailAndPassword(this.state.email, this.state.password)
        .then(result => {
          const {user} = result;
          if (user && typeof user === 'object') {
            const {
              _user: {uid},
            } = user;
            const data = {
              email: this.state.email,
              password: this.state.password,
              fcm_id: fcmToken,
            };
            try {
              let status;
              fetch(AUTHENTICATE_URL, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              })
                .then(response => response.json())
                .then(async responseJson => {
                  if (responseJson.result) {
                    const usersRef = database().ref(
                      `users/${responseJson.data.id}`,
                    );
                    await usersRef.once('value', snapshot => {
                      const value = snapshot.val();
                      if (value) status = value.status;
                      else {
                        usersRef
                          .set({status: responseJson.data.online})
                          .then(() => {
                            console.log('status set');
                          })
                          .catch(e => {
                            console.log(e.message);
                          });
                      }
                    });
                    this.setState({
                      isLoading: false,
                      isErrorToast: true,
                    });
                    const id = responseJson.data.id;
                    const userData = {
                      userId: responseJson.data.id,
                      accountType: responseJson.data.acc_type,
                      email: responseJson.data.email,
                      password: responseJson.data.password,
                      username: responseJson.data.username,
                      image: responseJson.data.image,
                      mobile: responseJson.data.mobile,
                      dob: responseJson.data.dob,
                      online: status ? status : responseJson.data.online,
                      address: responseJson.data.address,
                      lat: responseJson.data.lat,
                      lang: responseJson.data.lang,
                      fcmId: responseJson.data.fcm_id,
                      firebaseId: uid,
                    };
                    updateUserDetails(userData);
                    //Store data like sharedPreference
                    rNES.setItem('userId', id);
                    rNES.setItem('userType', 'User');
                    const auth = {
                      email: this.state.email,
                      password: this.state.password,
                    };
                    rNES.setItem('auth', JSON.stringify(auth));
                    rNES.setItem('firebaseId', uid);
                    fetchJobRequestHistory(id);
                    fetchJobRequests(this.props, id, 'Home');
                  } else {
                    console.log('Response Else ');
                    this.leftButtonActon = () => {
                      this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null,
                      });
                    };
                    this.rightButtonAction = () => {
                      this.this.authenticateTask();
                      this.setState({
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
                  console.log('API auth error --', error);
                  this.leftButtonActon = () => {
                    this.setState({
                      isLoading: false,
                      showDialog: false,
                      dialogType: null,
                    });
                  };
                  this.rightButtonAction = () => {
                    this.authenticateTask();
                    this.setState({
                      showDialog: false,
                      dialogType: null,
                    });
                  };
                  this.setState({
                    isLoading: false,
                    showDialog: true,
                    dialogType: 'fb',
                    dialogTitle: 'OOPS!',
                    dialogDesc:
                      'An error has occurred, please try again later.',
                    dialogLeftText: 'Cancel',
                    dialogRightText: 'Retry',
                  });
                })
                .done();
            } catch (e) {
              console.log('API auth error --', e);
              this.leftButtonActon = () => {
                this.setState({
                  isLoading: false,
                  showDialog: false,
                  dialogType: null,
                });
              };
              this.rightButtonAction = () => {
                this.authenticateTask();
                this.setState({
                  showDialog: false,
                  dialogType: null,
                });
              };
              this.setState({
                isLoading: false,
                showDialog: true,
                dialogType: 'fb',
                dialogTitle: 'OOPS!',
                dialogDesc: 'An error has occurred, please try again later.',
                dialogLeftText: 'Cancel',
                dialogRightText: 'Retry',
              });
            }
          }
        })
        .catch(error => {
          if (error.code === 'auth/user-not-found') {
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
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: "You've not registered yet, please register first",
              dialogLeftText: 'Cancel',
              dialogRightText: 'OK',
            });
          } else if (error.code === 'auth/wrong-password') {
            this.leftButtonActon = null;
            this.rightButtonAction = () => {
              this.setState({
                showDialog: false,
                dialogType: null,
              });
            };
            this.setState({
              isLoading: false,
              showDialog: true,
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: 'You entered a wrong password!',
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          } else {
            this.leftButtonActon = null;
            this.rightButtonAction = () => {
              this.setState({
                showDialog: false,
                dialogType: null,
              });
            };
            this.setState({
              isLoading: false,
              showDialog: true,
              dialogType: 'fb',
              dialogTitle: 'OOPS!',
              dialogDesc: 'Something went wrong, try again later.',
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
            console.log('login error code --', error.code);
          }
        });
    } else {
      this.leftButtonActon = null;
      this.rightButtonAction = () => {
        this.setState({
          showDialog: false,
          dialogType: null,
        });
      };
      this.setState({
        isLoading: false,
        showDialog: true,
        dialogType: 'fb',
        dialogTitle: 'OOPS!',
        dialogDesc: 'Something went wrong, try again later.',
        dialogLeftText: 'Cancel',
        dialogRightText: 'Retry',
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
                onPress={this.checkValidation}>
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
                onPress={this.facebookLoginTask.bind(this)}>
                <Image
                  style={{width: 20, height: 20}}
                  source={require('../../icons/facebook.png')}
                />
                <Text style={styles.text}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonFGContainer, {backgroundColor: '#DD4D3B'}]}
                onPress={this.googleLoginTask.bind(this)}>
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
