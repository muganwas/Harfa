import React from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../Redux/Actions/messageActions';
import {
    updatingCoordinates,
    updateCoordinates,
    updateCoordinatesError,
    updateOthersCoordinates,
    updatingOthersCoordinates,
    updateOthersCoordinatesError,
    updateConnectivityStatus,
    updateOnlineStatus
} from '../Redux/Actions/generalActions';
import { DrawerActions } from 'react-navigation-drawer';
import geolocation from '@react-native-community/geolocation';
import firebase from 'react-native-firebase';
import ProviderDetails from './ProviderDetails';
import Toast from 'react-native-simple-toast';
import { Notifications } from 'react-native-notifications';
import { fetchedJobProviderInfo } from '../Redux/Actions/jobsActions';
import Config from './Config';
import OnlineUsers from './OnlineUsers';
import NetInfo from "@react-native-community/netinfo";

const socket = Config.socket;


const Android = Platform.OS === 'android';

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
        top: 5
    },
    textView: {
        display: 'flex',
        flexDirection: 'column',
        textAlignVertical: 'center',
        marginTop: !Android ? 13 : 0
    },
    image: { width: 25, height: 25 },
    titleText: { fontSize: 20, fontWeight: 'bold', color: 'black', textAlignVertical: 'center', flex: 1 }
})
class Hamburger extends React.Component {

    state = {
        fetchedOthersLocations: false
    }

    componentDidMount() {
        const { jobsInfo: { allJobRequestsProviders }, fetchedMessages, fetchedNotifications, fetchingOthersCoordinates, fetchedOthersCoordinates, fetchOthersCoordinatesError } = this.props;
        const receiverId = ProviderDetails.Provider.providerId;
        this.fetchOthersLocations();
        allJobRequestsProviders.map(obj => {
            const { user_id } = obj;
            firebase.database().ref('chatting').child(receiverId).child(user_id)
                .on('child_added', data => {
                    const { messagesInfo: { dataChatSource } } = this.props;
                    let newDataChatSource = Object.assign({}, dataChatSource);
                    let newArr = newDataChatSource[user_id] ? [...newDataChatSource[user_id]] : [];
                    newArr.push(data.val());
                    const newData = [...newArr];
                    //filter out only unique messages
                    const uniqueData = Array.from(new Set(newData.map(a => a.time)))
                        .map(time => {
                            return newData.find(a => a.time === time)
                        });
                    newDataChatSource[user_id] = uniqueData;
                    fetchedMessages(newDataChatSource);
                });

            firebase.database().ref("chatting").child(receiverId).child(user_id)
                .once('value', data => {
                    const { messagesInfo: { dataChatSource } } = this.props;
                    let newDataChatSource = Object.assign({}, dataChatSource);
                    const newArr = newDataChatSource[user_id] ? [...newDataChatSource[user_id]] : [];
                    newArr.push(data.val())
                    const newData = [...newArr];
                    //filter out only unique messages
                    const uniqueData = Array.from(new Set(newData.map(a => a.time)))
                        .map(time => {
                            return newData.find(a => a.time === time)
                        });
                    newDataChatSource[user_id] = uniqueData;
                    fetchedMessages(newDataChatSource);
                });
        });
        const userRef = firebase.database().ref(`liveLocation/${receiverId}`);
        /** get pros current position and upload it to db */
        geolocation.getCurrentPosition(info => {
            const { coords: { latitude, longitude } } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchingCoordinates();
            userRef.update({ latitude, longitude }).then(() => {
                fetchedCoordinates({ latitude, longitude });
            }).
                catch(e => {
                    console.log(e.message);
                    fetchCoordinatesError(e.message);
                });
        }, error => {
            console.log(error)
        });

        /** look out for pros changing position */
        geolocation.watchPosition(info => {
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            const { coords: { latitude, longitude } } = info;
            fetchingCoordinates();
            userRef.update({ latitude, longitude }).then(() => {
                fetchedCoordinates({ latitude, longitude });
            }).
                catch(e => {
                    console.log(e.message);
                    fetchCoordinatesError(e.message);
                })
        }, error => {
            console.log(error)
        }, { enableHighAccuracy: true });

        firebase.notifications().onNotification(notification => {
            const { notificationsInfo, navigation, jobsInfo: { jobRequestsProviders }, dispatchFetchedProJobRequests } = this.props;
            const { title, body, data } = notification;

            const orderId = data.orderId;
            let pos = 0;

            jobRequestsProviders.map((obj, key) => {
                const currOrderId = obj.order_Id;
                if (orderId === currOrderId) pos = key;
            });

            let newJobRequestsProviders = [...jobRequestsProviders]
            if (title == "Booking Request") {
                navigation.navigate("ProChatAccept", {
                    'userId': data.userId,
                    'serviceName': data.serviceName,
                    'mainId': data.main_id,
                    'orderId': data.order_id,
                    'delivery_address': data.delivery_address,
                    'delivery_lat': data.delivery_lat,
                    'delivery_lang': data.delivery_lang,
                });
                const currentGenericCount = notificationsInfo.generic;
                const newGenericCount = currentGenericCount + 1;
                fetchedNotifications({ type: 'generic', value: newGenericCount });
            }
            else if (title.toLowerCase() == "job canceled") {
                Toast.show(title + ' has been canceled by client');
                newJobRequestsProviders.splice(pos, 1);
                dispatchFetchedProJobRequests(newJobRequestsProviders);
            }
        });

        firebase.database().ref('chatting').child(receiverId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
            const currentMessagesCount = notificationsInfo.messages;
            const newMessagesCount = currentMessagesCount + 1;
            //console.log(currentCount)
            fetchedNotifications({ type: 'messages', value: newMessagesCount });
            Android ? Notifications.postLocalNotification({
                title: "Harfa Messages",
                body: "You have a new message!",
                extra: "data"
            }) :
                Notifications.postLocalNotification({
                    body: "You have a new Message",
                    title: "Harfa Messages",
                    sound: "chime.aiff",
                    silent: false,
                    category: "SOME_CATEGORY",
                    userInfo: {}
                });
        });

