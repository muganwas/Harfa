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
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-community/async-storage';
import {cloneDeep} from 'lodash';
import {DrawerActions} from 'react-navigation-drawer';
import {NavigationEvents} from 'react-navigation';
import {exitApp} from 'react-native-exit-app';
import database from '@react-native-firebase/database';
import geolocation from '@react-native-community/geolocation';
import Geolocation from 'react-native-geolocation-service';
import messaging from '@react-native-firebase/messaging';
import {Notifications} from 'react-native-notifications';
import Axios from 'axios';
import SimpleToast from 'react-native-simple-toast';
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
import {fetchedJobProviderInfo} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import _ from 'lodash';
import {black, white, red} from '../../Constants/colors';

const socket = Config.socket;
const Android = Platform.OS === 'android';
const FETCH_MESSAGES = Config.baseURL + 'chat/fetchChats';
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
    if (![id].includes(notifications)) {
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
      dbMessagesFetched,
      fetchingMessagesError,
      updateLiveChatUsers,
      userInfo: {providerDetails},
    } = this.props;
    const receiverId = providerDetails.providerId;
    await this.fetchOthersLocations();
    await this.checkForUserType();
    messaging().onMessage(async message => {
      const data = JSON.parse(message.data.data);
      const {
        notificationsInfo,
        navigation,
        jobsInfo: {jobRequestsProviders},
        dispatchFetchedProJobRequests,
      } = this.props;
      const {title, body, main_id} = data;
      notifications.push(main_id);
      const currentGenericCount = notificationsInfo.generic;
      this.setState({currentMessage: message});
      if (!_.isEqual(this.state.currentMessage, message)) {
        fetchedNotifications({type: 'generic', value: currentGenericCount + 1});
      }
      const orderId = data.order_id;
      let pos = 0;
      await jobRequestsProviders.map((obj, key) => {
        if (orderId === obj.order_Id) pos = key;
      });
      let newJobRequestsProviders = cloneDeep(jobRequestsProviders);
      if (title.toLowerCase() === 'message recieved') {
        this.displayNotification({title, body, id: main_id});
      } else if (title.toLowerCase() === 'booking request') {
        this.displayNotification({title, body, id: main_id});
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
        newJobRequestsProviders.splice(pos, 1);
        dispatchFetchedProJobRequests(newJobRequestsProviders);
        navigation.navigate('ProHome');
      }
    });
    try {
      await Axios.get(
        FETCH_MESSAGES + '?sender=' + receiverId + '&userType=employee',
      )
        .then(async results => {
          const {data} = results;
          let messages = {};
          let otherUsers = {};
          // get ids of other users this user has chatted with
          if (!data.message) {
            await data.map(msgObj => {
              const {sender, recipient} = msgObj;
              if (sender !== receiverId) otherUsers[sender] = sender;
              else if (recipient !== receiverId)
                otherUsers[recipient] = recipient;
            });
            // if any user, seperate the different groups of messages
            if (Object.keys(otherUsers).length > 0) {
              Object.keys(otherUsers).map(async otherUser => {
                const thisUsersMessages = [];
                await data.map(msgObj => {
                  const {sender, recipient} = msgObj;
                  if (otherUser === sender || otherUser === recipient)
                    thisUsersMessages.push(msgObj);
                });
                if (thisUsersMessages.length > 0)
                  messages[otherUser] = thisUsersMessages;
              });
            }
            dbMessagesFetched(messages);
          } else {
            SimpleToast.show('Something went wrong, please reload app');
          }
        })
        .catch(e => {
          console.log('mongo messages error', e);
          fetchingMessagesError(e.message);
        });
    } catch (e) {
      console.log('mongo messages error', e);
      fetchingMessagesError(e.message);
    }

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
      const {sender} = data;
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
        newMessages[sender].push(data);
        dbMessagesFetched(newMessages);
      }
    });
    socket.open();

    const userRef = database().ref(`liveLocation/${receiverId}`);
    this.permissionRequest(() => {
      /** get pros current position and upload it to db */
      geolocation.getCurrentPosition(
        info => {
          const {
            coords: {latitude, longitude},
          } = info;
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
      );

      /** look out for pros changing position */
      geolocation.watchPosition(
        info => {
          const {
            fetchingCoordinates,
            fetchedCoordinates,
            fetchCoordinatesError,
          } = this.props;
          const {
            coords: {latitude, longitude},
          } = info;
          fetchingCoordinates();
          userRef
            .update({
              latitude,
              longitude,
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

  checkForUserType = async () => {
    await AsyncStorage.getItem('userType').then(result => {
      if (!result) this.props.navigation.navigate('AfterSplash');
    });
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

  async componentDidUpdate() {
    const {
      jobsInfo: {jobRequestsProviders},
    } = this.props;
    if (jobRequestsProviders.length && !this.state.fetchedOthersLocations)
      await this.fetchOthersLocations();
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

  fetchOthersLocations = async () => {
    const {
      jobsInfo: {jobRequestsProviders},
      fetchingOthersCoordinates,
      fetchedOthersCoordinates,
      fetchOthersCoordinatesError,
    } = this.props;
    await jobRequestsProviders.map(async obj => {
      const {user_id} = obj;
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
          onDidFocus={async () => await this.checkForUserType()}
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
