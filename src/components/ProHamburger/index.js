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
import NetInfo from '@react-native-community/netinfo';
import {cloneDeep} from 'lodash';
import {DrawerActions} from 'react-navigation-drawer';
import {NavigationEvents} from 'react-navigation';
import database from '@react-native-firebase/database';
import geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import {Notifications} from 'react-native-notifications';
import SimpleToast from 'react-native-simple-toast';
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
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import {
  updatingCoordinates,
  updateCoordinates,
  updateCoordinatesError,
  updateOthersCoordinates,
  updatingOthersCoordinates,
  updateOthersCoordinatesError,
  updateConnectivityStatus,
  updateOnlineStatus,
  updateLiveChatUsers,
} from '../../Redux/Actions/generalActions';
import {
  fetchedJobProviderInfo,
  getPendingJobRequestProvider,
  getAllWorkRequestPro,
  updateCompletedBookingData,
  updateFailedBookingData,
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import _ from 'lodash';
import {black, white, red} from '../../Constants/colors';
import {
  locationPermissionRequest,
  returnCoordDetails,
  checkNoficationsAvailability,
} from '../../misc/helpers';
import {getAllNotifications} from '../../controllers/notifications';
import {getAllBookings} from '../../controllers/bookings';
import {checkForUserType} from '../../controllers/users';

const socket = Config.socket;
const NOTIFICATION_URL =
  Config.baseURL + 'notification/get-employee-notification/';
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
const Android = Platform.OS === 'android';
let notifications = [];

class ProHamburger extends React.Component {
  constructor() {
    super();
    this.state = {
      fetchedOthersLocations: false,
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
      fetchEmployeeMessages,
      updateLiveChatUsers,
      userInfo: {providerDetails},
      navigation,
    } = this.props;
    const receiverId = providerDetails.providerId;
    messaging().setBackgroundMessageHandler(message => {
      if (message && message.data) {
        const data = JSON.parse(message.data.data);
        if (data && data.title && data.body)
          this.displayNotification({title: data.title, body: data.body});
      }
    });
    messaging().onMessage(async message => {
      const data = JSON.parse(message.data.data);
      const {
        notificationsInfo,
        jobsInfo: {jobRequestsProviders},
        dispatchFetchedProJobRequests,
        getAllWorkRequestPro,
        getPendingJobRequests,
      } = this.props;
      const {title, main_id} = data;
      const check = main_id + title;
      notifications.push(check);
      const currentGenericCount = notificationsInfo.generic;
      this.setState({currentMessage: message});
      if (!_.isEqual(this.state.currentMessage, message)) {
        fetchedNotifications({type: 'generic', value: currentGenericCount + 1});
      }
      const orderId = data.order_id;
      let pos;
      await jobRequestsProviders.map((obj, key) => {
        if (orderId === obj.order_id) pos = key;
      });
      let newJobRequestsProviders = cloneDeep(jobRequestsProviders);
      this.getAllNotificationsProvider();
      if (title.toLowerCase() === 'booking request') {
        navigation.navigate('ProChatAccept', {
          userId: data.userId,
          serviceName: data.serviceName,
          mainId: data.main_id,
          orderId: data.order_id,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        });
      } else if (
        title.toLowerCase() === 'job cancelled' ||
        title.toLowerCase() === 'job completed'
      ) {
        SimpleToast.show(
          title.toLowerCase() === 'job cancelled'
            ? 'Job was cancelled by client'
            : 'Job was completed by client',
        );
        if (pos !== undefined) {
          newJobRequestsProviders.splice(pos, 1);
          dispatchFetchedProJobRequests(newJobRequestsProviders);
          navigation.navigate('ProHome');
        } else getPendingJobRequests(this.props, receiverId, 'ProHome');
        getAllWorkRequestPro(receiverId);
        this.getAllBookingsProvider();
      }
    });
    await this.fetchOthersLocations();
    await checkNoficationsAvailability();
    await checkForUserType(navigation.navigate);
    await fetchEmployeeMessages(receiverId);
    database()
      .ref('adminChatting')
      .child(receiverId)
      .on('child_changed', result => {
        const {notificationsInfo} = this.props;
        const adminMessageCount = notificationsInfo.adminMessages;
        fetchedNotifications({
          type: 'adminMessages',
          value: adminMessageCount + 1,
        });
      });
    const {updateConnectivityStatus, updateOnlineStatus} = this.props;

    NetInfo.addEventListener(state => {
      updateConnectivityStatus(state.isConnected);
    });
    NetInfo.fetch().then(state => {
      updateConnectivityStatus(state.isConnected);
    });

    socket.on('connect', () => {
      const userId = providerDetails.providerId;
      if (userId) {
        socket.emit('authentication', {
          id: userId,
          userType: 'employee',
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
      console.log('someone disconnected');
      updateLiveChatUsers(users);
    });
    socket.on('user-joined', users => {
      console.log('someone connected');
      updateLiveChatUsers(users);
    });
    socket.on('disconnect', info => {
      const {
        generalInfo: {connectivityAvailable},
      } = this.props;
      console.log('you disconnected');
      // console.log(info);
      updateLiveChatUsers({});
      updateOnlineStatus(false);
      if (connectivityAvailable) {
        console.log('reconnecting...');
        socket.close();
        socket.open();
      }
    });
    socket.on('chat-message', data => {
      const {sender} = cloneDeep(data);
      const {notificationsInfo, messagesInfo, dbMessagesFetched} = this.props;
      let newMessages = cloneDeep(messagesInfo.messages);
      const currentMessagesCount = notificationsInfo.messages;
      let prevMessages = newMessages[sender]
        ? cloneDeep(newMessages[sender])
        : [];
      let prevMessage = prevMessages.pop();
      if (JSON.stringify(prevMessage) === JSON.stringify(data))
        console.log('repeated message');
      else {
        const newMessagesCount = currentMessagesCount + 1;
        fetchedNotifications({type: 'messages', value: newMessagesCount});
        newMessages[sender]
          ? newMessages[sender].push(data)
          : (newMessages[sender] = [data]);
        dbMessagesFetched(newMessages);
      }
    });
    socket.open();
    const userRef = database().ref(`liveLocation/${receiverId}`);
    locationPermissionRequest(() => {
      /** get pros current position and upload it to db */
      geolocation.getCurrentPosition(
        async info => {
          const {
            coords: {latitude, longitude},
          } = info;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          const {
            fetchingCoordinates,
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          fetchingCoordinates();
          userRef
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

      /** look out for pros changing position */
      geolocation.watchPosition(
        async info => {
          const {
            fetchingCoordinates,
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const {
            coords: {latitude, longitude},
          } = info;
          const addressInfo = await returnCoordDetails({
            lat: latitude.toString(),
            lng: longitude.toString(),
          });
          fetchingCoordinates();
          userRef
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
    });
  }

  componentWillUnmount() {
    const {
      userInfo: {providerDetails},
    } = this.props;
    const senderId = providerDetails.providerId;
    database()
      .ref('adminChatting')
      .child(senderId)
      .off('child_added');
    database()
      .ref('adminChatting')
      .child(senderId)
      .off('child_changed');
  }

  getAllNotificationsProvider = () =>
    getAllNotifications({
      userId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Provider',
      toggleIsLoading: () => {},
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
      onError: () => {
        /** Do something on error */
      },
      notificationsURL: NOTIFICATION_URL,
    });

  getAllBookingsProvider = () =>
    getAllBookings({
      userId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Provider',
      bookingHistoryURL: BOOKING_HISTORY,
      toggleIsLoading: () => {},
      onSuccess: (bookingCompleteData, bookingRejectData) => {
        this.props.updateCompletedBookingData(bookingCompleteData);
        this.props.updateFailedBookingData(bookingRejectData);
      },
    });

  fetchOthersLocations = async () => {
    const {
      jobsInfo: {allJobRequestsProviders},
      fetchingOthersCoordinates,
      fetchedOthersCoordinates,
      fetchOthersCoordinatesError,
    } = this.props;
    await allJobRequestsProviders.map(async obj => {
      const {user_id} = obj;
      /**fetch users current position */
      database()
        .ref(`liveLocation/${user_id}`)
        .once('value', result => {
          const {
            generalInfo: {othersCoordinates},
          } = this.props;
          let newOthersCoordinates = Object.assign({}, othersCoordinates);
          newOthersCoordinates[user_id] = result.val();
          fetchedOthersCoordinates(newOthersCoordinates);
        })
        .catch(e => {
          fetchOthersCoordinatesError(e.message);
        });
      /** lookout for users changed position */
      database()
        .ref(`liveLocation/${user_id}`)
        .on('child_changed', () => {
          fetchingOthersCoordinates();
          const {
            generalInfo: {othersCoordinates},
          } = this.props;
          let newOthersCoordinates = Object.assign({}, othersCoordinates);
          database()
            .ref(`liveLocation/${user_id}`)
            .once('value', result => {
              newOthersCoordinates[user_id] = result.val();
              fetchedOthersCoordinates(newOthersCoordinates);
            })
            .catch(e => {
              fetchOthersCoordinatesError(e.message);
            });
        });
    });
    this.setState({fetchedOthersLocations: true});
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
          onDidFocus={async () => await checkForUserType(navigation.navigate)}
        />
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
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
    generalInfo: state.generalInfo,
    messagesInfo: state.messagesInfo,
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
    dispatchFetchedProJobRequests: jobs => {
      dispatch(fetchedJobProviderInfo(jobs));
    },
    updateOnlineStatus: status => {
      dispatch(updateOnlineStatus(status));
    },
    updateConnectivityStatus: status => {
      dispatch(updateConnectivityStatus(status));
    },
    updateLiveChatUsers: val => {
      dispatch(updateLiveChatUsers(val));
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchEmployeeMessages: eId => {
      dispatch(fetchEmployeeMessages({receiverId: eId}));
    },
    getAllWorkRequestPro: proId => {
      dispatch(getAllWorkRequestPro(proId));
    },
    getPendingJobRequests: (props, providerId, navTo) => {
      dispatch(getPendingJobRequestProvider(props, providerId, navTo));
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProHamburger);

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
    color: white,
    right: 15,
    height: 20,
    width: 20,
    backgroundColor: red,
    top: 5,
  },
  textView: {
    display: 'flex',
    flexDirection: 'column',
    textAlignVertical: 'center',
    marginTop: !Android ? 13 : 0,
  },
  image: {width: 25, height: 25},
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: black,
    textAlignVertical: 'center',
    flex: 1,
  },
});
