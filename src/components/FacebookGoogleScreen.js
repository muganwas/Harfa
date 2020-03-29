import React, { Component } from 'react';
import { View, StatusBar, Text, StyleSheet, Image, TouchableOpacity, TextInput, Modal,
    Dimensions, ActivityIndicator, Alert, ToastAndroid, Platform, BackHandler
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import ShakingText from 'react-native-shaking-text';
import AsyncStorage from '@react-native-community/async-storage';
import 'react-native-gesture-handler';
import firebaseMessaging from 'react-native-firebase';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';
import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';
import Config from './Config';
import UserDetails from './UserDetails';
import PendingJobRequest from './PendingJobRequest';
import WaitingDialog from './WaitingDialog';
import Axios from 'axios';

//const colorPrimary = '#262425';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';

const screenWidth = Dimensions.get('window').width;
const REGISTER_URL = Config.baseURL + "users/register/create";
const PENDING_JOB_CUSTOMER = Config.baseURL + "jobrequest/user_status_check/";
const AUTHENTICATE_URL = Config.baseURL + 'users/authenticate'

var that;

responseFbCallbackCustomer = ((error, result) => {
    if (error) {
        console.log("Error : " + JSON.stringify(result));
    }
    else {
        console.log("Result Customer : " + JSON.stringify(result));
        console.log("Customer Email : " + result.email);
        that.fbGoogleLoginCustomerTask(result.name, result.email, result.picture.data.url)
    }
})

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
    return (
        Platform.OS === 'ios' ?
        <View style={{
            width: "100%",
            height: STATUS_BAR_HEIGHT,
            backgroundColor: colorPrimaryDark}}>
            <StatusBar
                barStyle="light-content"/>
        </View>
        :
        <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} /> 
    );
}

export default class FacebookGoogleScreen extends Component {

    constructor(props) {
        super(props)

        this.state = {
            accountType: this.props.navigation.state.params.accountType,
            email: '',
            password: '',
            opacity: 1,
            isLoading: false,
            isErrorToast: ''
        }
        that = this;
        this.facebookLoginTask = this.facebookLoginTask.bind(this);
        this.fbGoogleLoginCustomerTask = this.fbGoogleLoginCustomerTask.bind(this);
        this.checkValidation = this.checkValidation.bind(this);

        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    }

    componentDidMount() {
        GoogleSignin.configure({});
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        this.props.navigation.goBack();
        return true;
    }

    async facebookLoginTask() {

        LoginManager.logInWithPermissions(["public_profile", "email"]).then(function (result) {
            if (result.isCancelled) {
                console.log("Login cancelled");
            } else {
                console.log("Result " + JSON.stringify(result));
                console.log("Login success: " + result.grantedPermissions.toString());

                AccessToken.getCurrentAccessToken().then(
                    (data) => {
                        const infoRequest = new GraphRequest(
                            '/me?fields=email,name,picture',
                            null,
                            responseFbCallbackCustomer
                        );
                        // Start the graph request.
                        new GraphRequestManager().addRequest(infoRequest).start();
                    }
                )
            }
        },
            function (error) {
                console.log("Login fail with error: " + error);
            }
        );
    }

