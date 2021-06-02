import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Linking,
  BackHandler,
  StatusBar,
  Platform,
} from 'react-native';
import {AirbnbRating} from 'react-native-ratings';
import Toast from 'react-native-simple-toast';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  fetchCustomerJobInfoError,
  setSelectedJobRequest,
  updateActiveRequest,
  getPendingJobRequest,
} from '../../Redux/Actions/jobsActions';
import WaitingDialog from '../WaitingDialog';
import {cloneDeep} from 'lodash';
import {
  updateUserDetails,
  updateProviderDetails,
} from '../../Redux/Actions/userActions';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import {requestForBooking} from '../../controllers/bookings';
import {
  lightGray,
  themeRed,
  colorBg,
  white,
  black,
  darkGray,
} from '../../Constants/colors';
import DialogComponent from '../DialogComponent';
import Availability from '../AvailabilityComponent';

const screenWidth = Dimensions.get('window').width;
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

class ProviderDetailsScreen extends Component {
  constructor() {
    super();
    this.state = {
      providerId: null,
      name: null,
      surname: null,
      image: null,
      imageAvailable: false,
      mobile: null,
      avgRating: null,
      distance: null,
      address: null,
      description: null,
      status: null,
      online: false,
      selectedStatus: '0',
      liveChatStatus: '0',
      fcmId: null,
      accountType: null,
      serviceName: null,
      serviceId: null,
      requestStatus: '',
      isJobAccepted: false,
      isErrorToast: false,
      isLoading: true,
      title: '',
      body: '',
      data: '',
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

  requestProBooking = async () =>
    await requestForBooking({
      fcm_id: this.state.fcmId,
      providerId: this.state.providerId,
      serviceId: this.state.serviceId,
      serviceName: this.state.serviceName,
      userDetails: this.props?.userInfo?.userDetails,
      online: this.state.online,
      navigation: this.props.navigation,
      onRequestSending: () =>
        this.setState({
          requestStatus: 'Request Sending...',
          isLoading: true,
        }),
      onSuccess: requestStatus => {
        this.props.updateActiveRequest(true);
        this.setState({
          requestStatus,
          isLoading: false,
        });
      },
      onError: (simple, msg) => {
        if (simple) {
          this.showToast(msg);
        } else {
          this.setState({
            requestStatus: 'No Response',
            isLoading: false,
          });
          this.showToast(msg);
        }
      },
      goBack: this.goBack,
    });

  goBack = () => {
    this.setState({isLoading: false, requestStatus: ''});
    this.props.navigation.goBack();
  };

  componentDidUpdate() {
    const {
      jobsInfo: {activeRequest},
      generalInfo: {OnlineUsers},
    } = this.props;
    const {requestStatus, liveChatStatus} = this.state;
    if (!activeRequest && requestStatus === 'Waiting for acceptance...')
      this.setState({requestStatus: ''});
    const currentliveChatStatus = OnlineUsers[this.state.providerId]
      ? OnlineUsers[this.state.providerId].status
      : '0';
    if (liveChatStatus !== currentliveChatStatus) {
      this.setState({
        online:
          this.state.selectedStatus === '1' && currentliveChatStatus === '1',
        liveChatStatus: currentliveChatStatus,
      });
    }
  }

  componentDidMount() {
    this.initialRender();
    const {navigation} = this.props;
    navigation.addListener('willFocus', async () => {
      //this.initialRender();
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      this.setState({
        isLoading: false,
        requestStatus: '',
      });
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
      const {
        userInfo: {userDetails},
        getPendingJobRequest,
      } = this.props;
      getPendingJobRequest(this.props, userDetails.userId);
    });
  }

  initialRender = async () => {
    const {
      navigation,
      generalInfo: {OnlineUsers},
    } = this.props;
    const liveChatStatus = OnlineUsers[navigation.state.params.providerId]
      ? OnlineUsers[navigation.state.params.providerId].status
      : '0';
    this.setState({
      providerId: navigation.state.params.providerId,
      name: navigation.state.params.name,
      surname: navigation.state.params.surname,
      image: navigation.state.params.image,
      imageAvailable: navigation.state.params.imageAvailable,
      mobile: navigation.state.params.mobile,
      avgRating: navigation.state.params.avgRating,
      distance: navigation.state.params.distance,
      address: navigation.state.params.address,
      description: navigation.state.params.description,
      status: navigation.state.params && navigation.state.params.status,
      online:
        navigation.state.params &&
        navigation.state.params.status === '1' &&
        liveChatStatus === '1',
      liveChatStatus,
      fcmId: navigation.state.params.fcmId,
      accountType: navigation.state.params.accountType,
      serviceName: navigation.state.params.serviceName,
      serviceId: navigation.state.params.serviceId,
      requestStatus: '',
      isJobAccepted: false,
      isErrorToast: false,
      isLoading: false,
      title: '',
      body: '',
      data: '',
    });
    const providerId = navigation.getParam('providerId');
    providerId &&
      setOnlineStatusListener({
        OnlineUsers,
        userId: providerId,
        setStatus: (selectedStatus, online) =>
          this.setState({
            selectedStatus,
            online,
          }),
      });
  };

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  };

  goToChatScreen = () => {
    const {
      userInfo: {userDetails},
      jobsInfo: {jobRequests},
      fetchedPendingJobInfo,
    } = this.props;
    let newJobRequests = cloneDeep(jobRequests);
    let data = this.state.data;
    const providerData = JSON.parse(data.ProviderData);
    const pendingJobData = {
      id: data.mainId,
      order_id: data.orderId,
      employee_id: providerData.providerId,
      image: providerData.imageSource,
      fcm_id: providerData.fcmId,
      name: providerData.name,
      surName: providerData.surname,
      mobile: providerData.mobile,
      description: providerData.description,
      address: providerData.address,
      lat: providerData.lat,
      lang: providerData.lang,
      service_name: this.state.serviceName,
      chat_status: data.chat_status,
      status: data && data.status,
      delivery_address: userDetails.address,
      delivery_lat: userDetails.lat,
      delivery_lang: userDetails.lang,
    };
    newJobRequests.push(pendingJobData);
    fetchedPendingJobInfo(newJobRequests);
    this.props.navigation.navigate('Chat', {
      titlePage: 'ProviderDetails',
      isJobAccepted: this.state.isJobAccepted,
    });
  };

  goToMapDirection = () => {
    this.props.navigation.navigate('MapDirection', {
      titlePage: 'ProviderDetails',
    });
  };

  callPhoneTask = () => {
    Linking.openURL('tel:' + this.state.mobile);
  };

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  componentWillUnmount() {
    const {
      userInfo: {userDetails},
      getPendingJobRequest,
      navigation,
    } = this.props;
    getPendingJobRequest(this.props, userDetails.userId);
    const providerId = navigation.getParam('providerId');
    providerId && deregisterOnlineStatusListener(providerId);
  }

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
        <View style={styles.header}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                justifyContent: 'center',
                marginLeft: 5,
              }}
              onPress={this.props.navigation.getParam('onGoBack')}>
              <Image
                style={{width: 20, height: 20, alignSelf: 'center'}}
                source={require('../../icons/arrow_back.png')}
              />
            </TouchableOpacity>
            <Text
              style={{
                color: white,
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginLeft: 5,
              }}>
              Provider Details
            </Text>
          </View>
        </View>

        <View
          style={{
            width: '100%',
            height: 50,
            flexDirection: 'row',
            backgroundColor: white,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
          }}>
          <View style={styles.textView}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: black,
                textAlignVertical: 'center',
              }}>
              {this.state.name}
            </Text>
          </View>
          <Availability online={this.state.online} />
        </View>

        <View
          style={{
            width: screenWidth,
            flexDirection: 'row',
            backgroundColor: 'white',
            alignContent: 'center',
            paddingTop: 10,
            paddingBottom: 25,
            paddingLeft: 5,
            paddingRight: 5,
          }}>
          <View style={{flexDirection: 'column', marginLeft: 10}}>
            <Image
              style={{
                width: 60,
                height: 60,
                borderRadius: 100,
                alignSelf: 'center',
              }}
              source={
                this.state.imageAvailable
                  ? {uri: this.state.image}
                  : require('../../images/generic_avatar.png')
              }
            />

            <View style={{backgroundColor: 'white', marginTop: 5}}>
              <AirbnbRating
                type="custom"
                ratingCount={5}
                defaultRating={this.state.avgRating}
                size={10}
                ratingBackgroundColor={colorBg}
                showRating={false}
                onFinishRating={this.ratingCompleted}
              />
            </View>
          </View>
          <View style={{flex: 1, flexDirection: 'column', marginLeft: 20}}>
            <Text>
              <Text style={{color: darkGray, fontWeight: 'bold'}}>
                Account Type:{' '}
              </Text>
              <Text>{this.state.accountType}</Text>
            </Text>
            <View style={{flexDirection: 'row'}}>
              <Text style={{color: darkGray, fontWeight: 'bold'}}>
                Distance from you:{' '}
              </Text>
              {this.state.distance !== 'NaN' ? (
                <Text>{this.state.distance + ' Km'}</Text>
              ) : (
                <ActivityIndicator
                  style={styles.smActivityIndicator}
                  color="#C00"
                  size="small"
                />
              )}
            </View>
            <Text>
              <Text style={{color: darkGray, fontWeight: 'bold'}}>
                Current Location:{' '}
              </Text>
              <Text>{this.state.address}</Text>
            </Text>
            <Text>
              <Text style={{color: darkGray, fontWeight: 'bold'}}>
                Self Description:{' '}
              </Text>
              <Text>{this.state.description}</Text>
            </Text>
          </View>
        </View>

        {(this.state.requestStatus === '' ||
          this.state.requestStatus === 'No Response') && (
          <View style={[styles.bottomView, {flexDirection: 'row'}]}>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={this.requestProBooking}>
              <Text style={styles.text}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {this.state.requestStatus === 'Chat Request Accepted' && (
          <View style={styles.bottomView}>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() => this.goToChatScreen()}>
              <Text style={styles.text}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={this.callPhoneTask}>
              <Text style={styles.text}>Call</Text>
            </TouchableOpacity>

            {this.state.isJobAccepted && (
              <View
                style={{
                  flexDirection: 'column',
                  width: screenWidth,
                  height: 50,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: screenWidth,
                    height: 1,
                    backgroundColor: lightGray,
                  }}
                />
                <TouchableOpacity
                  style={styles.textViewDirection}
                  onPress={this.goToMapDirection}>
                  <Image
                    style={{width: 20, height: 20, marginLeft: 20}}
                    source={require('../../icons/mobile_gps.png')}
                  />
                  <Text
                    style={{
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: 16,
                      textAlign: 'center',
                      marginLeft: 10,
                    }}>
                    Track Service Provider
                  </Text>
                  <Image
                    style={{
                      width: 20,
                      height: 20,
                      marginLeft: 20,
                      position: 'absolute',
                      end: 0,
                      marginRight: 15,
                    }}
                    source={require('../../icons/right_arrow.png')}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {this.state.requestStatus === 'Request Sending...' ||
          (this.state.requestStatus === 'Waiting for acceptance...' && (
            <View style={styles.loaderStyle}>
              <ActivityIndicator
                style={{
                  height: 30,
                  width: 30,
                  alignContent: 'flex-start',
                  marginHorizontal: 20,
                }}
                color={themeRed}
                size="large"
              />

              <Text
                style={{
                  color: 'black',
                  fontSize: 15,
                  fontWeight: 'bold',
                  textAlignVertical: 'center',
                  alignSelf: 'center',
                }}>
                {this.state.requestStatus}
              </Text>
            </View>
          ))}
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
      dispatch(startFetchingJobCustomer());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobCustomerInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchCustomerJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    updateActiveRequest: val => {
      dispatch(updateActiveRequest(val));
    },
    updateUserDetails: details => {
      dispatch(updateUserDetails(details));
    },
    updateProviderDetails: details => {
      dispatch(updateProviderDetails(details));
    },
    getPendingJobRequest: (props, userId, goTo) => {
      dispatch(getPendingJobRequest(props, userId, goTo));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProviderDetailsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: themeRed,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  mainContainer: {
    backgroundColor: 'white',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  smActivityIndicator: {
    height: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    justifyContent: 'center',
  },
  textView: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  onlineOfflineView: {
    flex: 1,
    flexDirection: 'row',
    textAlignVertical: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  onlineOfflineDisplay: {
    width: 20,
    height: 20,
    textAlign: 'center',
    shadowColor: themeRed,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 10,
    marginRight: 10,
    borderRadius: 20,
  },
  timerView: {
    flex: 1,
    height: 65,
    textAlignVertical: 'center',
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  timerTextView: {
    width: 75,
    textAlignVertical: 'center',
    alignSelf: 'flex-end',
    padding: 10,
    borderRadius: 200,
    marginRight: 20,
  },
  timerText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontWeight: 'bold',
    color: white,
  },
  bottomView: {
    width: screenWidth,
    flexDirection: 'column',
    backgroundColor: lightGray,
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
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
  loaderStyle: {
    width: screenWidth,
    flexDirection: 'row',
    alignItems: 'center',
    height: 65,
    flexDirection: 'row',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
});
