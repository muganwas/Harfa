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
    updateOthersCoordinatesError
} from '../Redux/Actions/generalActions';
import { DrawerActions } from 'react-navigation-drawer';
import firebase from 'react-native-firebase';
import geolocation from '@react-native-community/geolocation';
import UserDetails from './UserDetails';
import { Notifications } from 'react-native-notifications';

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
    constructor() {
        super();
        this.state = {
            employeesLocationsFetched: false
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
        console.log('hamburger mounted..')
        const {
            navigation,
            fetchNotifications,
            fetchedNotifications,
            fetchedMessages,
            fetchingOthersCoordinates,
            fetchedOthersCoordinates,
            fetchOthersCoordinatesError,
            jobsInfo: { allJobRequestsClient }
        } = this.props;
        const senderId = UserDetails.User.userId;
        const userRef = firebase.database().ref(`liveLocation/${senderId}`);

        allJobRequestsClient.map(obj => {
            const { employee_id } = obj;
            firebase.database().ref('chatting').
                child(senderId).
                child(employee_id)
                .on('child_added', data => {
                    const { messagesInfo: { dataChatSource } } = this.props;
                    let newDataChatSource = Object.assign({}, dataChatSource);
                    let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                    newArr.push(data.val())
                    newDataChatSource[employee_id] = newArr;
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
                    newDataChatSource[employee_id] = newArr;
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
    }

    componentDidUpdate() {
        const {
            jobsInfo: { jobRequests }
        } = this.props;
        if (jobRequests && !this.state.employeesLocationsFetched)
            this.fetchEmployeeLocations();
    }

    componentWillUnmount() {
        const senderId = UserDetails.User.userId;
        //const receiverId = ProviderDetails.Provider.providerId;
        firebase.database().ref('adminChatting').child(senderId).off('child_changed')
        firebase.database().ref('chatting').child(senderId).off('child_changed');
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
        this.setState({employeesLocationsFetched:true});
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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hamburger);
