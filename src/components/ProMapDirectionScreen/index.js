import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  BackHandler,
  Linking,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {isEqual} from 'lodash';
import MapView from 'react-native-maps';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import SimpleToast from 'react-native-simple-toast';
import Config from '../Config';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
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
  fetchedDataWorkSource,
} from '../../Redux/Actions/jobsActions';
import {
  colorBg,
  white,
  black,
  lightGray,
  themeRed,
  colorGreen,
} from '../../Constants/colors';
import {getDirections} from '../../misc/helpers';
import {jobCompleteTask, jobCancelTask} from '../../controllers/jobs';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
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

class ProMapDirectionScreen extends Component {
  constructor(props) {
    super();
    const {
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        jobRequestsProviders,
        selectedJobRequest: {user_id},
      },
      navigation,
    } = props;
    let currentPos = navigation.getParam('currentPos', 0);
    const currentRequest = jobRequestsProviders[currentPos] || {};
    this.state = {
      sourcesourceLocation:
        usersCoordinates.latitude + ',' + usersCoordinates.longitude,
      sourceLat: parseFloat(usersCoordinates.latitude),
      sourceLng: parseFloat(usersCoordinates.longitude),
      destinationLocation:
        othersCoordinates[user_id]?.latitude +
        ',' +
        othersCoordinates[user_id]?.longitude,
      destinationLat: parseFloat(othersCoordinates[user_id]?.latitude),
      destinationLng: parseFloat(othersCoordinates[user_id]?.longitude),
      routeCoordinates: [],
      isLoading: othersCoordinates[user_id],
      pageTitle: navigation.state.params.pageTitle,
      currentPos,
      userId: currentRequest.user_id,
      userName: currentRequest.name,
      userImage: currentRequest.image,
      userMobile: currentRequest.mobile,
      userDob: currentRequest.dob,
      userAddress: currentRequest.address,
      userLat: currentRequest.lat,
      userLang: currentRequest.lang,
      userFcmId: currentRequest.fcm_id,
      orderId: currentRequest.order_id,
      serviceName: currentRequest.service_name,
      mainId: currentRequest.id,
      delivertAddress: currentRequest.delivery_address,
      deliveryLat: currentRequest.delivery_lat,
      deliveryLang: currentRequest.delivery_lang,
      chatStatus: currentRequest.chat_status,
      status: currentRequest.status,
      proImageAvailable: currentRequest.imageAvailable,
      isJobAccepted: currentRequest.status === 'Accepted',
      showDialog: false,
      currentModal: null,
    };
  }

  componentDidMount() {
    const {
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      navigation,
    } = this.props;
    const destination =
      othersCoordinates[user_id]?.latitude +
      ',' +
      othersCoordinates[user_id]?.longitude;
    this.getDirectionsLocal(
      usersCoordinates.latitude + ',' + usersCoordinates.longitude,
      destination,
    );
    navigation.addListener('willFocus', async () => {
      this.onRefresh(this.props);
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

  componentDidUpdate(oldProps) {
    const {
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
    } = this.props;
    if (
      (othersCoordinates &&
        oldProps &&
        oldProps.generalInfo &&
        oldProps.generalInfo.othersCoordinates &&
        !isEqual(
          othersCoordinates[user_id],
          oldProps.generalInfo.othersCoordinates[user_id],
        )) ||
      (usersCoordinates &&
        oldProps &&
        oldProps.generalInfo &&
        oldProps.generalInfo.usersCoordinates &&
        !isEqual(usersCoordinates, oldProps.generalInfo.usersCoordinates))
    ) {
      this.onRefresh(this.props);
    }
  }

  onRefresh = props => {
    const {
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        jobRequestsProviders,
        selectedJobRequest: {user_id},
      },
      navigation,
    } = props;
    let currentPos = navigation.getParam('currentPos', 0);
    const currentRequest = jobRequestsProviders[currentPos] || {};
    if (currentPos || (currentPos === 0 && jobRequestsProviders[currentPos])) {
      this.setState({
        sourcesourceLocation:
          usersCoordinates.latitude + ',' + usersCoordinates.longitude,
        sourceLat: parseFloat(usersCoordinates.latitude),
        sourceLng: parseFloat(usersCoordinates.longitude),
        destinationLocation:
          othersCoordinates[user_id]?.latitude +
          ',' +
          othersCoordinates[user_id]?.longitude,
        destinationLat: parseFloat(othersCoordinates[user_id]?.latitude),
        destinationLng: parseFloat(othersCoordinates[user_id]?.longitude),
        routeCoordinates: [],
        isLoading: othersCoordinates[user_id],
        pageTitle: navigation.state.params.pageTitle,
        currentPos,
        userId: currentRequest.user_id,
        userName: currentRequest.name,
        userImage: currentRequest.image,
        userMobile: currentRequest.mobile,
        userDob: currentRequest.dob,
        userAddress: currentRequest.address,
        userLat: currentRequest.lat,
        userLang: currentRequest.lang,
        userFcmId: currentRequest.fcm_id,
        orderId: currentRequest.order_id,
        serviceName: currentRequest.service_name,
        mainId: currentRequest.id,
        delivertAddress: currentRequest.delivery_address,
        deliveryLat: currentRequest.delivery_lat,
        deliveryLang: currentRequest.delivery_lang,
        chatStatus: currentRequest.chat_status,
        status: currentRequest.status,
        proImageAvailable: currentRequest.imageAvailable,
        isJobAccepted: currentRequest.status === 'Accepted',
        showDialog: false,
        currentModal: null,
      });
      const destination =
        othersCoordinates[user_id]?.latitude +
        ',' +
        othersCoordinates[user_id]?.longitude;
      this.getDirectionsLocal(
        usersCoordinates.latitude + ',' + usersCoordinates.longitude,
        destination,
      );
    }
  };

  handleBackButtonClick = () => {
    if (this.state.pageTitle == 'ProDashboard')
      this.props.navigation.navigate('ProDashboard');
    else if (this.state.pageTitle == 'ProAcceptRejectJob')
      this.props.navigation.navigate('ProAcceptRejectJob');
    else this.props.navigation.goBack();
    return true;
  };

  callPhoneTask = () => {
    Linking.openURL('tel:' + this.state.userMobile);
  };

  getDirectionsLocal = async (startLoc, destinationLoc) =>
    await getDirections({
      startLoc,
      destinationLoc,
      onSuccess: routeCoordinates =>
        this.setState({routeCoordinates, isLoading: false}),
    });

  openCompleteConfirmation = () => {
    this.setState({currentModal: 'complete', showDialog: true});
  };

  openCancelConfirmation = () => {
    this.setState({currentModal: 'cancel', showDialog: true});
  };

  jobCompleteTaskProvider = async () =>
    jobCompleteTask({
      userType: 'Provider',
      currRequestPos: this.props.navigation.getParam('currentPos', 0),
      jobRequests: this.props?.jobsInfo?.jobRequestsProviders,
      userDetails: this.props?.userInfo?.providerDetails,
      updatePendingJobInfo: this.props.fetchedPendingJobInfo,
      toggleIsLoading: val => {
        this.changeWaitingDialogVisibility(val);
        this.props.fetchingPendingJobInfo();
      },
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isAcceptJob: true,
          showDialog: false,
        }),
      onError: msg => {
        SimpleToast.show(msg);
        this.setState({
          isLoading: false,
          showDialog: false,
        });
      },
      navigate: this.props.navigation.navigate,
      rejectAcceptURL: REJECT_ACCEPT_REQUEST,
    });

  jobCancelTaskLocal = async () =>
    await jobCancelTask({
      userType: 'Provider',
      currRequestPos: this.props.navigation.getParam('currentPos', 0),
      toggleIsLoading: val => {
        this.changeWaitingDialogVisibility(val);
        this.props.fetchingPendingJobInfo();
      },
      updatePendingJobInfo: this.props.fetchedPendingJobInfo,
      jobRequests: this.props?.jobsInfo?.jobRequestsProviders,
      userDetails: this.props?.userInfo?.providerDetails,
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isAcceptJob: false,
          showDialog: false,
        }),
      onError: msg => {
        SimpleToast.show(msg);
        this.setState({
          isLoading: false,
          showDialog: false,
        });
      },
      navigate: this.props.navigation.navigate,
    });

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  changeDialogVisibility = () =>
    this.setState(prevState => ({showDialog: !prevState.showDialog}));

  render() {
    const {
      sourceLat,
      sourceLng,
      destinationLat,
      destinationLng,
      routeCoordinates,
      userName,
      userImage,
      proImageAvailable,
      serviceName,
      status,
      currentModal,
      showDialog,
    } = this.state;
    const {fetchedNotifications} = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <DialogComponent
          transparent={true}
          isDialogVisible={showDialog && currentModal !== null ? true : false}
          animation="fade"
          width={screenWidth - 80}
          changeDialogVisibility={this.changeDialogVisibility}
          leftButtonAction={this.changeDialogVisibility}
          rightButtonAction={
            currentModal && currentModal === 'cancel'
              ? this.jobCancelTaskLocal
              : this.jobCompleteTaskProvider
          }
          isLoading={false}
          titleText={
            currentModal && currentModal === 'cancel'
              ? 'Cancel Job Request'
              : 'Completed'
          }
          descText="Are you sure?"
          leftButtonText="Cancel"
          rightButtonText="Ok"
        />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 50,
            backgroundColor: colorBg,
            paddingLeft: 10,
            paddingRight: 20,
            paddingBottom: 5,
            borderBottomColor: themeRed,
            borderBottomWidth: 1,
          }}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              style={{width: 35, height: 35, justifyContent: 'center'}}
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

            <Text
              style={{
                color: black,
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginLeft: 5,
              }}>
              Direction
            </Text>
          </View>
        </View>
        {sourceLat && sourceLng && destinationLat && destinationLng ? (
          <MapView
            style={styles.map}
            region={{
              latitude: sourceLat,
              longitude: sourceLng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0121,
            }}
            zoomEnabled={true}
            minZoomLevel={16}
            maxZoomLevel={20}>
            {Platform.OS === 'ios' && (
              <View style={styles.header}>
                <View style={{flex: 1, flexDirection: 'row', margin: 5}}>
                  <TouchableOpacity
                    style={{
                      width: 35,
                      height: 35,
                      alignSelf: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => this.props.navigation.goBack()}>
                    <Image
                      style={{width: 20, height: 20, alignSelf: 'center'}}
                      source={require('../../icons/back_arrow_double.png')}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <MapView.Marker
              coordinate={{
                latitude: sourceLat,
                longitude: sourceLng,
              }}
              title="You"
              description={''}>
              <Image
                style={{width: 35, height: 35, backgroundColor: 'transparent'}}
                source={require('../../icons/car_marker.png')}
              />
            </MapView.Marker>
            <MapView.Marker
              coordinate={{
                latitude: destinationLat,
                longitude: destinationLng,
              }}
              title="Destination"
              description={userName}>
              <Image
                style={{width: 35, height: 35, backgroundColor: 'transparent'}}
                source={require('../../icons/home_marker.png')}
              />
            </MapView.Marker>
            <MapView.Polyline
              coordinates={routeCoordinates}
              strokeColor={themeRed} // fallback for when `strokeColors` is not supported by the map-provider
              strokeColors={[
                '#7F0000',
                black, // no color, creates a "long" gradient between the previous and next coordinate
                '#B24112',
                '#E5845C',
                '#238C23',
                '#7F0000',
              ]}
              strokeWidth={2}
            />
          </MapView>
        ) : (
          <ActivityIndicator size={30} color={'#000'} />
        )}
        <SlidingPanel
          headerLayoutHeight={140}
          headerLayout={() => (
            <View style={styles.headerLayoutStyle}>
              <View
                style={{flex: 1, flexDirection: 'column', width: screenWidth}}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    marginTop: 5,
                  }}>
                  <Image
                    style={{width: 20, height: 20}}
                    source={require('../../icons/up_arrow.gif')}
                  />
                </View>
                <View style={{flexDirection: 'row', flex: 1}}>
                  <Image
                    style={{
                      height: 55,
                      width: 55,
                      justifyContent: 'center',
                      alignSelf: 'center',
                      alignContent: 'flex-start',
                      marginLeft: 10,
                      borderRadius: 200,
                    }}
                    source={
                      proImageAvailable
                        ? {uri: userImage}
                        : require('../../images/generic_avatar.png')
                    }
                  />
                  <View
                    style={{flexDirection: 'column', justifyContent: 'center'}}>
                    <Text
                      style={{
                        marginRight: 200,
                        color: white,
                        fontSize: 18,
                        marginLeft: 10,
                        fontWeight: 'bold',
                        textAlignVertical: 'center',
                      }}
                      numberOfLines={1}>
                      {userName}
                    </Text>
                    <Text
                      style={{
                        color: white,
                        fontSize: 14,
                        marginLeft: 10,
                        textAlignVertical: 'center',
                      }}>
                      {serviceName}
                    </Text>
                    <Text
                      style={{
                        color: white,
                        fontSize: 14,
                        marginLeft: 10,
                        textAlignVertical: 'center',
                        fontWeight: 'bold',
                      }}>
                      {status == 'Pending'
                        ? 'Chat Request Accepted'
                        : 'Job Accepted'}
                    </Text>
                  </View>

                  <View style={styles.callView}>
                    <TouchableOpacity
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: white,
                        borderRadius: 5,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 0},
                        shadowOpacity: 0.75,
                        shadowRadius: 5,
                        elevation: 5,
                        padding: 10,
                        marginRight: 15,
                      }}
                      onPress={this.callPhoneTask}>
                      <Image
                        style={[styles.call, {tintColor: themeRed}]}
                        source={require('../../icons/call.png')}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: white,
                        borderRadius: 5,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 0},
                        shadowOpacity: 0.75,
                        shadowRadius: 5,
                        elevation: 5,
                        padding: 10,
                      }}
                      onPress={() => {
                        fetchedNotifications({
                          type: 'messages',
                          value: 0,
                        });
                        this.props.navigation.navigate('ProAcceptRejectJob', {
                          pageTitle: 'ProMapDirection',
                          currentPos: this.state.currentPos,
                        });
                      }}>
                      <Image
                        style={[styles.call, {tintColor: themeRed}]}
                        source={require('../../icons/chat.png')}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
          slidingPanelLayout={() => (
            <View style={styles.slidingPanelLayoutStyle}>
              <View style={styles.containerSlide}>
                {this.state.isJobAccepted && (
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.openCompleteConfirmation}>
                    <Text
                      style={[
                        styles.text,
                        {color: colorGreen, fontWeight: 'bold'},
                      ]}>
                      Completed
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={this.openCancelConfirmation}>
                  <Text
                    style={[
                      styles.text,
                      {color: themeRed, fontWeight: 'bold'},
                    ]}>
                    {this.state.isJobAccepted ? 'Cancel Job' : 'Reject Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  map: {
    height: screenHeight,
    width: screenWidth,
    marginBottom: 140,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  footerView: {
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  footer: {
    width: screenWidth / 1.5,
    flexDirection: 'column',
    backgroundColor: '#191970',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    padding: 15,
    borderRadius: 2,
    position: 'absolute', //Footer
    bottom: 0, //Footer
    marginBottom: 10,
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
  headerLayoutStyle: {
    width: screenWidth + 5,
    height: 140,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    shadowColor: black,
    borderWidth: 0.5,
    borderColor: lightGray,
    backgroundColor: themeRed,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerSlide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: colorBg,
  },
  slidingPanelLayoutStyle: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: colorBg,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callView: {
    flex: 1,
    flexDirection: 'row',
    height: 115,
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    end: 0,
    paddingRight: 15,
  },
  call: {
    width: 20,
    height: 20,
  },
  buttonContainer: {
    flex: 1,
    //width: 200,
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
    fontSize: 16,
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
    fetchedDataWorkSource: dws => {
      dispatch(fetchedDataWorkSource(dws));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProMapDirectionScreen);
