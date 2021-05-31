import React, {Component} from 'react';
import {
  View,
  StatusBar,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ImageBackground,
  Platform,
  BackHandler,
} from 'react-native';
import {connect} from 'react-redux';
import ShakingText from 'react-native-shaking-text';
import DateTimePicker from 'react-native-modal-datetime-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import TextInputMask from 'react-native-text-input-mask';
import moment from 'moment';
import RNExitApp from 'react-native-exit-app';
import messaging from '@react-native-firebase/messaging';
import Config from '../Config';
import {updateNewUserInfo} from '../../Redux/Actions/userActions';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import {registerTask, checkValidation} from '../../controllers/users';
import {
  selectPhoto,
  emailCheck,
  passwordCheck,
  phoneNumberCheck,
} from '../../misc/helpers';
import {black, white, themeRed} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'users/register/create';

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

class RegisterScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      accountType: props.navigation.state.params.accountType, //From AccountTypeScreen
      username: '',
      email: '',
      password: '',
      dob: 'Date of Birth',
      error: '',
      mobile: '',
      isVisible: false,
      imageURI: null,
      imageDataObject: null,
      isLoading: false,
      isToastShow: false,
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
    this.props.navigation.goBack();
    return true;
  };

  handlePicker = date => {
    this.setState({
      isVisible: false,
      dob: moment(date).format('D-MMMM-YYYY'),
      error: false,
    });
  };

  hidePicker = () => {
    this.setState({
      isVisible: false,
      error: '',
    });
  };

  showPicker = () => {
    this.setState({
      isVisible: true,
      error: '',
    });
  };

  selectPhotoReg = async () =>
    await selectPhoto(obj =>
      this.setState({
        imageURI: obj.imageURI,
        imageDataObject: obj.imageDataObject,
        error: obj.error,
      }),
    );

  checkValidation = async () => {
    const {mobile, imageURI, username, dob, email, password} = this.state;
    if (!imageURI) {
      this.setState({error: 'Select profile image'});
    } else if (!username) {
      this.setState({error: 'Enter username'});
    } else if (dob === 'Date of Birth') {
      this.setState({error: 'Select date of birth'});
    } else {
      const wrongPhoneNumberFormat = 'Please enter a proper phone number';
      const noPhoneNumber = 'Please fill in your phone number';
      const noCountryCode = 'Please check your internet connection';
      const {
        validationInfo: {countryCode, countryAlpha2},
      } = this.props;
      const isValidPhoneNumber = await phoneNumberCheck(mobile, countryAlpha2);
      if (!countryCode) {
        this.setState({error: noCountryCode});
        return;
      } else if (String(mobile.trim()) === String(countryCode.trim())) {
        this.setState({error: noPhoneNumber});
        return;
      } else if (!isValidPhoneNumber) {
        this.setState({error: wrongPhoneNumberFormat});
        return;
      } else {
        await checkValidation(
          email,
          password,
          error => this.setState({error}),
          this.registerTaskCustomer,
        );
      }
    }
  };

  registerTaskCustomer = async () => {
    const fcmToken = await messaging().getToken();
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled && fcmToken) {
      await registerTask({
        userType: 'Customer',
        fcmToken,
        username: this.state.username,
        email: this.state.email,
        mobile: this.state.mobile,
        password: this.state.password,
        dob: this.state.dob,
        accountType: this.state.accountType,
        imageObject: this.state.imageDataObject,
        type: 'normal',
        toggleIsLoading: this.changeWaitingDialogVisibility,
        registerURL: REGISTER_URL,
        updateNewUserInfo: this.props.updateNewUserInfo,
        onSuccess: msg => {
          this.leftButtonActon = () => {
            this.setState({
              isLoading: false,
              showDialog: false,
              dialogType: null,
            });
          };
          this.rightButtonAction = () => this.props.navigation.goBack();
          this.setState({
            isLoading: false,
            showDialog: true,
            dialogType: 'success',
            dialogTitle: 'REGISTERED SUCCESSFULLY!',
            dialogDesc: msg,
            dialogLeftText: 'Cancel',
            dialogRightText: 'Ok',
          });
        },
        onError: (error, simple) => {
          if (simple) {
            this.setState({
              error,
              isLoading: false,
            });
          } else {
            this.leftButtonActon = () => {
              this.setState({
                isLoading: false,
                showDialog: false,
                dialogType: null,
              });
            };
            this.rightButtonAction = async () => {
              await this.registerTaskCustomer();
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
              dialogDesc: error,
              dialogLeftText: 'Cancel',
              dialogRightText: 'Retry',
            });
          }
        },
      });
    } else {
      this.leftButtonActon = null;
      this.rightButtonAction = () => {
        if (Platform.OS == 'android') BackHandler.exitApp();
        else RNExitApp.exitApp();
      };
      this.setState({
        isLoading: false,
        showDialog: true,
        dialogType: 'error',
        dialogTitle: 'ENABLE NOTIFICATIONS!',
        dialogDesc:
          'Check your internet connection and allow notifications to continue.',
        dialogLeftText: 'Cancel',
        dialogRightText: 'Ok',
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
      validationInfo: {countryCode},
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
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                width: screenWidth,
                height: screenWidth,
                backgroundColor: '#D8D7D3',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ImageBackground
                style={{width: screenWidth, height: screenWidth}}
                source={
                  this.state.imageURI != null
                    ? this.state.imageURI
                    : require('../../icons/user.png')
                }>
                <View style={{width: screenWidth, height: screenWidth}}>
                  <TouchableOpacity
                    style={{
                      width: 35,
                      height: 35,
                      position: 'absolute',
                      justifyContent: 'center',
                      start: 0,
                      margin: 5,
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

                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      position: 'absolute',
                      end: 0,
                      alignSelf: 'flex-end',
                      alignContent: 'center',
                      justifyContent: 'center',
                      borderRadius: 50,
                      backgroundColor: '#fff',
                      margin: 20,
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 0},
                      shadowOpacity: 0.75,
                      shadowRadius: 5,
                      elevation: 5,
                    }}
                    onPress={this.selectPhotoReg}>
                    <Image
                      style={{
                        width: 20,
                        height: 20,
                        tintColor: themeRed,
                        alignSelf: 'center',
                      }}
                      source={require('../../icons/camera.png')}
                    />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.logincontainer}>
              <ShakingText style={styles.shakingText}>
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
                      {this.state.accountType}
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
                    height: 50,
                    marginLeft: 5,
                    color: black,
                  }}
                  placeholder="Username"
                  onChangeText={userNameInput =>
                    this.setState({error: '', username: userNameInput})
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
                    height: 50,
                    marginLeft: 5,
                    color: black,
                  }}
                  placeholder="Email"
                  onChangeText={email =>
                    emailCheck(
                      email,
                      email => this.setState({email, error: ''}),
                      error => this.setState({error}),
                    )
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
                    height: 50,
                    marginLeft: 5,
                    color: black,
                  }}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={password =>
                    passwordCheck(
                      password,
                      password => this.setState({password, error: ''}),
                      error => this.setState({error}),
                    )
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
                    height: 50,
                    marginLeft: 5,
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

              <TouchableOpacity
                style={styles.textInputView}
                onPress={this.showPicker}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../../icons/calendar.png')}
                />
                <Text
                  style={{
                    width: screenWidth - 85,
                    color: 'black',
                    fontSize: 14,
                    textAlignVertical: 'center',
                    alignSelf: 'center',
                    marginLeft: 10,
                  }}>
                  {this.state.dob}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={this.checkValidation}>
                <Text style={styles.text}>Register</Text>
              </TouchableOpacity>

              <DateTimePicker
                isVisible={this.state.isVisible}
                onConfirm={this.handlePicker}
                onCancel={this.hidePicker}
              />
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

const mapSateToProps = state => ({
  newUser: state.userInfo.newUser,
  validationInfo: state.validationInfo,
});

const mapDispatchToProps = dispatch => ({
  updateNewUserInfo: newUser => dispatch(updateNewUserInfo(newUser)),
});

export default connect(
  mapSateToProps,
  mapDispatchToProps,
)(RegisterScreen);

const styles = StyleSheet.create({
  shakingText: {
    flex: 1,
    color: 'red',
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8EEE9',
  },
  logincontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  textInputView: {
    flexDirection: 'row',
    width: screenWidth - 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
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
    backgroundColor: 'red',
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
