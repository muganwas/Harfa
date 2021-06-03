import React from 'react';
import {connect} from 'react-redux';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import {DrawerActions} from 'react-navigation-drawer';
import {NavigationEvents} from 'react-navigation';
import database from '@react-native-firebase/database';
import SimpleToast from 'react-native-simple-toast';
import NetInfo from '@react-native-community/netinfo';
import _ from 'lodash';
import Config from '../Config';
import geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import {cloneDeep} from 'lodash';
import {Notifications} from 'react-native-notifications';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
  updateNotifications,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingMessages,
  messagesFetched,
  messagesError,
  dbMessagesFetched,
  fetchClientMessages,
} from '../../Redux/Actions/messageActions';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  getAllWorkRequestClient,
  fetchCustomerJobInfoError,
  setSelectedJobRequest,
  updateActiveRequest,
  updateCompletedBookingData,
  updateFailedBookingData,
  getPendingJobRequestProvider,
} from '../../Redux/Actions/jobsActions';
import {
  updatingCoordinates,
  updateCoordinates,
  updateCoordinatesError,
  updateOthersCoordinates,
  updatingOthersCoordinates,
  updateOthersCoordinatesError,
  updateOnlineStatus,
  updateConnectivityStatus,
  updateLiveChatUsers,
} from '../../Redux/Actions/generalActions';
import {
  locationPermissionRequest,
  returnCoordDetails,
  imageExists,
  checkNoficationsAvailability,
} from '../../misc/helpers';
import {checkForUserType} from '../../controllers/users';
import {deregisterOnlineStatusListener} from '../../controllers/chats';
import {getAllNotifications} from '../../controllers/notifications';
import {getAllBookings} from '../../controllers/bookings';

const socket = Config.socket;
const NOTIFICATION_URL =
  Config.baseURL + 'notification/get-customer-notification/';
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/customer_request/';
const Android = Platform.OS === 'android';
let notifications = [];
class Hamburger extends React.Component {
  constructor() {
    super();
    this.state = {
      employeesLocationsFetched: false,
      prevConnectivityStatus: false,
      availabilityChecked: false,
      availabilityObj: {},
      currentMessage: null,
      notificationId: null,
    };
    Notifications.registerRemoteNotifications();
  }

  displayNotification = ({title, body, id}) => {
    const check = id + title;
    if (![check].includes(notifications)) {
      this.setState({notificationId: id});
      Android
        ? Notifications.postLocalNotification({
            title,
            body,
            extra: 'data',
          })
        : Notifications.postLocalNotification({
            body,
            title,
            sound: 'chime.aiff',
            silent: false,
            category: 'SOME_CATEGORY',
            userInfo: {},
          });
    }
  };

