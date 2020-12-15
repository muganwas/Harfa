import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Text,
  StatusBar,
  Platform,
  BackHandler,
  Modal,
  Animated,
} from 'react-native';
//import {NavigationActions} from 'react-navigation';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import ShakingText from 'react-native-shaking-text';
import ImagePicker from 'react-native-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import axios from 'axios';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-community/async-storage';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { cloneDeep } from 'lodash';
import Toast from 'react-native-simple-toast';
import WaitingDialog from '../WaitingDialog';
import Hamburger from '../Hamburger';
import Config from '../Config';
import { updateUserDetails, fetchUserProfile } from '../../Redux/Actions/userActions';
import { colorPrimaryDark, white, themeRed, black, colorBg } from '../../Constants/colors';

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

const storageRef = storage().ref('/users_info');
const screenWidth = Dimensions.get('window').width;

const USER_IMAGE_UPDATE = Config.baseURL + 'users/upload/';
const USER_INFO_UPDATE = Config.baseURL + 'users/';

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

class MyProfileScreen extends Component {
  constructor(props) {
    super();
    const { userInfo: { userDetails } } = props;
    this.state = {
      userId: userDetails.userId,
      fcmId: userDetails.fcmId,
      image: userDetails.image,
      email: userDetails.email,
      username: userDetails.username,
      mobile: userDetails.mobile,
      dob: userDetails.dob == '' ? 'Date of Birth' : userDetails.dob,
      address: userDetails.address,
      lat: userDetails.lat,
      lang: userDetails.lang,
      error: '',
      isLoading: false,
      galleryCameraImage: '',
      isVisible: false,
      isErrorToast: false,
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
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
    if (Platform.OS == 'ios')
      this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
  }

  _spring = () => {
    this.setState({ backClickCount: 1 }, () => {
      Animated.sequence([
        Animated.spring(this.springValue, {
          toValue: -0.15 * 1,
          friction: 5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(this.springValue, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        this.setState({ backClickCount: 0 });
      });
    });
  }

  selectPhoto = () => {
    try {
      ImagePicker.showImagePicker(options, response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          let source = { uri: response.uri };
          this.setState({
            image: source,
            error: '',
            galleryCameraImage: 'galleryCamera',
            isLoading: true,
          });
          AsyncStorage.getItem('userId').then(providerId => this.updateImageTask(providerId, response));
        }
      });
    }
    catch (error) {
      console.log('image selection error --', error)
    }
  };

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

  checkValidation = () => {
    this.setState({
      isLoading: true,
    });

    AsyncStorage.getItem('userId').then(providerId =>
      this.updateInformation(providerId),
    );
  };

  //Information Update
  updateInformation = userId => {
    const { fcmId, username, mobile, dob } = this.state;
    const { fetchUserProfile } = this.props;
    this.setState({
      isLoading: true,
    });
    const userData = {
      username, mobile, dob,
    };

    fetch(USER_INFO_UPDATE + userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then(response => response.json())
      .then(response => {
        if (response.result) {
          this.setState({
            isLoading: false,
            isErrorToast: false,
          });
          this.showToast(response.message);
          fetchUserProfile(userId, fcmId);
        } else {
          this.setState({
            isLoading: false,
            isErrorToast: true,
          });
          this.showToast(response.message);
        }
      })
      .catch(error => {
        console.log('Error :' + error);
        this.setState({
          isLoading: false,
        });
      })
      .done();
  }

  //Image Update
  updateImageTask = (userId, imageObject) => {
    this.setState({
      isLoading: true,
    });
    const { userInfo: { userDetails: { firebaseId } } } = this.props;
    const { fileName, path } = imageObject;
    const userDataRef = storageRef.child(`/${firebaseId}/${fileName}`);
    userDataRef.putFile(path).then(uploadRes => {
      const { state } = uploadRes;
      if (state === 'success') {
        userDataRef.getDownloadURL().then(urlResult => {
          axios.post(USER_IMAGE_UPDATE + userId, {
            type: imageObject.type,
            uri: urlResult,
            name: imageObject.fileName,
          }).then(async res => {
            const { userInfo: { userDetails }, updateUserDetails } = this.props;
            let newUserDetails = cloneDeep(userDetails);
            newUserDetails.image = urlResult;
            await updateUserDetails(newUserDetails);
            this.setState({
              isLoading: false,
              isErrorToast: false,
            });
            if (res && res.data.result) {
              this.showToast(res.data.message);
            }

          }).catch(error => {
            console.log('Error :' + error);
            this.setState({
              isLoading: false,
            });
            this.showToast('Something went wrong');
          });
        })
      }
      else {
        this.showToast('Upload failed, try again please.')
      }
    }).catch(error => {
      console.log('image upload error', error.messge)
    });
  }

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool
    })
  }