    async googleLoginTask() {
        try {
            await GoogleSignin.hasPlayServices();
            var result = await GoogleSignin.signIn();
            console.log("UserInfo >> " + JSON.stringify(result));

            this.fbGoogleLoginCustomerTask(result.user.name, result.user.email, result.user.photo)
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

    fbGoogleLoginCustomerTask = (name, email, image) => {

        this.setState({
            isLoading: true,
        })

        firebaseMessaging.messaging().getToken().then((fcmToken) => {
            console.log("RegisterTask FCM ID " + fcmToken);

            if (fcmToken) {

                const userData = {
                    "acc_type": this.state.accountType,
                    "username": name,
                    "email": email,
                    "image": image,
                    "mobile": "",
                    "dob": "",
                    "fcm_id": fcmToken,
                    "type" : "google"
                }
                console.log("Data: " + JSON.stringify(userData));

                Axios.post(REGISTER_URL, { data: JSON.stringify(userData)})
                    .then(responseJson => {
                        // console.log("Response Register")
                        console.log(responseJson);
                        if (responseJson.status === 200 && responseJson.data.createdDate) {
                            this.setState({
                                isLoading: false,
                                isErrorToast: true,
                            })
                            const id = responseJson.data.id;

                            var userData = {
                                userId: responseJson.data.id,
                                accountType: responseJson.data.acc_type,
                                email: responseJson.data.email,
                                password: responseJson.data.password,
                                username: responseJson.data.username,
                                image: responseJson.data.image,
                                mobile: responseJson.data.mobile,
                                dob: responseJson.data.dob,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                fcmId: responseJson.data.fcm_id,
                            }
                            UserDetails.User = userData;

                            //Store data like sharedPreference
                            AsyncStorage.setItem('userId', id);
                            AsyncStorage.setItem('userType', 'User');

                            this.getPendingJobRequest(id);
                        }
                        else {
                            console.log("Response Else ");
                            this.setState({
                                isLoading: false,
                            })
                            Alert.alert(
                                "OOPS !",
                                responseJson.data.message,
                                [
                                    {
                                        text: 'Cancel',
                                        onPress: () => console.log('Cancel Pressed'),
                                    },
                                    {
                                        text: 'Retry',
                                        onPress: () => this.fbGoogleLoginCustomerTask(name, email, image),
                                    },
                                ]
                            );
                        }
                    })
                    .catch((error) => {
                        console.log("Error :" + error);
                        this.setState({
                            isLoading: false,
                        })
                        Alert.alert(
                            "OOPS !",
                            "Something went wrong, Try again later",
                            [
                                {
                                    text: 'Cancel',
                                    onPress: () => console.log('Cancel Pressed'),
                                },
                                {
                                    text: 'Retry',
                                    onPress: () => this.fbGoogleLoginCustomerTask(name, email, image),
                                },
                            ]
                        );
                    })
                    .done()
            }
        })
    }

    checkValidation() {
        console.log("CheckValidation");
        if (this.state.email == '') {
            this.setState({ error: 'Entrez une adresse email valide' })
        }
        else if(this.state.password == '') {
            this.setState({error: 'Entrer le mot de passe'})
        }
        else
        {
            console.log("Else");
            this.authenticateTask()
        }
    }

    authenticateTask = () => {

        console.log("authenticateTask")

        this.setState({
            isLoading: true,
        })

        firebaseMessaging.messaging().getToken().then((fcmToken) => {
            console.log("RegisterTask FCM ID " + fcmToken);

            if (fcmToken) {

                const data = {
                    "email": this.state.email,
                    "password": this.state.password,
                    "fcm_id": fcmToken
                }
                console.log("Data: " + JSON.stringify(data));

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
                    .then((responseJson) => {
                        console.log("Response Login >> " + JSON.stringify(responseJson));
                        if (responseJson.result) {
                            this.setState({
                                isLoading: false,
                                isErrorToast: true,
                            })
                            const id = responseJson.data.id;

                            var userData = {
                                userId: responseJson.data.id,
                                accountType: responseJson.data.acc_type,
                                email: responseJson.data.email,
                                password: responseJson.data.password,
                                username: responseJson.data.username,
                                image: responseJson.data.image,
                                mobile: responseJson.data.mobile,
                                dob: responseJson.data.dob,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                fcmId: responseJson.data.fcm_id,
                            }
                            UserDetails.User = userData;

                            //Store data like sharedPreference
                            AsyncStorage.setItem('userId', id);
                            AsyncStorage.setItem('userType', 'User');

                            this.getPendingJobRequest(id);
                        }
                        else {
                            console.log("Response Else ");
                            this.setState({
                                isLoading: false,
                            })
                            Alert.alert(
                                "OOPS !",
                                responseJson.message,
                                [
                                    {
                                        text: 'Annuler',
                                        onPress: () => console.log('Cancel Pressed'),
                                    },
                                    {
                                        text: 'Retenter',
                                        onPress: () => this.authenticateTask(),
                                    },
                                ]
                            );
                        }
                    })
                    .catch((error) => {
                        console.log("Error :" + error);
                        this.setState({
                            isLoading: false,
                        })
                        Alert.alert(
                            "OUPS !",
                            "Une erreur s'est produite, veuillez réessayer plus tard",
                            [
                                {
                                    text: 'Annuler',
                                    onPress: () => console.log('Cancel Pressed'),
                                },
                                {
                                    text: 'Retenter',
                                    onPress: () => this.authenticateTask(),
                                },
                            ]
                        );
                    })
                    .done()
            }
        })
    }

    async getPendingJobRequest(userId) {
        this.setState({
            isLoading: true
        })
        await fetch(PENDING_JOB_CUSTOMER + userId, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {

                console.log("Response getPendingJobRequest: " + JSON.stringify(responseJson));
                this.setState({
                    isLoading: false
                })
                if (responseJson.result) {
                    const id = responseJson.data.id;

                    var jobData = {
                        id: responseJson.data._id,
                        order_id: responseJson.data.order_id,
                        employee_id: responseJson.data.employee_details._id,
                        image: responseJson.data.employee_details.image,
                        fcm_id: responseJson.data.employee_details.fcm_id,
                        name: responseJson.data.employee_details.username,
                        surName: responseJson.data.employee_details.surname,
                        mobile: responseJson.data.employee_details.mobile,
                        description: responseJson.data.employee_details.description,
                        address: responseJson.data.employee_details.address,
                        lat: responseJson.data.employee_details.lat,
                        lang: responseJson.data.employee_details.lang,
                        service_name: responseJson.data.service_details.service_name,
                        chat_status: responseJson.data.chat_status,
                        status: responseJson.data.status,
                        delivery_address: responseJson.data.delivery_address,
                        delivery_lat: responseJson.data.delivery_lat,
                        delivery_lang: responseJson.data.delivery_lang,
                    }
                    PendingJobRequest.Request = jobData;

                    console.log("PendingJob getPendingJobRequest : " + JSON.stringify(PendingJobRequest.Request))

                    this.props.navigation.navigate("Home");
                    
                }
                else {
                    this.props.navigation.navigate("Home"); 
                }
            })
            .catch((error) => {
                this.setState({
                    isLoading: false
                })
                alert("Error " + error);
                console.log(JSON.stringify(responseJson));
            });
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBarPlaceHolder/>

                <KeyboardAwareScrollView
                    contentContainerStyle={{justifyContent: 'center', alignItems: 'center', alwaysBounceVertical: true }}
                    keyboardShouldPersistTaps='handled'
                    keyboardDismissMode='on-drag'>

                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ height: 200, width: screenWidth, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'flex-start', justifyContent: 'center', marginLeft: 5, marginTop: 15,}}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center', }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>
                            <Image
                                style={{ width: 170, height: 170 }}
                                source={require('../images/harfa_logo.png')} />
                        </View>

                        <View style={styles.logincontainer}>

                            <ShakingText style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
                                {this.state.error}
                            </ShakingText>

                            <View style={styles.textInputView}>
                                <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                    source={require('../icons/email.png')}></Image>
                                <TextInput style={{ width: screenWidth - 85, height: 50, marginLeft: 10 }}
                                    placeholder='Email'
                                    value={this.state.email}
                                    onChangeText={(emailInput) => this.setState({email: emailInput})}>
                                </TextInput>
                            </View>

                            <View style={[styles.textInputView, { marginTop: 5, }]}>
                                <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                    source={require('../icons/ic_lock_64dp.png')}></Image>
                                <TextInput style={{ width: screenWidth - 85, height: 50, marginLeft: 10 }}
                                    placeholder='Mot de passe'
                                    value={this.state.password}
                                    secureTextEntry={true}
                                    onChangeText={(passwordInput) => this.setState({ error: '', password: passwordInput })}>
                                </TextInput>
                            </View>

                            <TouchableOpacity style={{ width: screenWidth - 50, marginTop: 10 }}
                                onPress={() => this.props.navigation.navigate("ForgotPassword")}>
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13, marginBottom: 5, alignItems: 'flex-end', justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
                                    Mot de passe oublié?
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.buttonContainer}
                                onPress={this.checkValidation}>
                                <Text style={styles.text}>
                                    Se connecter
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text style={{ color: 'black', fontSize: 13, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }}>
                                Ou connectez-vous avec
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row' }}>

