import React from 'react';
import {connect} from 'react-redux';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import {DrawerActions} from 'react-navigation-drawer';
import {NavigationEvents} from 'react-navigation';
import database from '@react-native-firebase/database';
import Toast from 'react-native-simple-toast';
import {exitApp} from 'react-native-exit-app';
import NetInfo from '@react-native-community/netinfo';
import _ from 'lodash';
import Config from '../Config';
import geolocation from '@react-native-community/geolocation';
import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';
import rNES from 'react-native-encrypted-storage';
import {MAPS_API_KEY} from 'react-native-dotenv';
import {cloneDeep} from 'lodash';
import {Notifications} from 'react-native-notifications';
import Axios from 'axios';
import {imageExists} from '../../misc/helpers';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
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
import SimpleToast from 'react-native-simple-toast';

const socket = Config.socket;
const Android = Platform.OS === 'android';
const FETCH_MESSAGES = Config.baseURL + 'chat/fetchChats';
let notifications = [];
class Hamburger extends React.Component {
  constructor(props) {
    super();
    this.state = {
      employeesLocationsFetched: false,
      connectivityAvailable: false,
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
      dbMessagesFetched,
      fetchingMessagesError,
      fetchClientMessages,
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
      const {title, body, main_id} = data;
      const check = main_id + title;
      notifications.push(check);
      const {
        fetchedNotifications,
        updateActiveRequest,
        navigation,
        notificationsInfo,
        fetchedPendingJobInfo,
        getAllWorkRequestClient,
        jobsInfo: {jobRequests},
      } = this.props;
      const currentGenericCount = notificationsInfo.generic;
      this.setState({currentMessage: message});
      if (!_.isEqual(this.state.currentMessage, message)) {
        fetchedNotifications({
          type: 'generic',
          value: currentGenericCount + 1,
        });
      }
      let newJobRequests = cloneDeep(jobRequests);
      const orderId = data.orderId;
      let pos = 0;
      jobRequests.map((obj, key) => {
        if (orderId === obj.order_Id) pos = key;
      });

      if (title.toLowerCase() === 'message recieved') {
        //this.displayNotification({title, body, id: main_id});
      } else if (title.toLowerCase() === 'chat request rejected') {
        //this.displayNotification({title, body, id: main_id});
        newJobRequests.splice(pos, 1);
        fetchedPendingJobInfo(newJobRequests);
        this.showToast(
          'The service provider rejected your request. please try again later',
        );
        navigation.navigate('Home');
      } else if (title.toLowerCase() === 'job accepted') {
        //this.displayNotification({title, body, id: main_id});
        const providerData =
          typeof data.ProviderData === 'string'
            ? JSON.parse(data.ProviderData)
            : data.ProviderData;
        const pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: data.ProviderId,
          image: data.image,
          fcm_id: data.fcmId,
          name: data.name,
          surName: data.surname,
          mobile: data.mobile,
          description: data.description,
          employee_details: providerData,
          address: data.address,
          lat: data.lat,
          lang: data.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        };
        newJobRequests[pos] = pendingJobData;
        fetchedPendingJobInfo(newJobRequests);
        this.showToast('Your job has been accepted.');
        navigation.navigate('Home');
      } else if (title.toLowerCase() === 'job rejected') {
        //this.displayNotification({title, body, id: main_id});
        newJobRequests.splice(pos, 1);
        fetchedPendingJobInfo(newJobRequests);
        navigation.navigate('Home');
        this.showToast('Your job has been rejected. please try again later');
      } else if (title.toLowerCase() == 'job completed') {
        //this.displayNotification({title, body, id: main_id});
        newJobRequests.splice(pos, 1);
        fetchedPendingJobInfo(newJobRequests);
        this.showToast('Your job is complete..');
        navigation.navigate('Home');
      } else if (
        title.toLowerCase() === 'chat request accepted' &&
        pos != null
      ) {
        console.log('position', pos);
        //this.displayNotification({title, body, id: main_id});
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
        newJobRequests[pos] = pendingJobData;
        fetchedPendingJobInfo(newJobRequests);
        getAllWorkRequestClient(senderId);
        this.showToast('Chat request accepted');
        updateActiveRequest(false);
        navigation.navigate('Home');
      } else if (
        (title.toLowerCase() === 'No Response' ||
          title.toLowerCase() === 'cancelled') &&
        pos != null
      ) {
        //this.displayNotification({title, body, id: main_id});
        newJobRequests.splice(pos, 1);
        fetchedPendingJobInfo(newJobRequests);
        this.showToast(
          'The service provider has not responded. please try again later',
        );
        navigation.navigate('Home');
      }
    });
    await this.checkNoficationsAvailability();
    await this.checkForUserType();
    await fetchClientMessages(senderId);
    /** fetch users current position and upload it to db */
    this.permissionRequest(() => {
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
          const addressInfo = await this.returnCoordDetails({
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
          const addressInfo = await this.returnCoordDetails({
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

  returnCoordDetails = async ({lat = '', lng = ''}) => {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
    let msg = {};
    lat &&
      lng &&
      (await fetch(url)
        .then(resp => resp.json())
        .then(resp => {
          if (resp.status.toLowerCase() === 'ok')
            msg = {address: resp?.results[0]?.formatted_address, msg: 'ok'};
          else msg = {msg: 'error'};
        })
        .catch(e => {
          console.log('address error ', e);
          msg = {msg: 'error'};
        }));
    return msg;
  };

  componentDidUpdate() {
    const {
      jobsInfo: {jobRequests},
      generalInfo,
    } = this.props;
    //console.log('gen info', generalInfo)
    if (jobRequests && !this.state.employeesLocationsFetched)
      this.fetchEmployeeLocations();
  }

  componentWillUnmount() {
    const {
      userInfo: {userDetails},
    } = this.props;
    const senderId = userDetails.userId;

    database()
      .ref('adminChatting')
      .child(senderId)
      .off('child_added');
    database()
      .ref('adminChatting')
      .child(senderId)
      .off('child_changed');
    database()
      .ref('chatting')
      .child(senderId)
      .off('child_changed');
  }

  checkForUserType = async () => {
    await rNES.getItem('userType').then(result => {
      if (!result) this.props.navigation.navigate('AfterSplash');
    });
  };

  checkNoficationsAvailability = async () => {
    if (Platform.OS === 'android') {
      try {
        const authStatus = await messaging().requestPermission();
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (enabled) {
            messaging()
              .getInitialNotification()
              .then(remoteMessage => {
                if (remoteMessage) {
                  console.log(
                    'Notification caused app to open from quit state:',
                    remoteMessage.notification,
                  );
                  //setInitialRoute(remoteMessage.data.type);
                }
              });
          } else {
            try {
              await messaging().requestPermission();
              console.log('FCM permission granted');
            } catch (error) {
              console.log('FCM Permission Error', error);
            }
          }
        } else {
          console.log('FCM Token not available');
        }
      } catch (e) {
        console.log('Error initializing FCM', e);
      }
    }
  };

  permissionRequest = async (action = () => {}) => {
    try {
      if (Platform.OS == 'ios') Geolocation.requestAuthorization();
      else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          action();
        } else {
          SimpleToast('You have denied location permission');
          exitApp();
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

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
        .on('child_changed', () => {
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
    Toast.show(message, Toast.SHORT);
  };

  render() {
    const {text, navigation, notificationsInfo} = this.props;
    const notificationTotal =
      notificationsInfo.messages +
      notificationsInfo.generic +
      notificationsInfo.adminMessages;
    return (
      <>
        <NavigationEvents onDidFocus={() => this.checkForUserType()} />
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
