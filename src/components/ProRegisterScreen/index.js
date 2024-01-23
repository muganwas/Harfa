import React, {Component} from 'react';
import {
  View,
  ImageBackground,
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
import TextInputMask from 'react-native-text-input-mask';
import messaging from '@react-native-firebase/messaging';
import {
  updateProviderDetails,
  updateNewUserInfo,
} from '../../Redux/Actions/userActions';
import {
  selectPhoto,
  emailCheck,
  passwordCheck,
  phoneNumberCheck,
} from '../../misc/helpers';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import {registerTask, checkValidation} from '../../controllers/users';
import Config from '../Config';
import {black, white, themeRed, lightGray} from '../../Constants/colors';

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
      imageURI: null,
      imageDataObject: null,
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

  checkValidation = async () => {
    const {
      name,
      mobile,
      serviceName,
      description,
      address,
      email,
      imageURI,
      password,
    } = this.state;
    if (!imageURI) {
      this.setState({error: 'Select profile image'});
    } else if (!name) {
      this.setState({error: 'Enter name'});
    } else if (serviceName === 'Select services') {
      this.setState({error: 'Select services'});
    } else if (!description) {
      this.setState({error: 'Enter description'});
    } else if (address === '' || address === 'Select Address') {
      this.setState({error: 'Enter address'});
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
          this.registerTaskProvider,
        );
      }
    }
  };

  registerTaskProvider = async () => {
    const fcmToken = await messaging().getToken();
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled && fcmToken) {
      await registerTask({
        userType: 'Provider',
        fcmToken,
        username: this.state.name,
        surname: this.state.surname,
        email: this.state.email,
        mobile: this.state.mobile,
        password: this.state.password,
        dob: this.state.dob,
        accountType: this.state.account_type,
        invoice: this.state.invoice,
        address: this.state.address,
        description: this.state.description,
        services: this.state.serviceId,
        imageObject: this.state.imageDataObject,
        type: 'normal',
        lat: this.state.lat,
        lang: this.state.lang,
        toggleIsLoading: this.changeWaitingDialogVisibility,
        registerURL: REGISTER_URL,
        updateNewUserInfo: this.props.updateNewUserInfo,
        onSuccess: msg => {
          this.leftButtonActon = null;
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
              await this.registerTaskProvider();
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
        if (Platform.OS === 'android') BackHandler.exitApp();
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

  selectPhotoReg = async () =>
    await selectPhoto(obj =>
      this.setState({
        imageURI: obj.imageURI,
        imageDataObject: obj.imageDataObject,
        error: obj.error,
      }),
    );

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
              { this.state.error && <Text style={styles.shakingText}>
                {this.state.error}
              </Text> }

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
                    this.state.currentPage === 0 ? 'Username' : 'Company name'
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
                    height: 45,
                    marginLeft: 10,
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
                      this.state.invoice === 1
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
                      this.state.invoice === 0
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
  validationInfo: state.validationInfo,
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
  shakingText: {
    flex: 1,
    color: 'red',
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'center',
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