  async componentDidMount() {
    const {
      fetchedNotifications,
      updateLiveChatUsers,
      userInfo: {userDetails},
      fetchClientMessages,
      getPendingJobRequestProvider,
      navigation,
    } = this.props;
    const senderId = userDetails.userId;
    const locationRef = database().ref(`liveLocation/${senderId}`);
    messaging().setBackgroundMessageHandler(message => {
      if (message && message.data) {
        const data = JSON.parse(message.data.data);
        if (data && data.title && data.body)
          this.displayNotification({title: data.title, body: data.body});
      }
    });
    messaging().onMessage(async message => {
      const data = JSON.parse(message.data.data);
      const {title, main_id, orderId} = data;
      const check = main_id + title;
      notifications.push(check);
      const {
        fetchedNotifications,
        updateActiveRequest,
        notificationsInfo,
        fetchedPendingJobInfo,
        getAllWorkRequestClient,
        jobsInfo: {jobRequests},
      } = this.props;
      const {currentMessage} = this.state;
      const currentGenericCount = notificationsInfo.generic;
      this.setState({currentMessage: message});
      if (!_.isEqual(currentMessage, message)) {
        title !== 'Message Recieved' &&
          fetchedNotifications({
            type: 'generic',
            value: currentGenericCount + 1,
          });
      }
      let newJobRequests = cloneDeep(jobRequests);
      let pos;
      await jobRequests.map((obj, i) => {
        if (orderId === obj.order_id) pos = i;
      });
      title !== 'Message Recieved' && this.getAllNotificationsCustomer();
      if (title.toLowerCase() === 'chat request rejected') {
        if (pos !== undefined) {
          newJobRequests.splice(pos, 1);
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        getAllWorkRequestClient(senderId);
        this.showToast(
          'The service provider rejected your request. please try again later',
        );
      } else if (title.toLowerCase() === 'job accepted') {
        const providerData =
          typeof data.ProviderData === 'string'
            ? JSON.parse(data.ProviderData)
            : data.ProviderData;
        const pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: providerData.ProviderId,
          image: providerData.imageSource,
          fcm_id: providerData.fcmId,
          name: providerData.name,
          surName: providerData.surname,
          mobile: providerData.mobile,
          description: providerData.description,
          employee_details: providerData,
          address: providerData.address,
          lat: providerData.lat,
          lang: providerData.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        };
        imageExists(providerData.imageSource).then(res => {
          pendingJobData.imageAvailable = res;
        });
        if (pos !== undefined) {
          newJobRequests[pos] = pendingJobData;
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        getAllWorkRequestClient(senderId);
        this.getAllBookingsCustomer();
        this.showToast('Your job has been accepted.');
      } else if (title.toLowerCase() === 'job rejected') {
        if (pos !== undefined) {
          newJobRequests.splice(pos, 1);
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        this.getAllBookingsCustomer();
        this.showToast('Your job has been rejected. please try again later');
      } else if (title.toLowerCase() === 'job completed') {
        if (pos !== undefined) {
          newJobRequests.splice(pos, 1);
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        getAllWorkRequestClient(senderId);
        this.getAllBookingsCustomer();
        this.showToast('Your job is complete..');
      } else if (title.toLowerCase() === 'chat request accepted') {
        const providerData =
          typeof data.ProviderData === 'string'
            ? JSON.parse(data.ProviderData)
            : data.ProviderData;
        const pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: providerData.ProviderId,
          image: providerData.imageSource,
          fcm_id: providerData.fcmId,
          name: providerData.name,
          surName: providerData.surname,
          mobile: providerData.mobile,
          description: providerData.description,
          address: providerData.address,
          lat: providerData.lat,
          lang: providerData.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          employee_details: providerData,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        };
        imageExists(providerData.imageSource).then(res => {
          pendingJobData.imageAvailable = res;
        });
        if (pos !== undefined) {
          newJobRequests[pos] = pendingJobData;
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        getAllWorkRequestClient(senderId);
        this.showToast('Chat request accepted');
        updateActiveRequest(false);
      } else if (
        title.toLowerCase() === 'No Response' ||
        title.toLowerCase() === 'cancelled' ||
        title.toLowerCase() === 'job cancelled'
      ) {
        if (pos !== undefined) {
          newJobRequests.splice(pos, 1);
          fetchedPendingJobInfo(newJobRequests);
          navigation.navigate('Home');
        } else getPendingJobRequestProvider(this.props, senderId, 'Home');
        this.showToast(
          'The service provider is nolonger available. please try again later',
        );
      }
    });
    await checkNoficationsAvailability();
    await checkForUserType(navigation.navigate);
    await fetchClientMessages(senderId);
    /** fetch users current position and upload it to db */
    locationPermissionRequest(() => {
      geolocation.getCurrentPosition(
        async info => {
          const {
            coords: {latitude, longitude},
          } = info;
          const {
            fetchingCoordinates,
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          fetchingCoordinates();
          locationRef
            .update({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              fetchedCoordinates({
                latitude,
                longitude,
              });
            })
            .catch(e => {
              console.log(e.message);
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          console.log(error);
        },
        {
          enableHighAccuracy: true,
        },
      );

      /** lookout for users changing position start */
      geolocation.watchPosition(
        async info => {
          const {
            coords: {latitude, longitude},
          } = info;
          const {
            fetchingCoordinates,
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          fetchingCoordinates();
          locationRef
            .update({
              latitude,
              longitude,
              address: addressInfo.msg === 'ok' && addressInfo.address,
            })
            .then(() => {
              fetchedCoordinates({latitude, longitude});
            })
            .catch(e => {
              console.log(e.message);
              fetchCoordinatesError(e.message);
            });
        },
        error => {
          console.log(error);
        },
        {
          enableHighAccuracy: true,
        },
      );
      /** end lookout for pros changing position */
    });

    this.fetchEmployeeLocations();

    const {updateOnlineStatus, updateConnectivityStatus} = this.props;

    NetInfo.addEventListener(status => {
      if (status.isConnected && !this.state.prevConnectivityStatus) {
        setTimeout(() => {
          getAllWorkRequestClient(senderId);
          getPendingJobRequestProvider(this.props, senderId);
        }, 1000);
        this.setState({prevConnectivityStatus: status.isConnected});
      }
      if (!status.isConnected) {
        this.setState({prevConnectivityStatus: status.isConnected});
      }
      updateConnectivityStatus(status.isConnected);
    });

    NetInfo.fetch().then(status => {
      updateConnectivityStatus(status.isConnected);
    });

    socket.on('connect', () => {
      const userId = userDetails.userId;
      if (userId) {
        socket.emit('authentication', {
          id: userId,
          userType: 'client',
        });
      }
    });

    socket.on('authorized', response => {
      console.log(response.message);
      updateOnlineStatus(true);
    });

    socket.on('unauthorized', reason => {
      console.log('unauthorized --', reason);
      updateOnlineStatus(false);
    });

    socket.on('user-disconnected', users => {
      console.log('user disconnected..');
      updateLiveChatUsers(users);
    });
    socket.on('user-joined', users => {
      console.log('user joined..');
      updateLiveChatUsers(users);
    });
    socket.on('chat-message', data => {
      const {sender} = cloneDeep(data);
      const {notificationsInfo, messagesInfo, dbMessagesFetched} = this.props;
      let newMessages = cloneDeep(messagesInfo.messages);
      let currentMessagesCount = notificationsInfo.messages;
      let prevMessages = newMessages[sender]
        ? cloneDeep(newMessages[sender])
        : [];
      let prevMessage = prevMessages.pop();
      if (JSON.stringify(prevMessage) === JSON.stringify(data))
        console.log('repeated message');
      else {
        let newMessagesCount = currentMessagesCount + 1;
        fetchedNotifications({type: 'messages', value: newMessagesCount});
        newMessages[sender]
          ? newMessages[sender].push(data)
          : (newMessages[sender] = [data]);
        dbMessagesFetched(newMessages);
      }
    });
    socket.on('disconnect', info => {
      console.log('disconnection info --', info);
      updateLiveChatUsers({});
      const {
        generalInfo: {connectivityAvailable},
      } = this.props;
      updateOnlineStatus(false);
      if (connectivityAvailable) {
        console.log('reconnecting...');
        socket.close();
        socket.open();
      }
    });
    socket.open();
  }

  componentDidUpdate() {
    const {
      jobsInfo: {jobRequests},
    } = this.props;
    if (jobRequests && !this.state.employeesLocationsFetched)
      this.fetchEmployeeLocations();
  }

  componentWillUnmount() {
    const {
      userInfo: {userDetails},
    } = this.props;
    const senderId = userDetails.userId;
    deregisterOnlineStatusListener(senderId);
  }

  getAllNotificationsCustomer = () =>
    getAllNotifications({
      userId: this.props?.userInfo?.userDetails?.userId,
      userType: 'Customer',
      toggleIsLoading: () => {},
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
      onError: () => {
        /** Do something on error */
      },
      notificationsURL: NOTIFICATION_URL,
    });

  getAllBookingsCustomer = () =>
    getAllBookings({
      userId: this.props?.userInfo?.userDetails?.userId,
      userType: 'Customer',
      toggleIsLoading: () => {},
      bookingHistoryURL: BOOKING_HISTORY,
      onSuccess: (bookingCompleteData, bookingRejectData) => {
        this.props.updateCompletedBookingData(bookingCompleteData);
        this.props.updateFailedBookingData(bookingRejectData);
      },
    });

  fetchEmployeeLocations = () => {
    const {
      fetchingOthersCoordinates,
      fetchedOthersCoordinates,
      fetchOthersCoordinatesError,
      jobsInfo: {allJobRequestsClient},
    } = this.props;
    allJobRequestsClient.map(obj => {
      const {employee_id} = obj;
      database()
        .ref(`liveLocation/${employee_id}`)
        .once('value', result => {
          const {
            generalInfo: {othersCoordinates},
          } = this.props;
          let newOthersCoordinates = Object.assign({}, othersCoordinates);
          const loc = result.val();
          newOthersCoordinates[employee_id] = loc;
          fetchedOthersCoordinates(newOthersCoordinates);
        })
        .catch(e => {
          fetchOthersCoordinatesError(e.message);
        });

      database()
        .ref(`liveLocation/${employee_id}`)
        .on('child_changed', result => {
          const {
            generalInfo: {othersCoordinates},
          } = this.props;
          let newOthersCoordinates = Object.assign({}, othersCoordinates);
          fetchingOthersCoordinates();
          database()
            .ref(`liveLocation/${employee_id}`)
            .once('value', result => {
              newOthersCoordinates[employee_id] = result.val();
              fetchedOthersCoordinates(newOthersCoordinates);
            })
            .catch(e => {
              fetchOthersCoordinatesError(e.message);
            });
        });
    });
    this.setState({employeesLocationsFetched: true});
  };

  showToast = message => {
    SimpleToast.show(message, SimpleToast.SHORT);
  };

  render() {
    const {text, navigation, notificationsInfo} = this.props;
    const notificationTotal =
      notificationsInfo.messages +
      notificationsInfo.generic +
      notificationsInfo.adminMessages;
    return (
      <>
        <NavigationEvents
          onDidFocus={() => checkForUserType(navigation.navigate)}
        />
        <TouchableOpacity
          onPress={
            navigation
              ? () => navigation.dispatch(DrawerActions.openDrawer())
              : () => {}
          }
          style={styles.touchableHighlight}>
          <Image
            style={styles.image}
            source={require('../../icons/humberger.png')}
          />
          {notificationTotal > 0 ? (
            <Text style={styles.noticationsCount}>{notificationTotal}</Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.textView}>
          <Text style={styles.titleText}>{text}</Text>
        </View>
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    messagesInfo: state.messagesInfo,
    generalInfo: state.generalInfo,
    jobsInfo: state.jobsInfo,
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
    fetchMessages: () => {
      dispatch(startFetchingMessages());
    },
    fetchedMessages: data => {
      dispatch(messagesFetched(data));
    },
    fetchingMessagesError: error => {
      dispatch(messagesError(error));
    },
    fetchingCoordinates: () => {
      dispatch(updatingCoordinates());
    },
    fetchedCoordinates: data => {
      dispatch(updateCoordinates(data));
    },
    fetchCoordinatesError: error => {
      dispatch(updateCoordinatesError(error));
    },
    fetchingOthersCoordinates: () => {
      dispatch(updatingOthersCoordinates());
    },
    fetchedOthersCoordinates: data => {
      dispatch(updateOthersCoordinates(data));
    },
    fetchOthersCoordinatesError: error => {
      dispatch(updateOthersCoordinatesError(error));
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
    updateOnlineStatus: val => {
      dispatch(updateOnlineStatus(val));
    },
    updateConnectivityStatus: val => {
      dispatch(updateConnectivityStatus(val));
    },
    updateLiveChatUsers: val => {
      dispatch(updateLiveChatUsers(val));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    getAllWorkRequestClient: userId => {
      dispatch(getAllWorkRequestClient(userId));
    },
    fetchClientMessages: (senderId, callBack) => {
      dispatch(fetchClientMessages({senderId, callBack}));
    },
    updateNotifications: data => {
      dispatch(updateNotifications(data));
    },
    updateCompletedBookingData: data => {
      dispatch(updateCompletedBookingData(data));
    },
    updateFailedBookingData: data => {
      dispatch(updateFailedBookingData(data));
    },
    getPendingJobRequestProvider: (props, proId, navTo) => {
      dispatch(getPendingJobRequestProvider(props, proId, navTo));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Hamburger);

const styles = StyleSheet.create({
  touchableHighlight: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  noticationsCount: {
    position: 'absolute',
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 10,
    color: 'white',
    right: 15,
    height: 20,
    width: 20,
    backgroundColor: 'red',
    top: 5,
  },
  textView: {
    display: 'flex',
    flexDirection: 'column',
    textAlignVertical: 'center',
    marginTop: !Android ? 13 : 0,
  },
  image: {
    width: 25,
    height: 25,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlignVertical: 'center',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
