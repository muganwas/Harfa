import React, { Component } from 'react';
import {
    View, StatusBar, Text, StyleSheet, Image, TouchableOpacity, TextInput, Modal,
    Dimensions, Platform, BackHandler
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import ShakingText from 'react-native-shaking-text';
import AsyncStorage from '@react-native-community/async-storage';
import 'react-native-gesture-handler';
import firebaseAuth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';
import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';
import {
    getPendingJobRequestProvider,
    getAllWorkRequestPro
} from '../../Redux/Actions/jobsActions';
import Config from '../Config';
import Axios from 'axios';
import WaitingDialog from '../WaitingDialog';
import DialogComponent from '../DialogComponent';
import { updateProviderDetails, updateProviderAuthToken } from '../../Redux/Actions/userActions';
import { themeRed, black, white, lightGray } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + "employee/register/create";
const AUTHENTICATE_URL = Config.baseURL + "employee/authenticate";
const Android = Platform.OS === 'android';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        !Android ?
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

class FacebookGoogleScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            accountType: props.navigation.state.params.accountType,
            email: '',
            password: '',
            opacity: 1,
            isLoading: false,
            isErrorToast: '',
            firebaseId: '',
            loginType: null,
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

    componentDidMount() {
        GoogleSignin.configure();
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    responseFbCallbackPro = (error, result) => {
        if (error) {
            console.log("Error : " + JSON.stringify(result));
        }
        else {
            const { id, name, email, picture: { data: { url } } } = result;
            this.setState({ firebaseId: id, loginType: 'facebook' });
            this.fbGmailLoginTask(name, email, url);
        }
    }

    facebookLoginTask = async () => {
        LoginManager.logInWithPermissions(["public_profile", "email"]).then(result => {
            if (result.isCancelled) {
                console.log("Login cancelled");
            } else {
                AccessToken.getCurrentAccessToken().then(
                    data => {
                        const { updateProviderAuthToken } = this.props;
                        updateProviderAuthToken(data.accessToken);
                        const infoRequest = new GraphRequest(
                            '/me?fields=email,name,picture',
                            null,
                            this.responseFbCallbackPro
                        );
                        // Start the graph request.
                        new GraphRequestManager().addRequest(infoRequest).start();
                    }
                )
            }
        },
            error => {
                console.log("Login fail with error: " + error);
            }
        );
    }

    googleLoginTask = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            var result = await GoogleSignin.signIn();
            const { user: { name, email, photo, id } } = result;
            this.setState({ firebaseId: id, loginType: 'google' });
            this.fbGmailLoginTask(name, email, photo);
        }
        catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                console.log("SIGNIN CANCELLED >>");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
                console.log("IN_PROGRESS >>");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                console.log("PLAY_SERVICES_NOT_AVAILABLE >>");
            } else {
                // some other error happened
                console.log("Error : " + error.message);
            }
        }
    }

    fbGmailLoginTask = async (name, email, image) => {
        this.setState({
            isLoading: true,
        });
        const fcmToken = await messaging().getToken();
        const { updateProviderDetails } = this.props;
        const { fetchProvidersJobRequests, fetchJobRequestHistory } = this.props;
        if (fcmToken) {
            const userData = {
                "account_type": this.state.accountType,
                "username": name,
                "email": email,
                "image": image,
                "mobile": "",
                "dob": "",
                "fcm_id": fcmToken,
                "type": this.state.loginType
            };
            Axios.post(REGISTER_URL, { data: JSON.stringify(userData) }).then(async responseJson => {
                let status;
                if (responseJson.status === 200 && responseJson.data.createdDate) {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true,
                    });
                    const usersRef = database().ref(`users/${responseJson.data.id}`);
                    await usersRef.once('value', snapshot => {
                        const value = snapshot.val();
                        if (value)
                            status = value.status;
                        else {
                            usersRef.set({ 'status': responseJson.data.status }).then(() => {
                                console.log('status set');
                            }).
                                catch(e => {
                                    console.log(e.message);
                                });
                        }
                    });
                    const id = responseJson.data.id;
                    var providerData = {
                        providerId: responseJson.data.id,
                        name: responseJson.data.username,
                        email: responseJson.data.email,
                        password: responseJson.data.password,
                        imageSource: responseJson.data.image,
                        surname: responseJson.data.surname,
                        mobile: responseJson.data.mobile,
                        services: responseJson.data.services,
                        description: responseJson.data.description,
                        address: responseJson.data.address,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        invoice: responseJson.data.invoice,
                        status: status != undefined ? status : responseJson.data.status,
                        fcmId: responseJson.data.fcm_id,
                        accountType: responseJson.data.account_type,
                        firebaseId: this.state.firebaseId
                    };
                    updateProviderDetails(providerData);
                    //Store data like sharedPreference
                    AsyncStorage.setItem('userId', id);
                    AsyncStorage.setItem('userType', 'Provider');
                    AsyncStorage.setItem('email', email);
                    AsyncStorage.setItem('firebaseId', this.state.firebaseId);
                    fetchJobRequestHistory(id);
                    fetchProvidersJobRequests(this.props, id, "ProHome");
                }
                else {
                    console.log('response data', responseJson.data)
                    if (responseJson.message === "Email not found") {
                        this.setState({
                            isLoading: false,
                        });
                        this.props.navigation.navigate("ProRegisterFB", {
                            "email": email,
                            "name": name,
                            "image": image,
                            "accountType": this.state.accountType
                        });
                    }
                    else {
                        this.leftButtonActon = () => {
                            this.setState({
                                isLoading: false,
                                showDialog: false,
                                dialogType: null
                            });
                        };
                        this.rightButtonAction = () => {
                            this.fbGmailLoginTask(name, email, image);
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
                            dialogDesc: responseJson.message || "Something went wrong, please try again later.",
                            dialogLeftText: 'Cancel',
                            dialogRightText: 'Retry'
                        });
                    }
                }
            })
                .catch((error) => {
                    this.leftButtonActon = () => {
                        this.setState({
                            isLoading: false,
                            showDialog: false,
                            dialogType: null
                        });
                    };
                    this.rightButtonAction = () => {
                        this.fbGmailLoginTask(name, email, image);
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
                        dialogDesc: error.message,
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Retry'
                    });
                })
                .done();
        }
        else {
            this.leftButtonActon = null;
            this.rightButtonAction = () => {
                this.fbGmailLoginTask(name, email, image);
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
                dialogDesc: "Your device has no fcm token, check your internet connection please.",
                dialogLeftText: 'Cancel',
                dialogRightText: 'Ok'
            });
        }
    }

    checkValidation = () => {
        if (this.state.email == '') {
            this.setState({ error: 'Enter valid email' })
        }
        else if (this.state.password == '') {
            this.setState({ error: 'Enter password' })
        }
        else {
            this.authenticateProTask()
        }
    }

    authenticateProTask = async () => {
        const { fetchProvidersJobRequests, fetchJobRequestHistory } = this.props;
        this.setState({
            isLoading: true,
        });
        const fcmToken = await messaging().getToken();
        const { updateProviderDetails } = this.props;
        if (fcmToken) {
            firebaseAuth().signInWithEmailAndPassword(this.state.email, this.state.password).then(result => {
                const { user } = result;
                if (user && typeof user === 'object') {
                    const { _user: { uid } } = user;
                    const data = {
                        "email": this.state.email,
                        "password": this.state.password,
                        "fcm_id": fcmToken
                    };
                    fetch(AUTHENTICATE_URL,
                        {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                        })
                        .then((response) => response.json())
                        .then(async responseJson => {
                            if (responseJson.result) {
                                const usersRef = database().ref(`users/${responseJson.data.id}`);
                                await usersRef.once('value', snapshot => {
                                    const value = snapshot.val();
                                    if (value)
                                        status = value.status;
                                    else {
                                        usersRef.set({ 'status': responseJson.data.status }).then(() => {
                                            console.log('status set');
                                        }).
                                            catch(e => {
                                                console.log(e.message);
                                            });
                                    }
                                });
                                this.setState({
                                    isLoading: false,
                                    isErrorToast: true,
                                });
                                const id = responseJson.data.id;
                                var providerData = {
                                    providerId: responseJson.data.id,
                                    name: responseJson.data.username,
                                    email: responseJson.data.email,
                                    password: responseJson.data.password,
                                    imageSource: responseJson.data.image,
                                    surname: responseJson.data.surname,
                                    mobile: responseJson.data.mobile,
                                    services: responseJson.data.services,
                                    description: responseJson.data.description,
                                    address: responseJson.data.address,
                                    lat: responseJson.data.lat,
                                    lang: responseJson.data.lang,
                                    invoice: responseJson.data.invoice,
                                    status: responseJson.data.status,
                                    fcmId: responseJson.data.fcm_id,
                                    accountType: responseJson.data.account_type,
                                    firebaseId: uid
                                }
                                updateProviderDetails(providerData);
                                //Store data like sharedPreference
                                AsyncStorage.setItem('userId', id);
                                AsyncStorage.setItem('userType', 'Provider');
                                const auth = { email: this.state.email, password: this.state.password };
                                AsyncStorage.setItem('auth', JSON.stringify(auth));
                                AsyncStorage.setItem('firebaseId', uid);
                                fetchJobRequestHistory(id);
                                fetchProvidersJobRequests(this.props, id, "ProHome");
                            }
                            else {
                                this.leftButtonActon = () => {
                                    this.setState({
                                        isLoading: false,
                                        showDialog: false,
                                        dialogType: null
                                    });
                                };
                                this.rightButtonAction = () => {
                                    this.authenticateProTask();
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
                                    dialogDesc: responseJson.message,
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
                                this.authenticateProTask();
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
                                dialogDesc: error.message,
                                dialogLeftText: 'Cancel',
                                dialogRightText: 'Retry'
                            });
                        })
                        .done();
                }
                else {
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
                        dialogTitle: 'OOPS!',
                        dialogDesc: 'Something went wrong, try again later.',
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'OK'
                    });
                }
            }).catch(error => {
                if (error.code === 'auth/user-not-found') {
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
                        dialogTitle: 'OOPS!',
                        dialogDesc: "You've not registered yet, please register first",
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok'
                    });
                }
                else if (error.code === 'auth/wrong-password') {
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
                        dialogTitle: 'OOPS!',
                        dialogDesc: "You entered a wrong password!",
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok'
                    });
                }
                else {
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
                        dialogTitle: 'OOPS!',
                        dialogDesc: 'Something went wrong, try again later.',
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'OK'
                    });
                }
                this.setState({ isLoading: false })
            });
        }
        else {
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
                dialogTitle: 'OOPS!',
                dialogDesc: 'Something went wrong, try again later.',
                dialogLeftText: 'Cancel',
                dialogRightText: 'OK'
            });
        }
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })

    }

    changeDialogVisibility = () => this.setState(prevState => ({ showDialog: !prevState.showDialog }));

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
                <KeyboardAwareScrollView
                    contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', alwaysBounceVertical: true }}
                    keyboardShouldPersistTaps='handled'
                    keyboardDismissMode='on-drag'>

                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ height: 200, width: screenWidth, backgroundColor: white, justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'flex-start', justifyContent: 'center', marginLeft: 5, marginTop: 15, }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, tintColor: black, height: 20, alignSelf: 'center', }}
                                    source={require('../../icons/arrow_back.png')} />
                            </TouchableOpacity>
                            <Image
                                style={{ width: 140, height: 140 }}
                                source={require('../../images/kuchapa_logo.png')}
                                resizeMode="contain" />
                        </View>

                        <View style={styles.logincontainer}>
                            <ShakingText style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
                                {this.state.error}
                            </ShakingText>

                            <View style={styles.textInputView}>
                                <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                    source={require('../../icons/email.png')}></Image>
                                <TextInput
                                    style={{ width: screenWidth - 85, height: 50, marginLeft: 10, color: black }}
                                    placeholder='Email'
                                    value={this.state.email}
                                    onChangeText={(emailInput) => this.setState({ error: '', email: emailInput })}>
                                </TextInput>
                            </View>

                            <View style={[styles.textInputView, { marginTop: 5, }]}>
                                <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                    source={require('../../icons/ic_lock_64dp.png')}></Image>
                                <TextInput
                                    style={{ width: screenWidth - 85, height: 50, marginLeft: 10, color: black }}
                                    placeholder='Password'
                                    value={this.state.password}
                                    secureTextEntry={true}
                                    onChangeText={(passwordInput) => this.setState({ error: '', password: passwordInput })}>
                                </TextInput>
                            </View>

                            <TouchableOpacity style={{ width: screenWidth - 50, marginTop: 10 }}
                                onPress={() => this.props.navigation.navigate("ProForgotPassword")}>
                                <Text style={{ color: black, fontWeight: 'bold', fontSize: 13, marginBottom: 5, alignItems: 'flex-end', justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
                                    Forgot Password
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.buttonContainer}
                                onPress={this.checkValidation}>
                                <Text style={styles.text}>
                                    Login
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text style={{ color: black, fontSize: 13, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }}>
                                Or Login With
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row' }}>

                            <TouchableOpacity style={[styles.buttonFGContainer, { backgroundColor: '#3c599b' }]}
                                onPress={this.facebookLoginTask}>
                                <Image style={{ width: 20, height: 20, }}
                                    source={require('../../icons/facebook.png')} />
                                <Text style={styles.text}>
                                    Facebook
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.buttonFGContainer, { backgroundColor: '#DD4D3B' }]}
                                onPress={this.googleLoginTask}>
                                <Image style={{ width: 20, height: 20 }}
                                    source={require('../../icons/google.png')} />
                                <Text style={styles.text}>
                                    Gmail
                                </Text>
                            </TouchableOpacity>
                            <View>
                            </View>
                        </View>
                        <TouchableOpacity style={{ padding: 5, }}
                            onPress={() => this.props.navigation.navigate("ProRegister", {
                                "accountType": this.state.accountType
                            })}>
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }}>
                                Don't have an account? Sign up
                    </Text>
                        </TouchableOpacity>
                    </View>

                </KeyboardAwareScrollView>
                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        jobsInfo: state.jobsInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchProvidersJobRequests: (props, providerId, navTo) => {
            dispatch(getPendingJobRequestProvider(props, providerId, navTo));
        },
        fetchJobRequestHistory: providerId => {
            dispatch(getAllWorkRequestPro(providerId));
        },
        updateProviderDetails: details => {
            dispatch(updateProviderDetails(details));
        },
        updateProviderAuthToken: token => {
            dispatch(updateProviderAuthToken(token));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FacebookGoogleScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: lightGray
    },
    logincontainer: {
        width: screenWidth - 15,
        height: 275,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: white,
        shadowColor: black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
        borderRadius: 4,
    },
    separator: {
        borderBottomWidth: 0.8,
        borderBottomColor: '#ebebeb',
        marginTop: 5,
        marginBottom: 5
    },
    textInputView: {
        flexDirection: 'row',
        width: screenWidth - 40,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        backgroundColor: white,
        shadowColor: black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    buttonContainer: {
        width: 175,
        height: 40,
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
    buttonFGContainer: {
        width: screenWidth / 2 - 40,
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 5,
        marginBottom: 10,
        marginLeft: 10,
    },
    text: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: white,
        textAlign: 'center',
        alignSelf: 'center',
        alignItems: 'center',
        textAlignVertical: 'center'
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