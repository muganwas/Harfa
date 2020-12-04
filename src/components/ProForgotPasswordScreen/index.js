
import React, { Component } from 'react';
import {
    View, StatusBar, Text, StyleSheet, TextInput, Image, TouchableOpacity,
    Dimensions, ActivityIndicator, Platform
} from 'react-native';
import ShakingText from 'react-native-shaking-text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import DialogComponent from '../DialogComponent';
import Config from '../Config';
import { black, white, lightGray, themeRed } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const FORGOT_PASSWORD = Config.baseURL + "employee/forgot_password/email";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: white
            }}>
                <StatusBar
                    barStyle="dark-content" />
            </View>
            :
            <StatusBar barStyle='dark-content' backgroundColor={white} />
    );
}

export default class ProForgotPasswordScreen extends Component {

    constructor(props) {
        super();

        this.state = {
            email: '',
            isLoading: false,
            showDialog: false,
            dialogType: null,
            dialogTitle: '',
            dialogDesc: '',
            dialogLeftText: 'Cancel',
            dialogRightText: 'Retry'
        }
        this.leftButtonActon = null;
        this.rightButtonAction = null;
    }

    checkValidation = () => {
        if (this.state.email == '') {
            this.setState({ error: 'Enter valid email' })
        }
        else {
            this.forgotPasswordTask();
        }
    }

    forgotPasswordTask = () => {

        this.setState({
            isLoading: true,
        });

        const data = {
            "email": this.state.email
        }

        fetch(FORGOT_PASSWORD,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("Response Forgot" + JSON.stringify(responseJson));
                if (responseJson.result) {
                    this.leftButtonActon = null;
                    this.rightButtonAction = () => {
                        this.setState({
                            isLoading: false,
                            showDialog: false,
                            dialogType: null
                        });
                    }
                    this.setState({
                        isLoading: false,
                        showDialog: true,
                        dialogType: 'fb',
                        dialogTitle: 'Congratulations!',
                        dialogDesc: "Your password is sent to your registered Email address",
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok'
                    });
                }
                else {
                    console.log("Response Else ");
                    this.leftButtonActon = () => {
                        this.setState({
                            isLoading: false,
                            showDialog: false,
                            dialogType: null
                        });
                    };
                    this.rightButtonAction = () => {
                        this.forgotPasswordTask();
                        this.setState({
                            isLoading: false,
                            showDialog: false,
                            dialogType: null
                        });
                    }
                    this.setState({
                        isLoading: false,
                        showDialog: true,
                        dialogType: 'fb',
                        dialogTitle: 'Congratulations!',
                        dialogDesc: "Your password is sent to your registered Email address",
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Retry'
                    });
                }
            })
            .catch((error) => {
                console.log("Error :" + error);
                this.leftButtonActon = () => {
                    this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null
                    });
                };
                this.rightButtonAction = () => {
                    this.forgotPasswordTask();
                    this.setState({
                        isLoading: false,
                        showDialog: false,
                        dialogType: null
                    });
                }
                this.setState({
                    isLoading: false,
                    showDialog: true,
                    dialogType: 'fb',
                    dialogTitle: 'OOPS!',
                    dialogDesc: "Something went wrong, Try again later",
                    dialogLeftText: 'Cancel',
                    dialogRightText: 'Retry'
                });
            })
            .done()
    }

    changeDialogVisibility = () => this.setState(prevState => ({ showDialog: !prevState.showDialog }))

    render() {
        const { showDialog, dialogType, dialogTitle, dialogDesc, dialogLeftText, dialogRightText } = this.state;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <DialogComponent
                    isDialogVisible={showDialog && dialogType !== null}
                    transparent={true}
                    animation='fade'
                    width={screenWidth - 80}
                    changeDialogVisibility={this.changeDialogVisibility}
                    leftButtonAction={this.leftButtonActon}
                    rightButtonAction={this.rightButtonAction}
                    isLoading={false}
                    titleText={dialogTitle}
                    descText={dialogDesc}
                    leftButtonText={dialogLeftText}
                    rightButtonText={dialogRightText}
                />
                <KeyboardAwareScrollView contentContainerStyle={{
                    justifyContent: 'center', alignItems: 'center',
                    alwaysBounceVertical: true
                }}
                    keyboardShouldPersistTaps='handled'
                    keyboardDismissMode='on-drag'>

                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ height: 200, width: screenWidth, backgroundColor: white, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'flex-start', justifyContent: 'center', marginLeft: 5, marginTop: 15, }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, tintColor: black, height: 20, alignSelf: 'center', }}
                                    source={require('../../icons/arrow_back.png')} />
                            </TouchableOpacity>
                            <Image
                                style={{ width: 170, height: 170 }}
                                source={require('../../images/kuchapa_logo.png')} resizeMode="contain" />
                        </View>

                        <View style={styles.logincontainer}>

                            <ShakingText style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
                                {this.state.error}
                            </ShakingText>

                            <View style={{ padding: 5, }}>
                                <Text style={{ color: black, fontWeight: 'bold', fontSize: 17, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }}>
                                    Recover Your Password
                                </Text>
                            </View>

                            <View style={{ padding: 5, width: screenWidth - 50, }}>
                                <Text style={{ color: black, fontSize: 13, marginBottom: 5, textAlign: 'center' }}>
                                    Please enter your registered Email address to access your pin account
                                </Text>
                            </View>

                            <View style={[styles.textInputView, { marginTop: 15 }]}>
                                <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                    source={require('../../icons/email.png')}></Image>
                                <TextInput
                                    style={{ width: screenWidth - 85, height: 50, marginLeft: 5, color: black }}
                                    placeholder='Email'
                                    onChangeText={(emailInput) => this.setState({ email: emailInput })}>
                                </TextInput>
                            </View>

                            <TouchableOpacity style={styles.buttonContainer}
                                onPress={this.checkValidation}>
                                <Text style={styles.text}>
                                    Submit
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: lightGray
    },
    logincontainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    textInputView: {
        flexDirection: 'row',
        width: screenWidth - 40,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        backgroundColor: white,
        shadowColor: black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    separator: {
        borderBottomWidth: 0.8,
        borderBottomColor: '#ebebeb',
        marginTop: 5,
        marginBottom: 5
    },
    buttonContainer: {
        width: 175,
        height: 45,
        backgroundColor: themeRed,
        shadowColor: black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    text: {
        fontSize: 16,
        color: white,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    }
});