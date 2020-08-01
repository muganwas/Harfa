import React from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../Redux/Actions/messageActions';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError, setSelectedJobRequest, updateActiveRequest } from '../Redux/Actions/jobsActions';
import {
    updatingCoordinates,
    updateCoordinates,
    updateCoordinatesError,
    updateOthersCoordinates,
    updatingOthersCoordinates,
    updateOthersCoordinatesError,
    updateOnlineStatus,
    updateConnectivityStatus,
    updateLiveChatUsers
} from '../Redux/Actions/generalActions';
import { DrawerActions } from 'react-navigation-drawer';
import firebase from 'react-native-firebase';
import Toast from 'react-native-simple-toast';
import OnlineUsers from './OnlineUsers';
import NetInfo from "@react-native-community/netinfo";
import Config from './Config';
import geolocation from '@react-native-community/geolocation';
import UserDetails from './UserDetails';
import { imageExists } from '../misc/helpers';
import { Notifications } from 'react-native-notifications';

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
    titleText: { fontSize: 20, fontWeight: 'bold', color: 'black', textAlignVertical: 'center', flex: 1, flexDirection: 'row', alignItems: 'center' }
})
class Hamburger extends React.Component {
    constructor(props) {
        super();
        this.state = {
            employeesLocationsFetched: false,
            connectivityAvailable: false,
            availabilityChecked: false,
            availabilityObj: {}
        }
        Notifications.events().registerRemoteNotificationsRegistered(event => {
            // TODO: Send the token to my server so it could send back push notifications...
        });

        Notifications.events().registerRemoteNotificationsRegistrationFailed(event => {
            console.error(event);
        });

        Notifications.registerRemoteNotifications();
    }
    componentDidMount() {
        const {
            fetchedNotifications,
            fetchedMessages,
            jobsInfo: { allJobRequestsClient },
            updateLiveChatUsers,
            userInfo: { userDetails },
        } = this.props;
        const senderId = userDetails.userId;
        const userRef = firebase.database().ref(`liveLocation/${senderId}`);

        this.checkNoficationsAvailability();

        firebase.notifications().onNotification(async notification => {
            const { fetchedNotifications, updateActiveRequest, navigation, notificationsInfo, fetchedPendingJobInfo, jobsInfo: { jobRequests } } = this.props;
            const currentGenericCount = notificationsInfo.generic;
            const newGenericCount = currentGenericCount + 1;
            let newJobRequests = [...jobRequests];
            fetchedNotifications({ type: 'generic', value: newGenericCount });
            const { title, body, data } = notification;
            const orderId = data.orderId;
            let pos = 0;

            jobRequests.map((obj, key) => {
                const currOrderId = obj.order_Id;
                if (orderId === currOrderId) pos = key;
            });

            if (title == "Chat Request Accepted" && pos != null) {
                /*this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                    isToastShow: true,
                })*/
                var providerData = JSON.parse(data.ProviderData);

                var pendingJobData = {
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
                    status: data.status,
                    delivery_address: data.delivery_address,
                    delivery_lat: data.delivery_lat,
                    delivery_lang: data.delivery_lang,
                }
                imageExists(providerData.imageSource).then(res => {
                    pendingJobData.imageAvailable = res;
                });
                newJobRequests[pos] = pendingJobData;
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Demande de chat acceptée");
                updateActiveRequest(false);
                navigation.navigate('DashBoard');
            }
            else if (title == "Chat Request Rejected") {
                this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                    isJobAccepted: false,
                })
                this.showRejectionAlert("DEMANDE DE CHAT REJETÉE", "Le fournisseur de services a rejeté votre demande. Veuillez réessayer plus tard")
            }
            else if ((title == "No Response" || title == "Canceled") && pos != null) {
                this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                })
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("Pas de réponse", "Le fournisseur de services n'a pas répondu à votre demande. Veuillez réessayer plus tard")
            }
            else if (title == "Job Accepted" && pos != null) {
                var pendingJobData = {
                    id: data.mainId,
                    order_id: data.orderId,
                    employee_id: data.ProviderId,
                    image: data.image,
                    fcm_id: data.fcmId,
                    name: data.name,
                    surName: data.surname,
                    mobile: data.mobile,
                    description: data.description,
                    address: data.address,
                    lat: data.lat,
                    lang: data.lang,
                    service_name: data.serviceName,
                    chat_status: data.chat_status,
                    status: data.status,
                    delivery_address: data.delivery_address,
                    delivery_lat: data.delivery_lat,
                    delivery_lang: data.delivery_lang,
                }
                newJobRequests[pos] = pendingJobData;
                fetchedPendingJobInfo(newJobRequests);

                this.showRejectionAlert("EMPLOI ACCEPTÉ", "Votre travail a été accepté.")
            }
            else if (title == "Job Rejected" && pos != null) {
                this.setState({
                    isJobAccepted: false
                })
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("EMPLOI REJETÉ", "Votre travail a été rejeté. Veuillez réessayer plus tard")
            }
            else if (title == "Job Completed" && pos != null) {
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("TRAVAIL TERMINE", "Votre travail est terminé.")
            }
        });

        allJobRequestsClient.map(obj => {
            const { employee_id } = obj;
            firebase.database().ref('chatting').
                child(senderId).
                child(employee_id)
                .on('child_added', data => {
                    const { messagesInfo: { dataChatSource } } = this.props;
                    let newDataChatSource = Object.assign({}, dataChatSource);
                    let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                    newArr.push(data.val());
                    const newData = [...newArr];
                    //filter out only unique messages
                    const uniqueData = Array.from(new Set(newData.map(a => {
                        if (a)
                            return a.time
                    })))
                        .map(time => {
                            return newData.find(a => {
                                if (a) return a.time === time
                            })
                        });
                    newDataChatSource[employee_id] = uniqueData;
                    fetchedMessages(newDataChatSource);
                });
            firebase.database().ref('chatting').
                child(senderId).
                child(employee_id)
                .once('value', data => {
                    const { dataChatSource } = this.props.messagesInfo;
                    let newDataChatSource = Object.assign({}, dataChatSource);
                    let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                    newArr.push(data.val())
                    const newData = [...newArr];
                    //filter out only unique messages
                    const uniqueData = Array.from(new Set(newData.map(a => {
                        if (a)
                            return a.time
                    })))
                        .map(time => {
                            return newData.find(a => {
                                if (a)
                                    a.time === time
                            })
                        });
                    newDataChatSource[employee_id] = uniqueData;
                    fetchedMessages(newDataChatSource);
                });
        });
        /** fetch users current position and upload it to db */
        geolocation.getCurrentPosition(info => {
            const { coords: { latitude, longitude } } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchedCoordinates({ latitude, longitude });
            userRef.update({ latitude, longitude }).then(() => {
                //updated loc
            }).
                catch(e => {
                    console.log(e.message);
                    fetchCoordinatesError(e.message);
                });
        }, error => {
            console.log(error)
        });

        /** lookout for users changing position */
        geolocation.watchPosition(info => {
            const { coords: { latitude, longitude } } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchedCoordinates({ latitude, longitude });
            userRef.update({ latitude, longitude }).then(() => {
                //fetchedCoordinates({ latitude, longitude });
            }).
                catch(e => {
                    console.log(e.message);
                    fetchCoordinatesError(e.message);
                })
        }, error => {
            console.log(error)
        }, { enableHighAccuracy: true });
        /** lookout for pros changing position */
        this.fetchEmployeeLocations();

        firebase.database().ref('chatting').child(senderId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
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

            let currentMessagesCount = notificationsInfo.messages;
            let newMessagesCount = currentMessagesCount + 1;
            fetchedNotifications({ type: 'messages', value: newMessagesCount });
        });

        firebase.database().ref('adminChatting').child(senderId).on('child_changed', result => {
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
            fetchedNotifications({ type: 'adminMessages', value: adminMessageCount });
        });

        const { updateOnlineStatus, updateConnectivityStatus } = this.props

        NetInfo.addEventListener(status => {
            updateConnectivityStatus(status.isConnected);
        });
        NetInfo.fetch().then(status => {
            updateConnectivityStatus(status.isConnected);
        });
        socket.on('connect', () => {
            const userId = userDetails.userId;
            if (userId) {
                socket.emit('connected', userId);
                updateOnlineStatus(true)
            }
        });
        socket.on('user-disconnected', users => {
            console.log('user disconnected');
            updateLiveChatUsers(users);
            OnlineUsers.Users = users;
        })
        socket.on('user-joined', users => {
            console.log('user joined')
            updateLiveChatUsers(users);
            OnlineUsers.Users = users;
        })
        socket.on('disconnect', info => {
            console.log('disconnection info --', info)
            updateLiveChatUsers({});
            const { generalInfo: { online, connectivityAvailable } } = this.props
            updateOnlineStatus(false)
            if (!online && connectivityAvailable) socket.open();
        });
        socket.open();
    }

    componentDidUpdate() {
        const {
            jobsInfo: { jobRequests }
        } = this.props;
        if (jobRequests && !this.state.employeesLocationsFetched)
            this.fetchEmployeeLocations();
    }

    componentWillUnmount() {
        const { userInfo: { userDetails } } = this.props;
        const senderId = userDetails.userId;
        firebase.database().ref('adminChatting').child(senderId).off('child_changed')
        firebase.database().ref('chatting').child(senderId).off('child_changed');
    }

    checkNoficationsAvailability = async () => {
        if (Platform.OS === 'android') {
            try {
                await firebase.messaging().requestPermission();
                const fcmToken = await firebase.messaging().getToken();
                if (fcmToken) {
                    const enabled = await firebase.messaging().hasPermission();
                    if (enabled) {
                        console.log('FCM messaging has permission:' + enabled)
                        firebase.notifications().onNotificationDisplayed((notification) => {
                            // Process your notification as required
                            // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
                            const { title, body } = notification;
                            console.log('NotificationDisplayed : ', notification);
                        });
                        firebase.notifications().onNotification((notification) => {
                            const { title, body } = notification;
                        });
                    }
                    else {
                        try {
                            await firebase.messaging().requestPermission();
                            console.log('FCM permission granted')
                        }
                        catch (error) {
                            console.log('FCM Permission Error', error);
                        }
                    }
                }
                else {
                    console.log('FCM Token not available');
                }
            } catch (e) {
                console.log('Error initializing FCM', e);
            }
        }
    }

    fetchEmployeeLocations = () => {
        const {
            fetchingOthersCoordinates,
            fetchedOthersCoordinates,
            fetchOthersCoordinatesError,
            jobsInfo: { jobRequests }
        } = this.props;
        jobRequests.map(obj => {
            const { employee_id } = obj;
            firebase.database().ref(`liveLocation/${employee_id}`).once('value', result => {
                const { generalInfo: { othersCoordinates } } = this.props;
                let newOthersCoordinates = Object.assign({}, othersCoordinates);
                const loc = result.val();
                newOthersCoordinates[employee_id] = loc;
                fetchedOthersCoordinates(newOthersCoordinates);
            }).
                catch(e => {
                    fetchOthersCoordinatesError(e.message);
                });

            firebase.database().ref(`liveLocation/${employee_id}`).
                on('child_changed', () => {
                    const { generalInfo: { othersCoordinates } } = this.props;
                    let newOthersCoordinates = Object.assign({}, othersCoordinates);
                    fetchingOthersCoordinates();
                    firebase.database().ref(`liveLocation/${employee_id}`).
                        once('value', result => {
                            newOthersCoordinates[employee_id] = result.val();
                            fetchedOthersCoordinates(newOthersCoordinates);
                        }).
                        catch(e => {
                            fetchOthersCoordinatesError(e.message);
                        });
                });
        });
        this.setState({ employeesLocationsFetched: true });
    }

    showToast = message => {
        Toast.show(message, Toast.SHORT);
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
                <TouchableOpacity onPress={navigation ? () => navigation.dispatch(DrawerActions.openDrawer()) : () => { }}
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
        messagesInfo: state.messagesInfo,
        generalInfo: state.generalInfo,
        jobsInfo: state.jobsInfo,
        userInfo: state.userInfo
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
        fetchingPendingJobInfo: () => {
            dispatch(startFetchingJobCustomer());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobCustomerInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchCustomerJobInfoError(error))
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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hamburger);
