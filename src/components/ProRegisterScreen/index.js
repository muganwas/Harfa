import React, {Component} from 'react';
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  BackHandler,
  Modal,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {connect} from 'react-redux';
import ShakingText from 'react-native-shaking-text';
import TextInputMask from 'react-native-text-input-mask';
import messaging from '@react-native-firebase/messaging';
import Axios from 'axios';
import firebaseAuth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import {
  updateProviderDetails,
  updateNewUserInfo,
} from '../../Redux/Actions/userActions';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import Config from '../Config';
import {black, white, themeRed, lightGray} from '../../Constants/colors';

const storageRef = storage().ref('/employees_info');
const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'employee/register';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return Platform.OS === 'ios' ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

class ProRegisterScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      name: '',
      surname: '',
      email: '',
      password: '',
      image: '',
      mobile: '',
      serviceName: 'Select services',
      serviceId: '',
      description: '',
      address: 'Select Address',
      lat: '',
      lang: '',
      invoice: 1,
      error: '',
      currentPage: 0,
      account_type: props.navigation.state.params.accountType,
      isLoading: false,
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      countryCode: '',
      dialogLeftText: 'Cancel',
      dialogRightText: 'Retry',
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const {navigation} = this.props;
    const countryCodeRef = database().ref('constants/countryCode');
    countryCodeRef.once('value').then(code => {
      this.setState({countryCode: code.val()});
    });
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

  checkValidation = () => {
    if (this.state.name == '') {
      this.setState({error: 'Enter name'});
    } else if (this.state.email == '') {
      this.setState({error: 'Enter surname'});
    } else if (this.state.mobile == '') {
      this.setState({error: 'Enter mobile'});
    } else if (this.state.serviceName == 'Select services') {
      this.setState({error: 'Select services'});
    } else if (this.state.description == '') {
      this.setState({error: 'Enter description'});
    } else if (
      this.state.address == '' ||
      this.state.address == 'Select Address'
    ) {
      this.setState({error: 'Enter address'});
    } else {
      this.registerTask();
    }
  };

  registerTask = async () => {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      const userData = {
        username: this.state.name,
        surname: this.state.surname,
        email: this.state.email,
        password: this.state.password,
        image: this.state.image,
        mobile: this.state.mobile,
        services: this.state.serviceId,
        description: this.state.description,
        address: this.state.address,
        lat: this.state.lat,
        lang: this.state.lng,
        invoice: this.state.invoice,
        fcm_id: fcmToken,
        type: 'normal',
        account_type: this.state.account_type,
      };
      this.setState({
        isLoading: true,
      });

      firebaseAuth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then(result => {
          const {fileName, path} = imageObject;
          const {updateNewUserInfo} = this.props;
          const {
            user,
            user: {uid},
          } = result;
          const newUser = Object.assign({uid}, userData);
          const userDataRef = storageRef.child(`/${uid}/${fileName}`);
          updateNewUserInfo(newUser);
          userDataRef
            .putFile(path)
            .then(uploadRes => {
              const {state} = uploadRes;
              if (state === 'success') {
                userDataRef.getDownloadURL().then(urlResult => {
                  let newUserData = cloneDeep(userData);
                  newUserData.image = urlResult;
                  try {
                    Axios.post(REGISTER_URL, {
                      data: JSON.stringify(newUserData),
                    })
                      .then(responseJson => {
                        if (
                          responseJson.status === 200 &&
                          responseJson.data.createdDate
                        ) {
                          this.leftButtonActon = () => {
                            this.setState({
                              isLoading: false,
                              showDialog: false,
                              dialogType: null,
                            });
                          };
                          this.rightButtonAction = () =>
                            this.props.navigation.goBack();
                          this.setState({
                            isLoading: false,
                            showDialog: true,
                            dialogType: 'fb',
                            dialogTitle: 'REGISTARTION SUCCESSFUL',
                            dialogDesc:
                              'We have send you a email verification link to your registered email id and then Login to your account',
                            dialogLeftText: 'Cancel',
                            dialogRightText: 'OK',
                          });
                        } else {
                          this.leftButtonActon = () => {
                            this.setState({
                              isLoading: false,
                              showDialog: false,
                              dialogType: null,
                            });
                          };
                          this.rightButtonAction = () => {
                            this.registerTask(this.state.imageDataObject);
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
                            dialogDesc: responseJson.data.message,
                            dialogLeftText: 'Cancel',
                            dialogRightText: 'Retry',
                          });
                        }
                      })
                      .catch(error => {
                        this.leftButtonActon = () => {
                          this.setState({
                            isLoading: false,
                            showDialog: false,
                            dialogType: null,
                          });
                        };
                        this.rightButtonAction = () => {
                          this.registerTask(this.state.imageDataObject);
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
                          dialogDesc: error.message,
                          dialogLeftText: 'Cancel',
                          dialogRightText: 'Retry',
                        });
                      })
                      .done();
                  } catch (e) {
                    this.leftButtonActon = () => {
                      this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null,
                      });
                    };
                    this.rightButtonAction = () => {
                      this.registerTask(this.state.imageDataObject);
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
                      dialogDesc:
                        'Something went wrong, please try again later',
                      dialogLeftText: 'Cancel',
                      dialogRightText: 'Retry',
                    });
                  }
                });
              }
            })
            .catch(error => {
              simpleToast.show('Image upload failed', simpleToast.SHORT);
              console.log('image upload error', error.messge);
            });
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use')
            this.setState({
              error: 'The email is already registerd.',
              isLoading: false,
            });
          else if (error.code === 'auth/invalid-email')
            this.setState({
              error: 'Your email address is invalid!',
              isLoading: false,
            });
          else if (error.code === 'auth/weak-password')
            this.setState({
              error: 'Your password is too weak',
              isLoading: false,
            });
          else
            this.setState({
              error: 'Something went wrong, please try again later',
              isLoading: false,
            });
        });
    }
  };

  getDataFromServiceScreen = data => {
    var data = data.split('/');
    this.setState({
      serviceId: data[0],
      serviceName: data[1],
    });
  };

  getDataFromAddAddressScreen = data => {
    var data = data.split('/');
    this.setState({
      address: data[0],
      lat: data[1],
      lng: data[2],
    });
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
      countryCode,
    } = this.state;
    return (
      <View style={StyleSheet.container}>
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
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                flex: 0.25,
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
                  marginTop: 5,
                }}
                onPress={() => this.props.navigation.goBack()}>
                <Image
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: black,
                    alignSelf: 'center',
                  }}
                  source={require('../../icons/arrow_back.png')}
                />
              </TouchableOpacity>
              <Image
                style={{width: 170, height: 170}}
                source={require('../../images/kuchapa_logo.png')}
                resizeMode="contain"
              />
            </View>

            <View style={styles.logincontainer}>
              <ShakingText
                style={{color: 'red', fontWeight: 'bold', marginBottom: 5}}>
                {this.state.error}
              </ShakingText>

              <View
                style={{
                  width: screenWidth - 50,
                  height: 50,
                  justifyContent: 'center',
                  marginBottom: 15,
                  backgroundColor: themeRed,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 10,
                    marginBottom: 10,
                  }}>
                  <View style={styles.buttonPrimaryDark}>
                    <Text style={[styles.text, {fontWeight: 'bold'}]}>
                      Account Type
                    </Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text
                      style={[styles.text, {color: black, fontWeight: 'bold'}]}>
                      {this.state.account_type}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/ic_user_64dp.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 45,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder={
                    this.state.currentPage == 0 ? 'Username' : 'Company name'
                  }
                  onChangeText={nameInput =>
                    this.setState({error: '', name: nameInput})
                  }
                />
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/email.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 45,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Email"
                  onChangeText={emailInput =>
                    this.setState({error: '', email: emailInput})
                  }
                />
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/ic_lock_64dp.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    height: 45,
                    marginLeft: 10,
                    color: black,
                  }}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={passwordInput =>
                    this.setState({error: '', password: passwordInput})
                  }
                />
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/mobile.png')}
                />
                <TextInputMask
                  style={{
                    width: screenWidth - 85,
                    height: 45,
                    marginLeft: 10,
                    color: black,
                  }}
                  refInput={ref => {
                    this.input = ref;
                  }}
                  keyboardType="phone-pad"
                  placeholder={`${countryCode} 000 000 000`}
                  value={this.state.mobile}
                  onChangeText={mobileInput =>
                    this.setState({error: '', mobile: mobileInput})
                  }
                  mask={`${countryCode} [000] [000] [000]`}
                />
              </View>

              <View style={styles.textView1}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/ic_settings_64dp.png')}
                />
                <Text
                  style={{
                    width: screenWidth - 85,
                    color: 'black',
                    fontSize: 16,
                    textAlignVertical: 'center',
                    marginLeft: 10,
                  }}
                  onPress={() =>
                    this.props.navigation.navigate('ProServiceSelect', {
                      onGoBack: this.getDataFromServiceScreen,
                    })
                  }>
                  {this.state.serviceName}
                </Text>
              </View>

              <View style={styles.textInputViewDes}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/description.png')}
                />
                <TextInput
                  style={{
                    width: screenWidth - 85,
                    color: black,
                    fontSize: 16,
                    marginLeft: 10,
                  }}
                  placeholder="Description"
                  multiline={true}
                  onChangeText={descriptionInput =>
                    this.setState({
                      error: '',
                      description: descriptionInput,
                    })
                  }
                />
              </View>

              <View style={styles.textView1}>
                <Image
                  style={{width: 15, height: 15}}
                  source={require('../../icons/maps_location.png')}
                />
                <Text
                  style={{
                    width: screenWidth - 85,
                    height: '100%',
                    color: 'black',
                    fontSize: 16,
                    textAlignVertical: 'center',
                    marginLeft: 10,
                  }}
                  onPress={() =>
                    this.props.navigation.navigate('SelectAddress', {
                      onGoBack: this.getDataFromAddAddressScreen,
                    })
                  }>
                  {this.state.address}
                </Text>
              </View>

              <View style={styles.textView}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 16,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    marginTop: 5,
                  }}>
                  Can you provide invoice
                </Text>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    marginTop: 10,
                    justifyContent: 'center',
                  }}>
                  <TouchableOpacity
                    style={
                      this.state.invoice == 1
                        ? styles.invoiceBorder
                        : styles.invoice
                    }
                    onPress={() => this.setState({invoice: 1})}>
                    <Text
                      style={{
                        color: black,
                        alignSelf: 'center',
                        textAlignVertical: 'center',
                      }}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      this.state.invoice == 0
                        ? styles.invoiceBorder
                        : styles.invoice,
                      {marginLeft: 20},
                    ]}
                    onPress={() => this.setState({invoice: 0})}>
                    <Text
                      style={{
                        color: black,
                        alignSelf: 'center',
                        textAlignVertical: 'center',
                      }}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={this.checkValidation}>
                <Text style={styles.text}>Continue</Text>
              </TouchableOpacity>
            </View>
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

