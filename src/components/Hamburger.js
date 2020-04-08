import React from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../Redux/Actions/messageActions';
import { DrawerActions } from 'react-navigation-drawer';
import PendingJobRequest from './PendingJobRequest';
import firebase from 'react-native-firebase';
import UserDetails from './UserDetails';

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
    image: { width: 25, height: 25 },
    titleText: {fontSize: 20, fontWeight: 'bold',color: 'black', textAlignVertical: 'center', flex: 1, flexDirection: 'row', alignItems: 'center' }
})
class Hamburger extends React.Component {
    state = {notificationTotal: 0, loopCount: 0}
    componentDidMount(){
        const {
            navigation, 
            fetchNotifications, 
            fetchedNotifications, 
            fetchingNotificationsError,
            fetchedMessages
        } = this.props;
        console.log('hamburger loaded...');
        const receiverId = PendingJobRequest.Request.employee_id || navigation.state.params.providerId;
        const senderId = UserDetails.User.userId;
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
                        let currentMessagesCount = notificationsInfo.messages;
                        let newMessagesCount = currentMessagesCount + 1;
                        fetchedNotifications({type: 'messages', value: newMessagesCount});
                    }
                })
                //console.log(value); 
            }).
            catch(e => {
                fetchingNotificationsError(e.message);
                console.log('something went wrong');
            })
        });
        firebase.database().ref('adminChatting').child(senderId).on('child_changed', result => {
            //Notifications.admin = Notifications.admin + 1;
        });
        return () => {
            console.log('burger unmount..');
            firebase.database().ref('chatting').child(senderId).off('child_changed');
        }
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
        notificationsInfo: state.notificationsInfo,
        messagesInfo: state.messagesInfo
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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hamburger);
