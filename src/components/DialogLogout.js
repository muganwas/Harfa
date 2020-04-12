import React, { Component } from 'react';
import {StyleSheet, Text, View, Platform, Dimensions, TouchableOpacity, TouchableHighlight, BackHandler} from 'react-native'
import Modal from 'react-native-modalbox';
import AsyncStorage from '@react-native-community/async-storage';
import RNExitApp from 'react-native-exit-app';
import Config from './Config';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default class DialogLogout extends Component {

    constructor(props) {
      super(props)

      this.state = {
          width: Dimensions.get('window').width,
      }
      Dimensions.addEventListener('change', (e) => {
          this.setState(e.window);
      })
    };

    async closeDialogLogout (action) {
        if(action == 'Ok')
        {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userType');

            console.log("Logout");    
           if (Platform.OS == 'android') BackHandler.exitApp();
           else {
                Config.socket.close();
                RNExitApp.exitApp();
           }
        }
        else if(action == 'Cancel')
        {
            console.log("Logout Cancel");
        }
        this.props.changeDialogVisibility(false);
    }

  render() {
    return (
      
        <TouchableOpacity activeOpacity={1} disabled={true} style={styles.contentContainer}>
            <View style={[styles.modal, {width: this.state.width - 80}]}>
                <View style={styles.textView}>
                    <Text style={[styles.text, {fontSize: 20}]}> Se déconnecter! </Text>
                    <Text style={styles.text}> Êtes-vous sûr de vous déconnecter? </Text>
                </View>
                <View style={styles.buttonView}> 
                    <TouchableHighlight style={styles.touchableHighlight} onPress={ () => this.closeDialogLogout('Cancel')}
                        underlayColor={colorBg}>
                        <Text style={[styles.text, {color: 'blue'}]}> Annuler </Text>
                    </TouchableHighlight>
                    <TouchableHighlight style={styles.touchableHighlight} onPress={ () => this.closeDialogLogout('Ok')}
                        underlayColor={colorBg}>
                        <Text style={[styles.text, {color: 'blue'}]}> {"D'accord"} </Text>
                    </TouchableHighlight>
                </View>
            </View>
        </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({

    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        height: 150,
        paddingTop: 10,
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: colorBg,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    text: {
        margin: 5,
        fontSize: 16,
        fontWeight: 'bold',
    },
    touchableHighlight: {
        flex: 1,
        backgroundColor: colorBg,
        paddingVertical: 10,
        alignSelf: 'stretch',
        alignItems: 'center',
        borderRadius: 10,
    },
    textView: {
        flex: 1,
        alignItems: 'center',
    },
    buttonView: {
        width: '100%',
        flexDirection: 'row',
    }
});