const mapStateToProps = state => ({
  userInfo: state.userInfo,
});

const mapDispatchToProps = dispatch => ({
  updateProviderDetails: details => {
    dispatch(updateProviderDetails(details));
  },
  updateNewUserInfo: info => {
    dispatch(updateNewUserInfo(info));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProRegisterScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightGray,
  },
  logincontainer: {
    flex: 0.65,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonGreen: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: white,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: white,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  buttonRed: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: themeRed,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: themeRed,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  buttonPrimaryDark: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: themeRed,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: themeRed,
    borderWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },
  textInputView: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 45,
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
  textView1: {
    flex: 1,
    flexDirection: 'row',
    width: screenWidth - 40,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 5,
    paddingRight: 5,
  },
  textView: {
    flex: 1,
    width: screenWidth - 40,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 5,
    paddingRight: 5,
  },
  textInputViewDes: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 120,
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
  separator: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ebebeb',
    marginTop: 5,
    marginBottom: 5,
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
  text: {
    fontSize: 16,
    color: white,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
  },
  invoice: {
    height: 30,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: white,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 1,
    borderColor: 'grey',
    borderRadius: 5,
    justifyContent: 'center',
    color: white,
  },
  invoiceBorder: {
    height: 30,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 2,
    paddingBottom: 2,
    backgroundColor: white,
    borderColor: themeRed,
    shadowColor: themeRed,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    borderWidth: 0.1,
    justifyContent: 'center',
    alignContent: 'center',
    color: white,
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
