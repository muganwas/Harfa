import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import {connect} from 'react-redux';
import Toast from 'react-native-simple-toast';
import Config from '../Config';
import WaitingDialog from '../WaitingDialog';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobProvider,
  fetchedJobProviderInfo,
  fetchProviderJobInfoError,
  setSelectedJobRequest,
  getPendingJobRequestProvider,
} from '../../Redux/Actions/jobsActions';
import {
  colorPrimary,
  black,
  colorBg,
  white,
  lightGray,
  themeRed,
  colorGreen,
} from '../../Constants/colors';
import {acceptChatRequest, rejectChatRequest} from '../../controllers/chats';
import SimpleToast from 'react-native-simple-toast';
import {fetchProfile} from '../../controllers/users';

const screenWidth = Dimensions.get('window').width;

const USER_GET_PROFILE = Config.baseURL + 'users/';
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

class ProChatAcceptScreen extends Component {
  constructor(props) {
    super();
    const {navigation} = props;
    this.state = {
      userId: '',
      userName: '',
      userImage: '',
      imageAvailable: false,
      userMobile: '',
      userDob: '',
      userAddress: '',
      userLat: '',
      userLang: '',
      userFcmId: '',
      distance: 'unavailable',
      isLoading: true,
      isErrorToast: false,
      serviceName: navigation.state.params.serviceName,
      orderId: navigation.state.params.orderId,
      mainId: navigation.state.params.mainId,
      delivery_address: navigation.state.params.delivery_address,
      delivery_lat: navigation.state.params.delivery_lat,
      delivery_lang: navigation.state.params.delivery_lang,
      secondTimeLoader: '',
    };
  }

