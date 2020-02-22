
import React, { Component } from 'react';
import {View, Image, Text, StatusBar, TouchableOpacity, BackHandler} from 'react-native';
import firebaseMessaging, { Notification, RemoteMessage } from 'react-native-firebase';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import RNExitApp from 'react-native-exit-app';

const colorPrimary = '#262425';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F'

export default class AfterSplashScreen extends Component {

    async componentDidMount()
    {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

        if (Platform.OS === 'android') {
            try {
              const res = await firebaseMessaging.messaging().requestPermission();
              const fcmToken = await firebaseMessaging.messaging().getToken();
              if (fcmToken) {
                console.log('FCM Token: ', fcmToken);
                const enabled = await firebaseMessaging.messaging().hasPermission();
                if (enabled) 
                {
                    console.log('FCM messaging has permission:' + enabled)
                    firebaseMessaging.notifications().onNotificationDisplayed((notification) => {
                        // Process your notification as required
                        // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
                        const { title, body } = notification;
                        console.log('NotificationDisplayed : ', notification);
                        console.log("Title, body >>> "+title+" "+body);
                    });
                    firebaseMessaging.notifications().onNotification((notification) => {
                        
                        const { title, body } = notification;

                        console.log('Notification >>> ', notification);
                        console.log("Title, body >>> "+title+" "+body);
                    });
                }
                else 
                {
                  try 
                  {
                    await firebaseMessaging.messaging().requestPermission();
                    console.log('FCM permission granted')
                  } 
                  catch (error)
                   {
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
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        if (Platform.OS == 'android')
            BackHandler.exitApp();
        else
            RNExitApp.exitApp();
    }

    render() {
        return (
            <View style = {styles.container}>
               
                <StatusBar barStyle='light-content' backgroundColor='#000000' />

                <Image 
                    style ={{width: 250, height: 250}} 
                    source= {require('../images/harfa_logo.png')}/>

                <TouchableOpacity style = {styles.buttonContainer} 
                    onPress ={() => this.props.navigation.navigate("AccountType")}>
                    <Text style={styles.text}>
                        CLIENT 
                    </Text>
                </TouchableOpacity>
              
              <TouchableOpacity style = {styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("ProAccountType")}>
                    <Text style={styles.text}>
                    PRESTATAIRE
                    </Text>
              </TouchableOpacity>
               
           </View>
        )
    }
}

const styles = {
    container: {
        flex : 1,
        backgroundColor : '#000000',
        justifyContent : 'center',
        alignItems : 'center'
    },
    buttonContainer : {
        width: 250,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        marginBottom: 25,
        textAlign: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    }
}