  render() {
    const { userInfo: { userDetails } } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 50,
            backgroundColor: white,
            paddingLeft: 10,
            paddingRight: 20,
            paddingBottom: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
          }}>

          <Hamburger
            navigation={this.props.navigation}
            text='My Profile'
          />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={{
            flexGrow: 1,
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
                flex: 0.35,
                width: screenWidth,
                backgroundColor: white,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 200,
                  marginTop: 20,
                }}
                source={
                  this.state.galleryCameraImage == ''
                    ? this.state.image
                      ? { uri: this.state.image }
                      : require('../../images/generic_avatar.png')
                    : { uri: this.state.image.uri }
                }
              />

              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
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
                onPress={this.selectPhoto}>
                <Image
                  style={{ width: 20, tintColor: themeRed, height: 20, alignSelf: 'center' }}
                  source={require('../../icons/camera.png')}
                />
              </TouchableOpacity>
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
                  borderRadius: 5,
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
                    <Text style={[styles.text, { color: black, fontWeight: 'bold' }]}>
                      {userDetails.accountType}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/ic_user_64dp.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 10 }}
                  placeholder="User name"
                  value={this.state.username}
                  onChangeText={nameInput =>
                    this.setState({ error: '', username: nameInput })
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/email.png')}></Image>
                <Text
                  style={{
                    width: screenWidth - 85,
                    marginLeft: 10,
                    textAlignVertical: 'center',
                  }}>
                  {this.state.email}
                </Text>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{ width: 15, height: 15, marginLeft: 5 }}
                  source={require('../../icons/mobile.png')}></Image>
                <TextInput
                  style={{ width: screenWidth - 85, height: 50, marginLeft: 10 }}
                  placeholder="Mobile"
                  value={this.state.mobile}
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
                <Text style={[styles.text, { color: black, fontWeight: 'bold' }]}>Update</Text>
              </TouchableOpacity>

              <DateTimePicker
                isVisible={this.state.isVisible}
                onConfirm={this.handlePicker}
                onCancel={this.hidePicker}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
        <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
        </Modal>
        <Animated.View
          style={[
            styles.animatedView,
            { transform: [{ translateY: this.springValue }] },
          ]}>
          <Text style={styles.exitTitleText}>
            Press back again to exit the app
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    userInfo: state.userInfo
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    updateUserDetails: dits => {
      dispatch(updateUserDetails(dits));
    },
    fetchUserProfile: (userId, fcmId) => {
      dispatch(fetchUserProfile(userId, fcmId));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MyProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8EEE9',
  },
  logincontainer: {
    flex: 0.65,
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
    backgroundColor: white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    width: 200,
    paddingTop: 15,
    backgroundColor: white,
    shadowColor: themeRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 7,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: themeRed,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  textView: {
    flex: 1,
    width: 300,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
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
    width: 300,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
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
    borderColor: themeRed,
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
    flex: 1.5,
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
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  exitTitleText: {
    textAlign: 'center',
    color: black,
    marginRight: 20,
  },
  exitText: {
    color: themeRed,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});