import React, { Component } from 'react';
import {
    StyleSheet, Text, View, Dimensions, TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import AsyncStorage from '@react-native-community/async-storage';
import firebaseAuth from '@react-native-firebase/auth';
import { resetUserDetails } from '../../Redux/Actions/userActions';
import Config from '../Config';
import { colorBg, themeRed, colorGreen, black, white } from '../../Constants/colors';

class ProDialogLogout extends Component {
    constructor(props) {
        super();
        this.state = {
            isLoading: false,
            width: Dimensions.get('window').width,
        }
        Dimensions.addEventListener('change', (e) => {
            this.setState(e.window);
        })
    };

    closeDialogLogout = async action => {
        const { resetUserDetails, changeDialogVisibility } = this.props;
        if (action == 'Ok') {
            if (firebaseAuth().currentUser) firebaseAuth().signOut();
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('auth');
            await AsyncStorage.removeItem('firebaseId');
            await AsyncStorage.removeItem('email');
            await AsyncStorage.removeItem('userType');
            resetUserDetails();
            Config.socket.close();
            changeDialogVisibility(false);
            RNExitApp.exitApp();
        }
        else if (action == 'Cancel') {
            console.log("Logout Cancel");
            changeDialogVisibility(false);
        }

    }

    render() {
        return (
            <TouchableOpacity activeOpacity={0} disabled={true} style={styles.contentContainer}>
                <View style={[styles.modal, { width: this.state.width - 80 }]}>
                    <View style={styles.textView}>
                        <Text style={[styles.text, { fontSize: 20, color: white }]}> Logout! </Text>
                        <Text style={[styles.text, { color: white}]}> Are you sure you want to log out? </Text>
                    </View>
                    <View style={styles.buttonView}>
                        <TouchableOpacity style={styles.touchableHighlight} onPress={() => this.closeDialogLogout('Cancel')}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: colorGreen }]}> Cancel </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.touchableHighlight} onPress={() => this.closeDialogLogout('Ok')}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: themeRed }]}> Ok </Text>
                        </TouchableOpacity>
                    </View>

                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }
}

const mapStateToProps = state => ({
    userInfo: state.userInfo
});

const mapDispatchToPRops = dispatch => ({
    resetUserDetails: () => {
        dispatch(resetUserDetails());
    }
});

export default connect(mapStateToProps, mapDispatchToPRops)(ProDialogLogout)

const styles = StyleSheet.create({

    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        height: 150,
        paddingTop: 10,
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: themeRed,
        borderRadius: 10,
        shadowColor: black,
        shadowOffset: { width: 0, height: 3 },
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
        borderRadius: 10,
        shadowColor: black,
        margin: 5,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        paddingVertical: 10,
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
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
});