import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  Linking,
  BackHandler,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';
import SimpleToast from 'react-native-simple-toast';
import MapView from 'react-native-maps';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  fetchCustomerJobInfoError,
  setSelectedJobRequest,
} from '../../Redux/Actions/jobsActions';
import DialogComponent from '../DialogComponent';
import Config from '../Config';
import {
  white,
  colorBg,
  lightGray,
  black,
  themeRed,
  colorGreen,
} from '../../Constants/colors';
import {jobCompleteTask, jobCancelTask} from '../../controllers/jobs';
import {getDirections} from '../../misc/helpers';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';

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

class MapDirectionScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: {userDetails},
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        jobRequests,
        selectedJobRequest: {employee_id},
      },
      navigation,
    } = props;
    const currRequestPos = navigation.getParam('currentPos', 0);
    const employeeLatitude = othersCoordinates[employee_id]
      ? othersCoordinates[employee_id].latitude
      : usersCoordinates.latitude;
    const employeeLongitude = othersCoordinates[employee_id]
      ? othersCoordinates[employee_id].longitude
      : usersCoordinates.longitude;
    this.state = {
      sourceLocation: employeeLatitude + ',' + employeeLongitude,
      sourceLat: parseFloat(employeeLatitude),
      sourceLng: parseFloat(employeeLongitude),
      destinationLocation:
        usersCoordinates.latitude + ',' + usersCoordinates.longitude,
      destinationLat: parseFloat(usersCoordinates.latitude),
      destinationLng: parseFloat(usersCoordinates.longitude),
      coords: [],
      isLoading: true,
      senderId: userDetails.userId,
      senderImage: userDetails.image,
      senderName: userDetails.username,
      inputMessage: '',
      dataChatSource: [],
      currRequestPos,
      id: jobRequests[currRequestPos].id,
      orderId: jobRequests[currRequestPos].order_id,
      providerId: jobRequests[currRequestPos].employee_id,
      providerImage: jobRequests[currRequestPos].image,
      providerfcmId: jobRequests[currRequestPos].fcm_id,
      providerName:
        jobRequests[currRequestPos].name +
        ' ' +
        jobRequests[currRequestPos].surName,
      providerMobile: jobRequests[currRequestPos].mobile,
      providerDescription: jobRequests[currRequestPos].description,
      providerAddress: jobRequests[currRequestPos].address,
      providerLat: jobRequests[currRequestPos].lat,
      providerLang: jobRequests[currRequestPos].lang,
      serviceName: jobRequests[currRequestPos].service_name,
      isJobAccepted: jobRequests[currRequestPos].status === 'Accepted',
      titlePage: navigation.state.params.titlePage,
      mapKey: Math.random(2),
      fcm_id: jobRequests[currRequestPos].fcm_id,
      employeeLocationFetched: othersCoordinates[employee_id] ? true : false,
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

  reInit = props => {
    const {
      userInfo: {userDetails},
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        jobRequests,
        selectedJobRequest: {employee_id},
      },
      navigation,
    } = props;
    const currRequestPos = navigation.getParam('currentPos', 0);
    if (
      (currRequestPos || currRequestPos === 0) &&
      jobRequests[currRequestPos]
    ) {
      const employeeLatitude = othersCoordinates[employee_id]
        ? othersCoordinates[employee_id].latitude
        : usersCoordinates.latitude;
      const employeeLongitude = othersCoordinates[employee_id]
        ? othersCoordinates[employee_id].longitude
        : usersCoordinates.longitude;

      this.setState({
        sourceLocation: employeeLatitude + ',' + employeeLongitude,
        sourceLat: parseFloat(employeeLatitude),
        sourceLng: parseFloat(employeeLongitude),
        destinationLocation:
          usersCoordinates.latitude + ',' + usersCoordinates.longitude,
        destinationLat: parseFloat(usersCoordinates.latitude),
        destinationLng: parseFloat(usersCoordinates.longitude),
        coords: [],
        isLoading: true,
        senderId: userDetails.userId,
        senderImage: userDetails.image,
        senderName: userDetails.username,
        inputMessage: '',
        dataChatSource: [],
        currRequestPos,
        id: jobRequests[currRequestPos].id,
        orderId: jobRequests[currRequestPos].order_id,
        providerId: jobRequests[currRequestPos].employee_id,
        providerImage: jobRequests[currRequestPos].image,
        providerfcmId: jobRequests[currRequestPos].fcm_id,
        providerName:
          jobRequests[currRequestPos].name +
          ' ' +
          jobRequests[currRequestPos].surName,
        providerMobile: jobRequests[currRequestPos].mobile,
        providerDescription: jobRequests[currRequestPos].description,
        providerAddress: jobRequests[currRequestPos].address,
        providerLat: jobRequests[currRequestPos].lat,
        providerLang: jobRequests[currRequestPos].lang,
        serviceName: jobRequests[currRequestPos].service_name,
        isJobAccepted: jobRequests[currRequestPos].status === 'Accepted',
        titlePage: navigation.state.params.titlePage,
        mapKey: Math.random(2),
        fcm_id: jobRequests[currRequestPos].fcm_id,
        employeeLocationFetched: othersCoordinates[employee_id] ? true : false,
        showDialog: false,
        dialogType: null,
        dialogTitle: '',
        dialogDesc: '',
        dialogLeftText: 'Cancel',
        dialogRightText: 'Retry',
      });
    }
  };

  componentDidMount() {
    const {
      generalInfo: {othersCoordinates, usersCoordinates},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      navigation,
    } = this.props;
    const employeeLatitude = othersCoordinates[employee_id]
      ? othersCoordinates[employee_id].latitude
      : usersCoordinates.latitude;
    const employeeLongitude = othersCoordinates[employee_id]
      ? othersCoordinates[employee_id].longitude
      : usersCoordinates.longitude;

    const destination =
      usersCoordinates.latitude + ',' + usersCoordinates.longitude;
    this.getDirectionsLocal(
      employeeLatitude + ',' + employeeLongitude,
      destination,
    );

    navigation.addListener('willFocus', async () => {
      this.reInit(this.props);
      this.refetchDirections();
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
        selectedJobRequest: {employee_id},
      },
    } = this.props;
    if (
      (othersCoordinates &&
        oldProps &&
        !isEqual(
          othersCoordinates[employee_id],
          oldProps?.generalInfo?.othersCoordinates[employee_id],
        )) ||
      (usersCoordinates &&
        !isEqual(usersCoordinates, oldProps?.generalInfo?.usersCoordinates))
    ) {
      this.reInit(this.props);
      const employeeLatitude = othersCoordinates[employee_id]
        ? othersCoordinates[employee_id]?.latitude
        : usersCoordinates.latitude;
      const employeeLongitude = othersCoordinates[employee_id]
        ? othersCoordinates[employee_id]?.longitude
        : usersCoordinates.longitude;
      const destination =
        usersCoordinates.latitude + ',' + usersCoordinates.longitude;
      this.getDirectionsLocal(
        employeeLatitude + ',' + employeeLongitude,
        destination,
      );
    }
  }

  refetchDirections = () => {
    const {
      generalInfo: {usersCoordinates, othersCoordinates},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
    } = this.props;
    const {latitude, longitude} = othersCoordinates[employee_id] || {};
    const {destinationLat, destinationLng, coords} = this.state;
    if (latitude !== undefined && longitude !== undefined) {
      if (
        Math.floor(parseInt(latitude)) !==
          Math.floor(parseInt(destinationLat)) ||
        Math.floor(parseInt(longitude)) !== Math.floor(parseInt(destinationLng))
      ) {
        this.setState({
          sourceLocation: latitude + ',' + longitude,
          sourceLat: parseFloat(latitude),
          sourceLng: parseFloat(longitude),
          destinationLocation:
            usersCoordinates.latitude + ',' + usersCoordinates.longitude,
          destinationLat: parseFloat(usersCoordinates.latitude),
          destinationLng: parseFloat(usersCoordinates.longitude),
        });
        const destination =
          usersCoordinates.latitude + ',' + usersCoordinates.longitude;
        this.getDirectionsLocal(latitude + ',' + longitude, destination);
      }
    }
    if (this.state.coords.length === 0) {
      this.getDirectionsLocal(
        latitude + ',' + longitude,
        this.state.destinationLocation,
      );
    } else {
      let actualLat1 = coords[0].latitude;
      let actualLong1 = coords[0].longitude;
      if (actualLat1 && actualLong1 && !this.state.keyReset)
        this.setState({mapKey: Math.random(2), keyReset: true});
    }
  };

  handleBackButtonClick = () => {
    if (this.state.titlePage === 'Dashboard')
      this.props.navigation.navigate('Dashboard');
    else if (this.state.titlePage === 'ProviderDetails')
      this.props.navigation.navigate('ProviderDetails');
    else if (this.state.titlePage === 'Chat')
      this.props.navigation.navigate('Chat');
    else this.props.navigation.goBack();
    return true;
  };

  getDirectionsLocal = async (startLoc, destinationLoc) =>
    await getDirections({
      startLoc,
      destinationLoc,
      onSuccess: coords => this.setState({coords, isLoading: false}),
    });

  callPhoneTask = () => {
    Linking.openURL('tel:' + this.state.providerMobile);
  };

  openCompleteConfirmation = () => {
    this.leftButtonActon = () => {
      this.setState({
        isLoading: false,
        showDialog: false,
        dialogType: null,
      });
    };
    this.rightButtonAction = async () => {
      await this.jobCompleteTaskCustomer();
      this.setState({
        showDialog: false,
        dialogType: null,
      });
    };
    this.setState({
      isLoading: false,
      showDialog: true,
      dialogType: 'fb',
      dialogTitle: 'JOB COMPLETED',
      dialogDesc: 'Are you sure?',
      dialogLeftText: 'No',
      dialogRightText: 'Yes',
    });
  };

  openCancelConfirmation = () => {
    this.leftButtonActon = () => {
      this.setState({
        isLoading: false,
        showDialog: false,
        dialogType: null,
      });
    };
    this.rightButtonAction = async () => {
      await this.jobCancelTaskLocal();
      this.setState({
        showDialog: false,
        dialogType: null,
      });
    };
    this.setState({
      isLoading: false,
      showDialog: true,
      dialogType: 'fb',
      dialogTitle: 'CANCEL JOB',
      dialogDesc: 'Are you sure?',
      dialogLeftText: 'No',
      dialogRightText: 'Yes',
    });
  };

  jobCancelTaskLocal = async () =>
    await jobCancelTask({
      userType: 'Customer',
      currRequestPos: this.props.navigation.getParam('currentPos', 0),
      toggleIsLoading: val => {
        this.toggleIsLoading(val);
        this.props.fetchingPendingJobInfo();
      },
      updatePendingJobInfo: this.props.fetchedPendingJobInfo,
      jobRequests: this.props?.jobsInfo?.jobRequests,
      userDetails: this.props?.userInfo?.userDetails,
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isAcceptJob: false,
          showDialog: false,
        }),
      onError: msg => {
        this.setState({isLoading: false});
        SimpleToast.show(msg);
      },
      navigate: this.props.navigation.navigate,
    });

  jobCompleteTaskCustomer = async () =>
    await jobCompleteTask({
      userType: 'Customer',
      currRequestPos: this.props.navigation.getParam('currentPos', 0),
      jobRequests: this.props?.jobsInfo?.jobRequests,
      userDetails: this.props?.userInfo?.userDetails,
      updatePendingJobInfo: this.props.fetchedPendingJobInfo,
      toggleIsLoading: val => {
        this.toggleIsLoading(val);
        this.props.fetchingPendingJobInfo();
      },
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isAcceptJob: true,
        }),
      onError: msg => {
        this.setState({
          isLoading: false,
          isAcceptJob: false,
        });
        SimpleToast.show(msg);
      },
      navigate: this.props.navigation.navigate,
      rejectAcceptURL: REJECT_ACCEPT_REQUEST,
    });

  changeDialogVisibility = () =>
    this.setState(prevState => ({showDialog: !prevState.showDialog}));

  toggleIsLoading = bool =>
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));

  render() {
    const {
      userInfo: {userDetails},
      jobsInfo: {jobRequests},
      fetchedNotifications,
    } = this.props;
    const {
      currRequestPos,
      sourceLat,
      sourceLng,
      destinationLat,
      destinationLng,
      coords,
      providerName,
      mapKey,
    } = this.state;
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
              Track Service Provider
            </Text>
          </View>
        </View>
        {sourceLat && sourceLng && destinationLat && destinationLng ? (
          <MapView
            key={mapKey}
            style={styles.map}
            region={{
              latitude: destinationLat,
              longitude: destinationLng,
              latitudeDelta: 0.00922,
              longitudeDelta: 0.00121,
            }}
            zoomEnabled={true}
            minZoomLevel={1}
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
              title={userDetails.username}
              description="Vous">
              <Image
                style={{
                  width: 35,
                  height: 35,
                  backgroundColor: 'transparent',
                }}
                source={require('../../icons/home_marker.png')}
              />
            </MapView.Marker>

            <MapView.Marker
              coordinate={{
                latitude: destinationLat,
                longitude: destinationLng,
              }}
              title="Fournisseur"
              description={providerName}>
              <Image
                style={{
                  width: 35,
                  height: 35,
                  backgroundColor: 'transparent',
                }}
                source={require('../../icons/car_marker.png')}
              />
            </MapView.Marker>
            <MapView.Polyline
              coordinates={coords}
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
        {jobRequests && jobRequests[currRequestPos] && (
          <SlidingPanel
            headerLayoutHeight={140}
            headerLayout={() => (
              <View style={styles.headerLayoutStyle}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'column',
                    width: screenWidth,
                  }}>
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
                        jobRequests[currRequestPos] &&
                        jobRequests[currRequestPos].imageAvailable
                          ? {uri: jobRequests[currRequestPos].image}
                          : require('../../images/generic_avatar.png')
                      }
                    />
                    <View
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}>
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
                        {jobRequests[currRequestPos].name +
                          ' ' +
                          jobRequests[currRequestPos].surName}
                      </Text>
                      <Text
                        style={{
                          color: white,
                          fontSize: 14,
                          marginLeft: 10,
                          textAlignVertical: 'center',
                        }}>
                        {jobRequests[currRequestPos].service_name}
                      </Text>
                      <Text
                        style={{
                          color: white,
                          fontSize: 14,
                          marginLeft: 10,
                          textAlignVertical: 'center',
                          fontWeight: 'bold',
                        }}>
                        {jobRequests[currRequestPos].status == 'Pending'
                          ? 'Chat request accepted'
                          : 'Job accepted'}
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
                          this.props.navigation.navigate('Chat', {
                            providerId: jobRequests[currRequestPos].employee_id,
                            providerName: jobRequests[currRequestPos].name,
                            providerSurname:
                              jobRequests[currRequestPos].surName,
                            providerImage: jobRequests[currRequestPos].image,
                            serviceName:
                              jobRequests[currRequestPos].service_name,
                            OrderId: jobRequests[currRequestPos].order_id,
                            fcmId: jobRequests[currRequestPos].fcm_id,
                            titlePage: 'MapDirection',
                            currentPosition: currRequestPos,
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
                      <Text style={[styles.text, {color: colorGreen}]}>
                        Completed
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.openCancelConfirmation}>
                    <Text style={[styles.text, {color: themeRed}]}>
                      {this.state.isJobAccepted
                        ? 'Cancel Job'
                        : 'Reject Request'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
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
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
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
    margin: 0,
    backgroundColor: colorBg,
    justifyContent: 'center',
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
  text: {
    fontSize: 16,
    textAlign: 'center',
    justifyContent: 'center',
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapDirectionScreen);
