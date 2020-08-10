
import React, { Component } from 'react';
import {View, Image, Text, StatusBar, TouchableOpacity, BackHandler} from 'react-native';
import firebase from 'react-native-firebase';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import RNExitApp from 'react-native-exit-app';

//const colorPrimary = '#262425';
//const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F'

export default class AfterSplashScreen extends Component {
    async componentDidMount()
    {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
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