                            <TouchableOpacity style={[styles.buttonFGContainer, { backgroundColor: '#3c599b' }]}
                                onPress={this.facebookLoginTask.bind(this)}>
                                <Image style={{ width: 20, height: 20, }}
                                    source={require('../icons/facebook.png')} />
                                <Text style={styles.text}>
                                    Facebook
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.buttonFGContainer, { backgroundColor: '#DD4D3B' }]}
                                onPress={this.googleLoginTask.bind(this)}>
                                <Image style={{ width: 20, height: 20 }}
                                    source={require('../icons/google.png')} />
                                <Text style={styles.text}>
                                    Gmail
                                </Text>
                            </TouchableOpacity>
                        <View>
                    </View>
                </View>
                    <TouchableOpacity style={{padding: 5,}}
                        onPress={()=> this.props.navigation.navigate("Register", {
                            "accountType": this.state.accountType
                        })}>
                        <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 13, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }}>
                            Vous n'avez pas de compte? S'inscrire
                        </Text>
                    </TouchableOpacity>
               </View>

            </KeyboardAwareScrollView>

                {/* {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )} */}
                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#E8EEE9"
    },
    logincontainer: {
        width: screenWidth - 15,
        height: 275,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        borderRadius: 2,
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
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    buttonContainer: {
        width: 175,
        height: 45,
        backgroundColor: '#000000',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonFGContainer: {
        width: screenWidth / 2 - 30,
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
        color: 'white',
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

