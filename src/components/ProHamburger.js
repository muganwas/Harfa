import React from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { 
    updatingCoordinates, 
    updateCoordinates, 
    updateCoordinatesError, 
    updateOthersCoordinates, 
    updatingOthersCoordinates, 
    updateOthersCoordinatesError 
} from '../Redux/Actions/generalActions';
import { DrawerActions } from 'react-navigation-drawer';
import ProPendingJobRequest from './ProPendingJobRequest';
import geolocation from '@react-native-community/geolocation';
import firebase from 'react-native-firebase';
import ProviderDetails from './ProviderDetails';
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
    titleText: {fontSize: 20, fontWeight: 'bold', color: 'black', textAlignVertical: 'center', flex: 1 }
})
class Hamburger extends React.Component{

    componentDidMount(){
        const {fetchNotifications, fetchedNotifications, fetchingOthersCoordinates, fetchedOthersCoordinates, fetchOthersCoordinatesError} = this.props;
        const senderId = ProPendingJobRequest.Request.user_id;
        const receiverId = ProviderDetails.Provider.providerId;

        const userRef = firebase.database().ref(`liveLocation/${receiverId}`);
        /** get pros current position and upload it to db */
        geolocation.getCurrentPosition(info => {
            const { coords: { latitude, longitude} } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchingCoordinates();
            userRef.update({latitude, longitude}).then(() => {
                console.log('set pro position');
                fetchedCoordinates({latitude, longitude});
            }).
            catch(e => {
                console.log(e.message);
                fetchCoordinatesError(e.message);
            });
        }, error => {
            console.log(error)
        });

        /**fetch users current position */
        firebase.database().ref(`liveLocation/${senderId}`).once('value', result => {
            console.log('others position pro')
            console.log(result.val());
            fetchedOthersCoordinates(result.val());
        }).
        catch(e => {
            fetchOthersCoordinatesError(e.message);
        });
        /** look out for pros changing position */
        geolocation.watchPosition(info => {
            console.log('pro position');
            console.log(info);
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            const { coords: { latitude, longitude} } = info;
            fetchingCoordinates();
            userRef.update({latitude, longitude}).then(() => {
                console.log('updated pro position');
                fetchedCoordinates({latitude, longitude});
            }).
            catch(e => {
                console.log(e.message);
                fetchCoordinatesError(e.message);
            })
        }, error => {
            console.log(error)
        }, {enableHighAccuracy: true});

        /** lookout for users changed position */
        firebase.database().ref(`liveLocation/${senderId}`).on('child_changed', () => {
            fetchingOthersCoordinates();
            firebase.database().ref(`liveLocation/${senderId}`).once('value', result => {
                console.log('others position pro')
                console.log(result.val());
                fetchedOthersCoordinates(result.val());
            }).
            catch(e => {
                fetchOthersCoordinatesError(e.message);
            });
        });

        firebase.notifications().onNotification(notification => {
            const { notificationsInfo, navigation } = this.props;
            const { title, body, data } = notification;

            console.log("Title, body , data >>> " + title + " >> " + body + " >> " + JSON.stringify(data));
            console.log('DeliveryAddress >>> ', data.delivery_address);
            console.log('DeliveryLat >>> ', data.delivery_lat);

            if(title == "Booking Request")
            {
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
                fetchedNotifications({type: 'generic', value: newGenericCount});
            }
        });

        firebase.database().ref('chatting').child(senderId).on('child_changed', result => {
            /** not too important */
            fetchNotifications({type: 'messages'});
            // console.log(result.val())
            firebase.database().ref('chatting').child(senderId).child(receiverId).limitToLast(1).once('value', result => {
                const {notificationsInfo} = this.props;
                const value = result.val();
                Object.keys(value).map(key => {
                    const sentById = value[key].senderId;
                    if (String(receiverId) !== String(sentById)){
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
                        const currentMessagesCount = notificationsInfo.messages;
                        const newMessagesCount = currentMessagesCount + 1;
                        //console.log(currentCount)
                        fetchedNotifications({type: 'messages', value: newMessagesCount});
                        // console.log(Notifications.messages);
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
            fetchedNotifications({type: 'adminMessages', value: adminMessageCount + 1});
        });
        
    }

    componentWillUnmount(){
        console.log('pro burger unmount..');
        const senderId = ProPendingJobRequest.Request.user_id;
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
        const notificationTotal = notificationsInfo.messages + notificationsInfo.generic + notificationsInfo.adminMessages;
        return (
            <>
                <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
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
        notificationsInfo: state.notificationsInfo
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