        firebase.database().ref('adminChatting').child(receiverId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
            const adminMessageCount = notificationsInfo.adminMessages;
            Android ? Notifications.postLocalNotification({
                title: "Harfa Messages",
                body: "You have a new message!",
                extra: "data"
            }) :
                Notifications.postLocalNotification({
                    body: "You have a new Message",
                    title: "Harfa Messages",
                    sound: "chime.aiff",
                    silent: false,
                    category: "SOME_CATEGORY",
                    userInfo: {}
                });
            fetchedNotifications({ type: 'adminMessages', value: adminMessageCount + 1 });
        });
        const { updateConnectivityStatus, updateOnlineStatus } = this.props;

        NetInfo.addEventListener(state => {
            console.log('connctivity change', state.isConnected)
            updateConnectivityStatus(state.isConnected);
        });
        NetInfo.fetch().then(state => {
            updateConnectivityStatus(state.isConnected);
        });

        socket.on('connect', () => {
            const userId = ProviderDetails.Provider.providerId;
            if (userId) {
                socket.emit('connected', userId);
                updateOnlineStatus(true)
            }
            console.log('connected');
        });
        socket.on('user-disconnected', users => {
            console.log('someone disconnected')
            OnlineUsers.Users = users;
        })
        socket.on('user-joined', users => {
            console.log('someone connected')
            OnlineUsers.Users = users;
        })
        socket.on('disconnect', info => {
            const { generalInfo: { online, connectivityAvailable } } = this.props;
            console.log('you disconnected')
            // console.log(info);
            updateOnlineStatus(false)
            if (!online && connectivityAvailable) socket.open();
        })
        socket.open();
    }

    componentDidUpdate() {
        const { jobsInfo: { allJobRequestsProviders, jobRequestsProviders } } = this.props;
        if (jobRequestsProviders.length && !this.state.fetchedOthersLocations)
            this.fetchOthersLocations();
    }

    componentWillUnmount() {
        const senderId = ProviderDetails.Provider.providerId;
        //const receiverId = ProviderDetails.Provider.providerId;
        firebase.database().ref('adminChatting').child(senderId).off('child_changed')
        firebase.database().ref('chatting').child(senderId).off('child_changed');
    }

    fetchOthersLocations = () => {
        const { jobsInfo: { jobRequestsProviders }, fetchingOthersCoordinates, fetchedOthersCoordinates, fetchOthersCoordinatesError } = this.props;
        jobRequestsProviders.map(obj => {
            const { user_id } = obj;
            /** lookout for users changed position */
            firebase.database().ref(`liveLocation/${user_id}`).on('child_changed', () => {
                fetchingOthersCoordinates();
                const { generalInfo: { othersCoordinates } } = this.props;
                let newOthersCoordinates = Object.assign({}, othersCoordinates);
                firebase.database().ref(`liveLocation/${user_id}`).once('value', result => {
                    newOthersCoordinates[user_id] = result.val();
                    fetchedOthersCoordinates(newOthersCoordinates);
                }).
                    catch(e => {
                        fetchOthersCoordinatesError(e.message);
                    });
            });

            /**fetch users current position */
            firebase.database().ref(`liveLocation/${user_id}`).once('value', result => {
                const { generalInfo: { othersCoordinates } } = this.props;
                let newOthersCoordinates = Object.assign({}, othersCoordinates);
                newOthersCoordinates[user_id] = result.val();
                fetchedOthersCoordinates(newOthersCoordinates);
            }).
                catch(e => {
                    fetchOthersCoordinatesError(e.message);
                });
        });
        this.setState({ fetchedOthersLocations: true })
    }

    render() {
        const {
            text,
            navigation,
            notificationsInfo
        } = this.props;
        const notificationTotal = notificationsInfo.messages + notificationsInfo.generic + notificationsInfo.adminMessages;
        return (
            <>
                <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.touchableHighlight}>
                    <Image style={styles.image}
                        source={require('../icons/humberger.png')} />
                    {notificationTotal > 0 ? <Text style={styles.noticationsCount}>{notificationTotal}</Text> : null}
                </TouchableOpacity>

                <View style={styles.textView}>
                    <Text style={styles.titleText}>
                        {text}
                    </Text>
                </View>
            </>
        )
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        generalInfo: state.generalInfo,
        messagesInfo: state.messagesInfo,
        jobsInfo: state.jobsInfo,
    }
}

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
            dispatch(updatingCoordinates())
        },
        fetchedCoordinates: data => {
            dispatch(updateCoordinates(data))
        },
        fetchCoordinatesError: error => {
            dispatch(updateCoordinatesError(error))
        },
        fetchingOthersCoordinates: () => {
            dispatch(updatingOthersCoordinates())
        },
        fetchedOthersCoordinates: data => {
            dispatch(updateOthersCoordinates(data))
        },
        fetchOthersCoordinatesError: error => {
            dispatch(updateOthersCoordinatesError(error))
        },
        dispatchFetchedProJobRequests: jobs => {
            dispatch(fetchedJobProviderInfo(jobs));
        },
        updateOnlineStatus: status => {
            dispatch(updateOnlineStatus(status));
        },
        updateConnectivityStatus: status => {
            dispatch(updateConnectivityStatus(status));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hamburger);
