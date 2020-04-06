import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import ProPendingJobRequest from './ProPendingJobRequest';
import firebase from 'react-native-firebase';
import ProviderDetails from './ProviderDetails';

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
const Hamburger = ({text, navigation, Notifications, notificationsInfo }) => {
    const [notificationTotal=0, updateNotificationTotal] = useState();
    useEffect(() => {
        console.log('hamburger loaded...')
        console.log(notificationsInfo)
        const senderId = ProPendingJobRequest.Request.user_id;
        const receiverId = ProviderDetails.Provider.providerId;
        let total = Notifications.messages + Notifications.generic + Notifications.admin;
        updateNotificationTotal(total);
        firebase.database().ref('chatting').child(senderId).on('child_changed', result => {
            let total = Notifications.messages + Notifications.generic + Notifications.admin;
            updateNotificationTotal(total);
            console.log(result.val())
            firebase.database().ref('chatting').child(senderId).child(receiverId).limitToLast(1).once('value', result => {
                const value = result.val();
                Object.keys(value).map(key => {
                    const sentById = value[key].senderId;
                    if (String(receiverId) !== String(sentById)){
                        const currentCount = Notifications.messages;
                        Notifications.messages = currentCount + 1;
                        updateNotificationTotal(total + 1);
                        console.log(Notifications.messages);
                    }
                })
                //console.log(value); 
            });
        });
        firebase.database().ref('adminChatting').child(senderId).on('child_changed', result => {
            //Notifications.admin = Notifications.admin + 1;
        });
        return () => {
            console.log('pro burger unmount..')
        }
    }, [])
    useEffect(() => {
        let total = Notifications.messages + Notifications.generic + Notifications.admin;
        console.log(total)
        //if (notificationTotal !== total) updateNotificationTotal(total);
    });
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

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo
    }
}

export default connect(mapStateToProps)(Hamburger);
