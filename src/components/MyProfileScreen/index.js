import React, {Component} from 'react';
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
import {connect} from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import ShakingText from 'react-native-shaking-text';
import ImagePicker from 'react-native-image-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import rNES from 'react-native-encrypted-storage';
import DateTimePicker from 'react-native-modal-datetime-picker';
import TextInputMask from 'react-native-text-input-mask';
import moment from 'moment';
import {
  phoneNumberCheck,
  sanitizeMobileNumber,
  emailCheck,
} from '../../misc/helpers';
import Toast from 'react-native-simple-toast';
import WaitingDialog from '../WaitingDialog';
import Hamburger from '../Hamburger';
import Config from '../Config';
import {
  updateUserDetails,
  fetchUserProfile,
} from '../../Redux/Actions/userActions';
import {
  colorPrimaryDark,
  white,
  themeRed,
  black,
  colorBg,
} from '../../Constants/colors';
import {
  updateProfileImageTask,
  updateProfileInfo,
} from '../../controllers/users';

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

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
};

class MyProfileScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: {userDetails},
    } = props;
    this.state = {
      userId: userDetails.userId,
      fcmId: userDetails.fcmId,
      image: userDetails.image,
      email: userDetails.email,
      emailDisabled: !!userDetails.email,
      mobileDisabled: !!userDetails.mobile,
      emailSet: false,
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

  componentDidMount = async () => {
    const {
      navigation,
      validationInfo: {countryCode},
    } = this.props;
    const {mobile} = this.state;
    let newMobile = await sanitizeMobileNumber(mobile, countryCode, false);
    this.setState({mobile: newMobile});
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
  };

  handleBackButtonClick = () => {
    if (Platform.OS == 'ios')
      this.state.backClickCount === 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount === 1 ? BackHandler.exitApp() : this._spring();
  };

  _spring = () => {
    this.setState({backClickCount: 1}, () => {
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
        this.setState({backClickCount: 0});
      });
    });
  };

  selectPhoto = () => {
    try {
      ImagePicker.showImagePicker(options, response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          let source = {uri: response.uri};
          this.setState({
            image: source,
            error: '',
            galleryCameraImage: 'galleryCamera',
            isLoading: true,
          });
          rNES
            .getItem('userId')
            .then(providerId =>
              this.updateImageTaskCustomer(providerId, response),
            );
        }
      });
    } catch (error) {
      console.log('image selection error --', error);
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
    rNES
      .getItem('userId')
      .then(providerId => this.updateInformation(providerId));
  };

  //Information Update
  updateInformation = userId => {
    const {fcmId, username, email, mobile, dob} = this.state;
    const {
      validationInfo: {countryAlpha2},
      fetchUserProfile,
    } = this.props;
    this.setState({
      isLoading: true,
    });
    const userData = {
      username,
      email,
      mobile,
      dob,
    };
    phoneNumberCheck(mobile, countryAlpha2).then(async isValid => {
      if (!isValid) {
        this.setState({
          isLoading: false,
          error: 'Your phone number is invalid',
        });
      } else {
        email &&
          (await emailCheck(
            email,
            () => this.setState({error: ''}),
            error => {
              this.setState({error, isLoading: false});
            },
          ));
        if (!this.state.error)
          await updateProfileInfo({
            userId,
            fcmId,
            userData,
            fetchUserProfile,
            updateURL: USER_INFO_UPDATE,
            onSuccess: userData => {
              this.setState({
                emailSet: userData && userData.email,
                isLoading: false,
                isErrorToast: false,
              });
            },
            toggleIsLoading: this.changeWaitingDialogVisibility,
          });
      }
    });
  };

  updateImageTaskCustomer = async (userId, imageObject) =>
    await updateProfileImageTask({
      userId,
      imageObject,
      firebaseId: this.props?.userInfo?.userDetails?.firebaseId,
      userDetails: this.props?.userInfo?.userDetails,
      updateUserDetails: this.props?.updateUserDetails,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      updateURL: USER_IMAGE_UPDATE,
    });

  showToast = (message, length) => {
    if (length) Toast.show(message, length);
    else Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  render() {
    const {
      userInfo: {userDetails},
      validationInfo: {countryCode},
    } = this.props;
    const {
      mobile,
      emailDisabled,
      emailSet,
      mobileDisabled,
      galleryCameraImage,
      image,
    } = this.state;
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
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
          }}>
          <Hamburger navigation={this.props.navigation} text="My Profile" />
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
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
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
                  !galleryCameraImage
                    ? image
                      ? {uri: image}
                      : require('../../images/generic_avatar.png')
                    : {uri: image.uri}
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
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.75,
                  shadowRadius: 5,
                  elevation: 5,
                }}
                onPress={this.selectPhoto}>
                <Image
                  style={{
                    width: 20,
                    tintColor: themeRed,
                    height: 20,
                    alignSelf: 'center',
                  }}
                  source={require('../../icons/camera.png')}
                />
              </TouchableOpacity>
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
                    <Text style={[styles.text, {fontWeight: 'bold'}]}>
                      Account Type
                    </Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text
                      style={[styles.text, {color: black, fontWeight: 'bold'}]}>
                      {userDetails.accountType}
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
                    marginLeft: 10,
                  }}
                  placeholder="User name"
                  value={this.state.username}
                  onChangeText={nameInput =>
                    this.setState({error: '', username: nameInput})
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
                    marginLeft: 10,
                    textAlignVertical: 'center',
                  }}
                  editable={!emailDisabled && !emailSet}
                  placeholder="Your email address"
                  value={this.state.email}
                  onChangeText={email => this.setState({error: '', email})}
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
                    marginLeft: 10,
                  }}
                  refInput={ref => {
                    this.input = ref;
                  }}
                  keyboardType="phone-pad"
                  placeholder={`${countryCode} 000 000 000`}
                  value={mobile}
                  editable={!mobileDisabled}
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
                <Text style={[styles.text, {color: black, fontWeight: 'bold'}]}>
                  Update
                </Text>
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
        <Animated.View
          style={[
            styles.animatedView,
            {transform: [{translateY: this.springValue}]},
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
    userInfo: state.userInfo,
    validationInfo: state.validationInfo,
  };
};

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
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MyProfileScreen);

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
    shadowOffset: {width: 0, height: 0},
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
    shadowOffset: {width: 0, height: 3},
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
    width: 300,
    height: 120,
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
