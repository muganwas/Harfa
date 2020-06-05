import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Text,
  ActivityIndicator,
  StatusBar,
  Platform,
  BackHandler,
  Animated,
} from 'react-native';
//import {NavigationActions} from 'react-navigation';
import {DrawerActions} from 'react-navigation-drawer';
import RNExitApp from 'react-native-exit-app';
import ShakingText from 'react-native-shaking-text';
import ImagePicker from 'react-native-image-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import Config from './Config';
import AsyncStorage from '@react-native-community/async-storage';
import UserDetails from './UserDetails';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Toast from 'react-native-simple-toast';
import Notifications from './Notifications';
import Hamburger from './Hamburger';

const options = {
  title: 'Select a photo',
  takePhotoButtonTitle: 'Take a photo',
  chooseFromLibraryButtonTitle: 'Choose from gallery',
  quality: 1,
};

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';

const screenWidth = Dimensions.get('window').width;

const USER_GET_PROFILE = Config.baseURL + 'users/';
const USER_IMAGE_UPDATE = Config.baseURL + 'users/upload/';
const USER_INFO_UPDATE = Config.baseURL + 'users/';

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

export default class MyProfileScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userId: UserDetails.User.userId,
      imageSource: UserDetails.User.image,
      email: UserDetails.User.email,
      name: UserDetails.User.username,
      mobile: UserDetails.User.mobile,
      dob: UserDetails.User.dob == '' ? 'Date of Birth' : UserDetails.User.dob,
      address: UserDetails.User.address,
      lat: UserDetails.User.lat,
      lang: UserDetails.User.lang,
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
    console.log('My Profile Mount');
    console.log(this.state);
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick.bind(this),
    );
  }

  componentWillUnmount() {
    console.log('My Profile Unmount');
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick.bind(this),
    );
  }

  handleBackButtonClick() {
    // this.props.navigation.navigate("DashBoard");
    // return true;

    if (Platform.OS == 'ios')
      this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
  }

  _spring() {
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
  }

  //getProfile no need
  getProfile(userId) {
    if (userId !== null) {
      this.setState({
        isLoading: true,
      });
      fetch(USER_GET_PROFILE + userId, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          console.log(JSON.stringify(responseJson));

          if (responseJson.result) {
            console.log(responseJson.data.image);
            this.setState({
              userId: responseJson.data.id,
              imageSource: responseJson.data.image,
              name: responseJson.data.username,
              mobile: responseJson.data.mobile,
              dob: responseJson.data.dob,
              isLoading: false,
            });
          } else {
            this.setState({
              isLoading: false,
              isErrorToast: true,
            });
            this.showToast('Something went wrong');
          }
        })
        .catch(error => {
          alert('Error ' + error);
          this.setState({
            isLoading: false,
          });
        });
    }
  }

  selectPhoto = () => {
    ImagePicker.showImagePicker(options, response => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        let source = {uri: response.uri};
        this.setState({
          imageSource: source,
          error: '',
          galleryCameraImage: 'galleryCamera',
          isLoading: true,
        });
        AsyncStorage.getItem('userId').then(providerId =>
          this.updateImageTask(providerId, response),
        );
      }
    });
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
  updateInformation(userId) {
    this.setState({
      isLoading: true,
    });

    const userData = {
      username: this.state.name,
      mobile: this.state.mobile,
      dob: this.state.dob,
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
        console.log('Response' + JSON.stringify(response));
        if (response.result) {
          this.setState({
            isLoading: false,
            isErrorToast: false,
          });
          this.showToast(response.message);
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
  updateImageTask(userId, imageObject) {
    this.setState({
      isLoading: true,
    });

    let imageData = new FormData();
    imageData.append('image', {
      type: imageObject.type,
      uri: imageObject.uri,
      name: imageObject.fileName,
    });

    console.log('ImageData : ' + JSON.stringify(imageData));

    fetch(USER_IMAGE_UPDATE + userId, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        otherHeader: 'foo',
      },
      body: imageData,
    })
      .then(response => response.json())
      .then(response => {
        console.log('Response' + JSON.stringify(response));
        if (response.result) {
          this.setState({
            isLoading: false,
            isErrorToast: false,
          });
          this.showToast(response.message);
        } else {
          this.setState({
            isLoading: false,
            isErrorToast: true,
          });
          this.showToast('Something went wrong');
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

  showToast = message => {
    Toast.show(message);
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />

        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 50,
            backgroundColor: colorPrimary,
            paddingLeft: 10,
            paddingRight: 20,
            paddingBottom: 5,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
          }}>
              
          <Hamburger
            Notifications={Notifications}
            navigation={this.props.navigation}
            text='Mon Profil' 
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
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <View
              style={{
                flex: 0.35,
                width: screenWidth,
                backgroundColor: colorYellow,
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
                    ? this.state.imageSource
                      ? this.state.imageSource
                      : require('../images/generic_avatar.png')
                    : {uri: this.state.imageSource}
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
                onPress={this.selectPhoto.bind(this)}>
                <Image
                  style={{width: 20, height: 20, alignSelf: 'center'}}
                  source={require('../icons/camera.png')}
                />
              </TouchableOpacity>
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
                  borderRadius: 5,
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
                    <Text style={styles.text}>Type de compte</Text>
                  </View>
                  <View style={styles.buttonGreen}>
                    <Text style={styles.text}>
                      {UserDetails.User.accountType}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/ic_user_64dp.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 10}}
                  placeholder="Nom d'utilisateur"
                  value={this.state.name}
                  onChangeText={nameInput =>
                    this.setState({error: '', name: nameInput})
                  }></TextInput>
              </View>

              <View style={styles.textInputView}>
                <Image
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/email.png')}></Image>
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
                  style={{width: 15, height: 15, marginLeft: 5}}
                  source={require('../icons/mobile.png')}></Image>
                <TextInput
                  style={{width: screenWidth - 85, height: 50, marginLeft: 10}}
                  placeholder="Mobile"
                  value={this.state.mobile}
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
                <Text style={styles.text}>Mise à jour</Text>
              </TouchableOpacity>

              <DateTimePicker
                isVisible={this.state.isVisible}
                onConfirm={this.handlePicker}
                onCancel={this.hidePicker}
              />
            </View>
          </View>
          {this.state.isLoading && (
            <View style={styles.loaderStyle}>
              <ActivityIndicator
                style={{height: 80}}
                color="#C00"
                size="large"
              />
            </View>
          )}
        </KeyboardAwareScrollView>

        <Animated.View
          style={[
            styles.animatedView,
            {transform: [{translateY: this.springValue}]},
          ]}>
          <Text style={styles.exitTitleText}>
            Appuyez à nouveau pour quitter l'application
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.exitText}>Sortie</Text>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
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
    flex: 1.5,
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
  animatedView: {
    width: screenWidth,
    backgroundColor: colorPrimaryDark,
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
    color: 'white',
    marginRight: 20,
  },
  exitText: {
    color: 'red',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
