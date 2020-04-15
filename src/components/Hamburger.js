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
import PendingJobRequest from './PendingJobRequest';
import firebase from 'react-native-firebase';
import geolocation from '@react-native-community/geolocation';
import UserDetails from './UserDetails';
import {Notifications} from 'react-native-notifications';

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
    titleText: {fontSize: 20, fontWeight: 'bold',color: 'black', textAlignVertical: 'center', flex: 1, flexDirection: 'row', alignItems: 'center' }
})
class Hamburger extends React.Component {
    constructor(){
        super()
        Notifications.events().registerRemoteNotificationsRegistered(event => {
            // TODO: Send the token to my server so it could send back push notifications...
            console.log("Device Token Received", event.deviceToken);
        });
        
        Notifications.events().registerRemoteNotificationsRegistrationFailed(event => {
            console.error(event);
        });

        Notifications.registerRemoteNotifications();
    }
    componentDidMount(){
        const {
            navigation, 
            fetchNotifications, 
            fetchedNotifications, 
            fetchedMessages,
            fetchingOthersCoordinates, 
            fetchedOthersCoordinates, 
            fetchOthersCoordinatesError,
            jobsInfo: { jobRequests }
        } = this.props;
        console.log('hamburger loaded...');
        const providerId = navigation ?
        navigation.state.params ? 
        navigation.satate.params.providerId ? 
        navigation.state.params.providerId : 
        null : 
        null :
        null;
        const receiverId = PendingJobRequest.Request.employee_id || providerId;
        const senderId = UserDetails.User.userId;
        const userRef = firebase.database().ref(`liveLocation/${senderId}`);
        var providersLocation = {};
        /** fetch users current position and upload it to db */
        geolocation.getCurrentPosition(info => {
            const { coords: { latitude, longitude} } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchingCoordinates();
            userRef.update({latitude, longitude}).then(() => {
                console.log('set position');
                fetchedCoordinates({latitude, longitude});
            }).
            catch(e => {
                console.log(e.message);
                fetchCoordinatesError(e.message);
            });
        }, error => {
            console.log(error)
        });

        /**fetch pros current position */
        jobRequests.map(obj => {
            const { employee_id } = obj;
            firebase.database().ref(`liveLocation/${employee_id}`).once('value', result => {
                const loc = result.val();
                providersLocation[employee_id] = loc;
                fetchedOthersCoordinates(providersLocation);
            }).
            catch(e => {
                fetchOthersCoordinatesError(e.message);
            });
        })

        /** lookout for users changing position */
        geolocation.watchPosition(info => {
            console.log('position');
            console.log(info);
            const { coords: { latitude, longitude} } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchingCoordinates();
            userRef.update({latitude, longitude}).then(() => {
                console.log('updated position');
                fetchedCoordinates({latitude, longitude});
            }).
            catch(e => {
                console.log(e.message);
                fetchCoordinatesError(e.message);
            })
        }, error => {
            console.log(error)
        }, {enableHighAccuracy: true});
        /** lookout for pros changing position */
        firebase.database().ref(`liveLocation/${receiverId}`).on('child_changed', () => {
            fetchingOthersCoordinates();
            firebase.database().ref(`liveLocation/${receiverId}`).once('value', result => {
                console.log('others position');
                console.log(result.val());
                fetchedOthersCoordinates(result.val());
            }).
            catch(e => {
                fetchOthersCoordinatesError(e.message);
            });
        });

        firebase.database().ref('chatting').child(senderId).child(receiverId)
            .on('child_added', data => {
                const { dataChatSource } = this.props.messagesInfo;
                let newDataChatSource = [...dataChatSource, data.val()];
                fetchedMessages(newDataChatSource);
            });
        firebase.database().ref('chatting').child(senderId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
            fetchNotifications({type: 'messages'});
            firebase.database().ref('chatting').child(senderId).child(receiverId).limitToLast(1).once('value', result => {
                let value = result.val();
                Object.keys(value).map(key => {
                    let sentById = value[key].senderId;
                    if (String(senderId) !== String(sentById)){
                        //creat a notification
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
                            userInfo: { }
                        });

                        let currentMessagesCount = notificationsInfo.messages;
                        let newMessagesCount = currentMessagesCount + 1;
                        fetchedNotifications({type: 'messages', value: newMessagesCount});
                    }
                })
                //console.log(value); 
            });
        });
        firebase.database().ref('adminChatting').child(senderId).on('child_changed', result => {
            const {notificationsInfo} = this.props;
            const adminMessageCount = notificationsInfo.adminMessages;
            const sentById = value[key].senderId;
            if ( senderId !== sentById) {
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
                    userInfo: { }
                });
            }
            fetchedNotifications({type: 'adminMessages', value: adminMessageCount});
        });
    }
    componentWillUnmount(){
        console.log('burger unmount..');
        const senderId = PendingJobRequest.Request.employee_id;
        //const receiverId = ProviderDetails.Provider.providerId;
        firebase.database().ref('adminChatting').child(senderId).off('child_changed')
        firebase.database().ref('chatting').child(senderId).off('child_changed');
    }
    render(){
        const {
            text, 
            navigation,
            notificationsInfo 
        } = this.props;
        console.log(this.props)
        const notificationTotal = notificationsInfo.messages + notificationsInfo.generic + notificationsInfo.adminMessages;
        return (
            <>
                <TouchableOpacity onPress={ navigation ? () => navigation.dispatch(DrawerActions.openDrawer()) : () => {}}
                    style={styles.touchableHighlight}>
                    <Image style={styles.image}
                        source={require('../icons/humberger.png')} />
                    { notificationTotal > 0 ? <Text style={styles.noticationsCount}>{notificationTotal}</Text> : null }
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
