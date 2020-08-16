import React, { Component } from 'react';
import {
    StyleSheet, Text, View, Platform, Dimensions, TouchableOpacity, TouchableHighlight, BackHandler,
    ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import RNExitApp from 'react-native-exit-app';
import Config from './Config';

const colorBg = '#E8EEE9';
const PRO_INFO_UPDATE = Config.baseURL + "employee/";

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

    async closeDialogLogout(action) {
        if (action == 'Ok') {
            const userData = {
                "status": "0"
            }

            this.setState({
                isLoading: true
            });

            const { userInfo: { providerDetails } } = this.props;

            fetch(PRO_INFO_UPDATE + providerDetails.providerId,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                })
                .then((response) => response.json())
                .then(async (response) => {
                    console.log("Response" + JSON.stringify(response));
                    if (response.result) {
                        this.setState({
                            isLoading: false
                        })
                        await AsyncStorage.removeItem('userId');
                        await AsyncStorage.removeItem('userType');

                        console.log("Logout");
                        if (Platform.OS == 'android') BackHandler.exitApp();
                        else {
                            Config.socket.close();
                            RNExitApp.exitApp();
                            this.props.changeDialogVisibility(false);
                        }
                    }
                    else {
                        this.setState({
                            isLoading: false,
                        })
                    }
                })
                .catch((error) => {
                    console.log("Error :" + error);
                    this.setState({
                        isLoading: false,
                    })
                })
                .done()
        }
        else if (action == 'Cancel') {
            console.log("Logout Cancel");
            this.props.changeDialogVisibility(false);
        }

    }

    render() {
        return (

            <TouchableOpacity activeOpacity={1} disabled={true} style={styles.contentContainer}>
                <View style={[styles.modal, { width: this.state.width - 80 }]}>
                    <View style={styles.textView}>
                        <Text style={[styles.text, { fontSize: 20 }]}> Logout! </Text>
                        <Text style={styles.text}> Are you sure to logout? </Text>
                    </View>
                    <View style={styles.buttonView}>
                        <TouchableHighlight style={styles.touchableHighlight} onPress={() => this.closeDialogLogout('Cancel')}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: 'blue' }]}> Cancel </Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.touchableHighlight} onPress={() => this.closeDialogLogout('Ok')}
                            underlayColor={colorBg}>
                            <Text style={[styles.text, { color: 'blue' }]}> Ok </Text>
                        </TouchableHighlight>
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

})

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

