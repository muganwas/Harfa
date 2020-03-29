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
  ActivityIndicator,
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import axios from 'axios';
import ShakingText from 'react-native-shaking-text';
import DateTimePicker from 'react-native-modal-datetime-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import moment from 'moment';
import ImagePicker from 'react-native-image-picker';
//import AsyncStorage from '@react-native-community/async-storage';
import firebaeMessaging from 'react-native-firebase';
import Config from './Config';
import UserDetails from './UserDetails';
import WaitingDialog from './WaitingDialog';

//const colorPrimary = '#262425';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
//const colorBg = '#E8EEE9';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + 'users/register/create';

console.log(`Register URL Next: ${REGISTER_URL}`);

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
  return Platform.OS === 'ios' ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: colorPrimaryDark,
      }}>
      <StatusBar barStyle="light-content" />
    </View>
  ) : (
    <StatusBar barStyle="light-content" backgroundColor={colorPrimaryDark} />
  );
}

export default class RegisterScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accountType: this.props.navigation.state.params.accountType, //From AccountTypeScreen
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
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick() {
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
    console.log('SELECT PHOTO ');

    ImagePicker.showImagePicker(options, response => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        let source;

        source = {uri: response.uri};

        this.setState({
          imageURI: source,
          imageDataObject: response,
          error: '',
        });
      }
    });
  };

  emailValidate(email) {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (reg.test(email) === false) {
      this.setState({error: 'Email is incorrect', email: email});
      return false;
    } else {
      this.setState({error: '', email: email});
    }
  }

  checkValidation = () => {
    if (this.state.imageURI == null) {
      this.setState({error: 'Select profile image'});
    } else if (this.state.username == '') {
      this.setState({error: 'Enter username'});
    } else if (this.state.email == '') {
      this.setState({error: 'Enter valid email'});
    } else if (this.state.password == '') {
      this.setState({error: 'Enter password'});
    } else if (this.state.mobile == '') {
      this.setState({error: 'Enter mobile'});
    } else if (this.state.dob == 'Date of Birth') {
      this.setState({error: 'Select date of birth'});
    } else {
      this.registerTask(this.state.imageDataObject);
    }
  };

  registerTask(imageObject) {
    this.setState({
      isLoading: true,
    });

    firebaeMessaging
      .messaging()
      .getToken()
      .then(fcmToken => {
        console.log('ProRegister FCM ID ' + fcmToken);
        const {
          username,
          email,
          mobile,
          password,
          dob,
          accountType,
        } = this.state;

        if (fcmToken) {

          const userData = {
            'username': username,
            'email': email,
            'mobile': mobile,
            'password': password,
            'dob': dob,
            'acc_type': accountType,
            'image': imageObject.fileName,
            'fcm_id': fcmToken,
            'type': 'normal',
          };

          axios
            .post(REGISTER_URL, {data: JSON.stringify(userData)})
            .then(responseJson => {
              if (responseJson.status === 200 && responseJson.data.createdDate) {

                this.setState({
                  isLoading: false,
                  isToastShow: true,
                });

                //const id = responseJson.data.id;

                /*var userData = {
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
                };
                UserDetails.User = userData;*/

                //console.log(UserDetails)

                //Store data like sharedPreference
                //AsyncStorage.setItem('userId', id);
                // AsyncStorage.setItem('userType', 'User');

                Alert.alert(
                  'Successfully Registered !',
                  'We have send you a email verification link to your registered email id and then Login to your account',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => console.log('Cancel Pressed'),
                    },
                    {
                      text: 'Ok',
                      onPress: () => this.props.navigation.goBack(),
                    },
                  ],
                );
              } else {
                console.log('Response Else ');
                this.setState({
                  isLoading: false,
                });
                Alert.alert('OOPS !', responseJson.data.message, [
                  {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                  },
                  {
                    text: 'Retry',
                    onPress: () =>
                      this.registerTask(this.state.imageDataObject),
                  },
                ]);
              }
            })
            .catch(error => {
              console.log('Error :' + error);
              this.setState({
                isLoading: false,
              });
              Alert.alert('OOPS !', 'Something went wrong, Try again later', [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                },
                {
                  text: 'Retry',
                  onPress: () => this.registerTask(this.state.imageDataObject),
                },
              ]);
            })
            .done();
        }
      });
  }

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />

        <KeyboardAwareScrollView
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            alwaysBounceVertical: true,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
                    : require('../icons/user.png')
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
                      style={{width: 20, height: 20, alignSelf: 'center'}}
                      source={require('../icons/arrow_back.png')}
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
                    onPress={this.selectPhoto.bind(this)}>
                    <Image
                      style={{width: 20, height: 20, alignSelf: 'center'}}
                      source={require('../icons/camera.png')}
                    />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.logincontainer}>
              <ShakingText
                style={{color: 'red', fontWeight: 'bold', marginBottom: 10}}>
                {this.state.error}
              </ShakingText>

              <View
                style={{
                  width: screenWidth - 50,
                  height: 50,
                  justifyContent: 'center',
                  marginBottom: 15,
                  backgroundColor: colorPrimaryDark,
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
                    <Text style={styles.text}>Account Type</Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text style={styles.text}>{this.state.accountType}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/ic_user_64dp.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 5}}
                  placeholder="Username"
                  onChangeText={userNameInput =>
                    this.setState({error: '', username: userNameInput})
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/email.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 5}}
                  placeholder="Email"
                  onChangeText={emailInput =>
                    this.emailValidate(emailInput)
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/ic_lock_64dp.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 5}}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={passwordInput =>
                    this.setState({error: '', password: passwordInput})
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/mobile.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 5}}
                  placeholder="Mobile"
                  maxLength={10}
                  keyboardType="numeric"
                  onChangeText={mobileInput =>
                    this.setState({error: '', mobile: mobileInput})
                  }></TextInput>
              </View>

              <TouchableOpacity
                style={styles.textInputView}
                onPress={this.showPicker}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/calendar.png')}></Image>
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

        {/* {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )} */}

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
  separator: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ebebeb',
    marginTop: 5,
    marginBottom: 5,
  },
  buttonContainer: {
    width: 200,
    paddingTop: 10,
    backgroundColor: '#000000',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: colorYellow,
    borderWidth: 2,
    marginBottom: 10,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  buttonGreen: {
    flex: 1,
    height: 40,
    paddingTop: 10,
    backgroundColor: 'green',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: colorPrimaryDark,
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
    borderColor: colorPrimaryDark,
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
    backgroundColor: colorPrimaryDark,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
    borderColor: colorPrimaryDark,
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