  //get UserData
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
      const {
        userInfo: {providerDetails},
        getPendingJobRequestProvider,
      } = this.props;
      getPendingJobRequestProvider(this.props, providerDetails.providerId);
    });
    const userId = navigation.state.params.userId;
    fetchProfile({
      userId,
      setDistance: distance => this.setState({distance}),
      onSuccess: data => {
        this.setState({
          ...data,
          isLoading: false,
          secondTimeLoader: '1',
        });
      },
      onError: msg => {
        this.setState({
          isErrorToast: true,
        });
        SimpleToast.show(msg);
      },
      userGetProfileURL: USER_GET_PROFILE,
    });
  }

  handleBackButtonClick = () => {
    this.props.navigation.navigate('ProDashboard');
    return true;
  };

  acceptJob = async () =>
    await acceptChatRequest(
      {
        pos: this.props?.jobsInfo?.jobRequestsProviders.length,
        fetchedPendingJobInfo: this.props.fetchedPendingJobInfo,
        providerDetails: this.props.jobsInfo.providerDetails,
        jobRequests: this.props?.jobsInfo?.jobRequestsProviders,
        setSelectedJobRequest: this.props.dispatchSelectedJobRequest,
        toggleLoading: this.changeWaitingDialogVisibility,
        onError: msg => {
          SimpleToast.show(msg);
          this.setState({
            isErrorToast: true,
            isLoading: false,
          });
        },
        navigate: this.props.navigation.navigate,
      },
      true,
    );

  rejectJob = async () =>
    await rejectChatRequest({
      pos: this.props?.jobsInfo?.jobRequestsProviders.length,
      fetchedPendingJobInfo: this.props.fetchedPendingJobInfo,
      providerDetails: this.props?.userInfo?.providerDetails,
      jobRequestsProviders: this.props?.jobsInfo?.jobRequestsProviders,
      toggleLoading: this.changeWaitingDialogVisibility,
      onSuccess: () => this.changeWaitingDialogVisibility(false),
      onError: msg => {
        SimpleToast.show(msg);
        this.setState({
          isErrorToast: true,
          isLoading: false,
        });
      },
      rejectionData: {
        main_id: this.props.navigation.state.params.mainId,
        chat_status: '0',
        status: 'Rejected',
        notification: {
          fcm_id: this.state.userFcmId,
          title: 'Chat Request Rejected',
          type: 'JobRejection',
          notification_by: 'Employee',
          save_notification: true,
          user_id: userId,
          employee_id: this.props?.userInfo?.providerDetails?.providerId,
          order_id: orderId,
          body:
            'Your request has been rejected by ' +
            this.props?.userInfo?.providerDetails?.name +
            ' Request Id : ' +
            this.props.navigation.state.params.orderId,
          data: {
            ProviderId: this.props?.userInfo?.providerDetails?.providerId,
            serviceName: this.state.serviceName,
            orderId: this.props.navigation.state.params.orderId,
            mainId: this.props.navigation.state.params.mainId,
          },
        },
      },
      navigate: this.props.navigation.navigate,
    });

  getBackFromProAcceptRejectJob = () => {
    this.props.navigation.goBack();
  };

  showToast = message => {
    Toast.show(message, Toast.LONG);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  componentWillUnmount() {
    const {
      userInfo: {providerDetails},
      getPendingJobRequestProvider,
    } = this.props;
    getPendingJobRequestProvider(this.props, providerDetails.providerId);
  }

  render() {
    const {
      userInfo: {providerDetails},
    } = this.props;
    const {imageAvailable} = this.state;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            backgroundColor: colorPrimary,
            paddingLeft: 10,
            paddingRight: 20,
            alignItems: 'center',
            paddingVertical: 10,
          }}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              style={{width: 35, justifyContent: 'center'}}
              onPress={this.handleBackButtonClick}>
              <Image
                style={{width: 20, height: 20, tintColor: black}}
                resizeMode={'contain'}
                source={require('../../icons/arrow_back.png')}
              />
            </TouchableOpacity>
            <Text
              style={{
                color: black,
                fontSize: 20,
                fontWeight: 'bold',
                marginLeft: 10,
              }}>
              Request
            </Text>
          </View>
        </View>
        <ScrollView>
          {!this.state.isLoading && this.state.secondTimeLoader != '' && (
            <View style={styles.headerLayoutStyle}>
              <View
                style={[styles.mainContainer, {backgroundColor: lightGray}]}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 20,
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: 18,
                    }}>
                    Hello,
                  </Text>
                  <Text style={{color: 'black', fontSize: 16, marginLeft: 5}}>
                    {providerDetails.name + ' ' + providerDetails.surname}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 15,
                  }}>
                  <Image
                    style={{width: 80, height: 80, borderRadius: 100}}
                    source={
                      imageAvailable
                        ? {uri: this.state.userImage}
                        : require('../../images/generic_avatar.png')
                    }
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 15,
                  }}>
                  <Text
                    style={{color: 'black', fontSize: 16, marginLeft: 5}}
                    numberOfLines={2}>
                    {this.state.userName +
                      ' is looking for a ' +
                      this.state.serviceName}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 50,
                  }}>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.rejectJob}>
                    <Text
                      style={[
                        styles.text,
                        {color: themeRed, fontWeight: '600'},
                      ]}>
                      Busy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.acceptJob}>
                    <Text
                      style={[
                        styles.text,
                        {color: colorGreen, fontWeight: '600'},
                      ]}>
                      Accept Chat
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.slidingPanelLayoutStyle}>
                <View style={styles.containerSlide}>
                  <View style={styles.mainContainerSlide}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        marginTop: 15,
                        color: white,
                      }}>
                      {this.state.userName}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        alignItems: 'center',
                        textAlign: 'center',
                        marginTop: 5,
                        color: white,
                      }}>
                      {this.state.userAddress}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 10,
                      }}>
                      <Image
                        style={{width: 15, height: 15, tintColor: white}}
                        source={require('../../icons/mobile.png')}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          marginLeft: 10,
                          color: white,
                        }}>
                        {this.state.userMobile}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 10,
                      }}>
                      <Image
                        style={{width: 15, height: 15, tintColor: white}}
                        source={require('../../icons/maps_location.png')}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          marginLeft: 10,
                          color: white,
                        }}>{`${this.state.distance} Kms from you`}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <Modal
            transparent={true}
            visible={this.state.isLoading}
            animationType="fade"
            onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
            <WaitingDialog
              changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
            />
          </Modal>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  mainContainer: {
    width: screenWidth,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  buttonContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: white,
    shadowColor: black,
    borderColor: lightGray,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  text: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
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
  timerView: {
    flex: 1,
    width: '100%',
    height: 65,
    textAlignVertical: 'center',
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  timerText: {
    width: 40,
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontWeight: 'bold',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
    paddingBottom: 8,
    color: 'black',
    borderRadius: 100,
    marginRight: 20,
  },
  headerLayoutStyle: {
    width: screenWidth,
    backgroundColor: colorBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slidingPanelLayoutStyle: {
    width: screenWidth,
    height: 400,
    backgroundColor: colorBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commonTextStyle: {
    color: 'white',
    fontSize: 18,
  },
  containerSlide: {
    flex: 1,
    width: screenWidth,
    height: 400,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colorBg,
  },
  mainContainerSlide: {
    width: screenWidth,
    height: 400,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: themeRed,
    borderRadius: 2,
  },
});

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
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
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobProvider());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobProviderInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchProviderJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    getPendingJobRequestProvider: (props, providerId, goTo) => {
      dispatch(getPendingJobRequestProvider(props, providerId, goTo));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProChatAcceptScreen);
