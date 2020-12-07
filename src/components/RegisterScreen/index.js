import React, { Component } from 'react';
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
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import { connect } from 'react-redux';
import axios from 'axios';
import ShakingText from 'react-native-shaking-text';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import simpleToast from 'react-native-simple-toast';
import moment from 'moment';
import RNExitApp from 'react-native-exit-app';
import messaging from '@react-native-firebase/messaging';
import firebaseAuth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { cloneDeep } from 'lodash';
import ImagePicker from 'react-native-image-picker';
import Config from '../Config';
import { updateNewUserInfo } from '../../Redux/Actions/userActions';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import { black, white, themeRed } from '../../Constants/colors';

const storageRef = storage().ref('/users_info');
const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'users/register/create';

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

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
}

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
      dialogRightText: 'Retry'
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const { navigation } = this.props;
    navigation.addListener('willFocus', async () => {
      BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    });
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  }

  handlePicker = date => {
    this.setState({
      isVisible: false,
      dob: moment(date).format('D-MMMM-YYYY'),
      error: false,
    });
  };

  hidePicker = date => {
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

  selectPhoto = () => {
    ImagePicker.showImagePicker(options, response => {
      if (response.didCancel) {
        simpleToast.show('You canceled image selection', simpleToast.SHORT);
      } else if (response.error) {
        simpleToast.show('Something went wrong, try again.', simpleToast.SHORT);
      } else {
        let source;
        source = { uri: response.uri };
        this.setState({
          imageURI: source,
          imageDataObject: response,
          error: '',
        });
      }
    });
  };

  emailValidate = email => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (reg.test(email) === false) {
      this.setState({ error: 'Email is incorrect', email: email });
      return false;
    } else {
      this.setState({ error: '', email: email });
    }
  }

  checkValidation = () => {
    if (this.state.imageURI == null) {
      this.setState({ error: 'Select profile image' });
    } else if (this.state.username == '') {
      this.setState({ error: 'Enter username' });
    } else if (this.state.email == '') {
      this.setState({ error: 'Enter valid email' });
    } else if (this.state.password == '') {
      this.setState({ error: 'Enter password' });
    } else if (this.state.mobile == '') {
      this.setState({ error: 'Enter mobile' });
    } else if (this.state.dob == 'Date of Birth') {
      this.setState({ error: 'Select date of birth' });
    } else {
      this.registerTask(this.state.imageDataObject);
    }
  };

  registerTask = async imageObject => {
    this.setState({
      isLoading: true,
    });
    const fcmToken = await messaging().getToken();
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled && fcmToken) {
      const {
        username,
        email,
        mobile,
        password,
        dob,
        accountType,
      } = this.state;

      const userData = {
        'username': username,
        'email': email,
        'mobile': mobile,
        'password': password,
        'dob': dob,
        'acc_type': accountType,
        'fcm_id': fcmToken,
        'type': 'normal',
      };
      firebaseAuth()
        .createUserWithEmailAndPassword(email, password)
        .then(result => {
          const { fileName, path } = imageObject;
          const { updateNewUserInfo } = this.props;
          const { user, user: { uid } } = result;
          const newUser = Object.assign({ uid }, userData);
          const userDataRef = storageRef.child(`/${uid}/${fileName}`);
          updateNewUserInfo(newUser);
          userDataRef.putFile(path).then(uploadRes => {
            const { state } = uploadRes;
            if (state === 'success') {
              userDataRef.getDownloadURL().then(urlResult => {
                let newUserData = cloneDeep(userData);
                newUserData.image = urlResult;
                axios
                  .post(REGISTER_URL, { data: JSON.stringify(newUserData) })
                  .then(responseJson => {
                    if (responseJson.status === 200 && responseJson.data.createdDate) {
                      this.leftButtonActon = () => {
                        this.setState({
                          isLoading: false,
                          showDialog: false,
                          dialogType: null
                        });
                      };
                      this.rightButtonAction = () => this.props.navigation.goBack();
                      this.setState({
                        isLoading: false,
                        showDialog: true,
                        dialogType: 'fb',
                        dialogTitle: 'REGISTERED SUCCESSFULLY!',
                        dialogDesc: 'We have send you a email verification link to your registered email id and then Login to your account',
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok'
                      });
                    } else {
                      this.leftButtonActon = () => {
                        this.setState({
                          isLoading: false,
                          showDialog: false,
                          dialogType: null
                        });
                      };
                      this.rightButtonAction = async () => {
                        await this.registerTask(this.state.imageDataObject);
                        this.setState({
                          isLoading: false,
                          showDialog: false,
                          dialogType: null
                        });
                      };
                      this.setState({
                        isLoading: false,
                        showDialog: true,
                        dialogType: 'fb',
                        dialogTitle: 'OOPS!',
                        dialogDesc: responseJson.data.message,
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Retry'
                      });
                    }
                  })
                  .catch(error => {
                    this.leftButtonActon = () => {
                      this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null
                      });
                    };
                    this.rightButtonAction = async () => {
                      await this.registerTask(this.state.imageDataObject);
                      this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null
                      });
                    }
                    this.setState({
                      isLoading: false,
                      showDialog: true,
                      dialogType: 'fb',
                      dialogTitle: 'OOPS!',
                      dialogDesc: error.message || 'Something went wrong, please try again.',
                      dialogLeftText: 'Cancel',
                      dialogRightText: 'Retry'
                    });
                  })
                  .done();
              })
            }
          }).catch(error => {
            simpleToast.show('Image upload failed', simpleToast.SHORT);
            console.log('image upload error', error.messge)
          });
        }).catch(error => {
          if (error.code === 'auth/email-already-in-use')
            this.setState({ error: 'The email is already registerd.', isLoading: false });
          else if (error.code === 'auth/invalid-email')
            this.setState({ error: 'Your email address is invalid!', isLoading: false });
          else if (error.code === 'auth/weak-password')
            this.setState({ error: 'Your password is too weak', isLoading: false });
          else
            this.setState({ error: "Something went wrong, please try again later", isLoading: false });
        });
    }
    else {
      this.leftButtonActon = null;
      this.rightButtonAction = () => {
        if (Platform.OS == 'android')
          BackHandler.exitApp();
        else
          RNExitApp.exitApp();
      }
      this.setState({
        isLoading: false,
        showDialog: true,
        dialogType: 'fb',
        dialogTitle: 'ENABLE NOTIFICATIONS!',
        dialogDesc: "You don't have permission for notification. Please enable notification then try again",
        dialogLeftText: 'Cancel',
        dialogRightText: 'Ok'
      });
    }
  }

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  changeDialogVisibility = () => this.setState(prevState => ({ showDialog: !prevState.showDialog }));

  render() {
    const { showDialog, dialogType, dialogTitle, dialogDesc, dialogLeftText, dialogRightText } = this.state;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null}
          transparent={true}
          animation='fade'
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
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: screenWidth,
                height: screenWidth,
                backgroundColor: '#D8D7D3',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ImageBackground
                style={{ width: screenWidth, height: screenWidth }}
                source={
                  this.state.imageURI != null
                    ? this.state.imageURI
                    : require('../../icons/user.png')
                }>
                <View style={{ width: screenWidth, height: screenWidth }}>
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
                      style={{ width: 20, height: 20, tintColor: black, alignSelf: 'center' }}
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
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.75,
                      shadowRadius: 5,
                      elevation: 5,
                    }}
                    onPress={this.selectPhoto.bind(this)}>
                    <Image
                      style={{ width: 20, height: 20, tintColor: themeRed, alignSelf: 'center' }}
                      source={require('../../icons/camera.png')}
                    />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.logincontainer}>
              <ShakingText
                style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
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
                    <Text style={[styles.text, { fontWeight: 'bold' }]}>Account Type</Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text style={[styles.text, { color: black, fontWeight: 'bold' }]}>{this.state.accountType}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_user_64dp.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 5, color: black }}
                  placeholder="Username"
                  onChangeText={userNameInput =>
                    this.setState({ error: '', username: userNameInput })
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/email.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 5, color: black }}
                  placeholder="Email"
                  onChangeText={emailInput =>
                    this.emailValidate(emailInput)
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_lock_64dp.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 5, color: black }}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={passwordInput =>
                    this.setState({ error: '', password: passwordInput })
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/mobile.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 5, color: black }}
                  placeholder="Mobile"
                  maxLength={10}
                  keyboardType="numeric"
                  onChangeText={mobileInput =>
                    this.setState({ error: '', mobile: mobileInput })
                  }></TextInput>
              </View>

              <TouchableOpacity
                style={styles.textInputView}
                onPress={this.showPicker}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/calendar.png')}></Image>
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
  newUser: state.userInfo.newUser
});

const mapDispatchToProps = dispatch => ({
  updateNewUserInfo: newUser => dispatch(updateNewUserInfo(newUser))
});

export default connect(mapSateToProps, mapDispatchToProps)(RegisterScreen);

const styles = StyleSheet.create({
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
    shadowOffset: { width: 0, height: 3 },
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
    shadowOffset: { width: 0, height: 3 },
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