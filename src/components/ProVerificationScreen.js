
import React, { Component } from 'react';
import {View,StatusBar, Text, StyleSheet, TextInput, Image, TouchableOpacity, 
    ScrollView,Dimensions, ActivityIndicator} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import AsyncStorage from '@react-native-community/async-storage';
import ShakingText from 'react-native-shaking-text';
import firebase from 'react-native-firebase';
import Config from './Config';
import ProviderDetails from './ProviderDetails';
import ProPendingRequest from './ProPendingJobRequest';

const colorPrimary = '#262425';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';

const screenWidth = Dimensions.get('window').width;

const MOBILE_EXISTS_URL = Config.baseURL+'employee/check/mobile'
const PENDING_JOB_PROVIDER = Config.baseURL+"jobrequest/customer_status_check/";

export default class ProVerificationScreen extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            mobile: this.props.navigation.state.params.mobile,
            otpToMatch: this.props.navigation.state.params.otp,
            otp: '',
            error: '',
            timer: 30,
            opacity: 1,
            isLoading: false,
        }
    }   

    componentDidMount(){

        //From ProLoginPhoneScreen
        this.setState({
            mobile: this.props.navigation.state.params.mobile,
            otpToMatch: this.props.navigation.state.params.otp,
        });

        this.interval = setInterval(
          () => this.setState((prevState)=> ({ timer: prevState.timer - 1 })),
          1000
        );
    }

    componentDidUpdate(){
        if(this.state.timer === 0){ 
          clearInterval(this.interval);
          this.setState({
            timer: '', 
            opacity: 0,

        });
        }
    }

    componentWillUnmount(){
        clearInterval(this.interval);
        this.setState({
            timer: '', 
            opacity: 0,
        });
    }

    checkValidation = () => {
        if (this.state.otp == '') {
            this.setState({ error: 'Please enter valid OTP' })
        }
        else if(this.state.otp != this.state.otpToMatch)
        {
            this.setState({error:'OTP does not match'})
        }
        else {
            //Check mobile no. is already register or not
            this.setState({
                isLoading: true
            })

            firebase.messaging().getToken().then((fcmToken) => {

                console.log("ProVerificationFCM ID " + fcmToken);

                if (fcmToken) {

                    const mobileData = {
                        "mobile": this.state.mobile,
                        "fcm_id": fcmToken,
                    }

                    fetch(MOBILE_EXISTS_URL, {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(mobileData)
                    })
                        .then((response) => response.json())
                        .then((responseJson) => {

                            console.log("ProVerificationScreen checkValidation : " + JSON.stringify(responseJson));
                            this.setState({
                                isLoading: false
                            })
                            if (responseJson.result) {
                                const id = responseJson.data.id;

                                //Store data like sharedPreference
                                AsyncStorage.setItem('userId', id);
                                AsyncStorage.setItem('userType', 'Provider');

                                var providerData = {
                                    providerId: responseJson.data.id,
                                    name: responseJson.data.username,
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
                                }
                                ProviderDetails.Provider = providerData;

                                console.log("ProVerificationScreen checkValidation : " + JSON.stringify(ProviderDetails.Provider))

                                this.getPendingJobRequestProvider(id);
                            }
                            else {
                                this.props.navigation.navigate("ProRegister", {
                                    'mobile': this.state.mobile
                                })
                            }
                        })
                        .catch((error) => {
                            alert("Error" + error);
                            this.setState({
                                isLoading: false
                            })
                        });
                }
                else {
                    // user doesn't have a device token yet
                }
            });
        }
    }

    async getPendingJobRequestProvider(providerId)
    {
        await fetch(PENDING_JOB_PROVIDER+providerId , {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
         })
         .then((response) => response.json())
         .then((responseJson) => {
            
            console.log("Response getPendingJobRequestProvider: "+JSON.stringify(responseJson));
            this.setState({
                isLoading: false
            })
            if(responseJson.result)
            {
                const id = responseJson.data.id;

                var jobData = {
                    id: responseJson.data._id,
                    order_id: responseJson.data.order_id,
                    user_id: responseJson.data.customer_details._id,
                    image: responseJson.data.customer_details.image,
                    fcm_id: responseJson.data.customer_details.fcm_id,
                    name: responseJson.data.customer_details.username,
                    mobile: responseJson.data.customer_details.mobile,
                    dob: responseJson.data.customer_details.dob,
                    address: responseJson.data.customer_details.address,
                    lat: responseJson.data.customer_details.lat,
                    lang: responseJson.data.customer_details.lang,
                    service_name: responseJson.data.service_details.service_name,
                    chat_status: responseJson.data.chat_status,
                    status: responseJson.data.status,
                    delivery_address: responseJson.data.delivery_address,
                    delivery_lat: responseJson.data.delivery_lat,
                    delivery_lang: responseJson.data.delivery_lang,
                }
                ProPendingRequest.Request = jobData;
                console.log("PendingJob getPendingJobRequestProvider : "+JSON.stringify( ProPendingRequest.Request))

                this.props.navigation.navigate("ProHome");
            }
            else
            {
                this.props.navigation.navigate("ProHome");
            }
         })
        .catch((error) => {
            this.setState({
                isLoading: false
            })
            alert("Error "+error);
            console.log(JSON.stringify(responseJson));
        });
    }

    render() {
        return (
            <View style = {styles.container}>
                
            <StatusBar barStyle='light-content' backgroundColor='#C5940E' />

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', alwaysBounceVertical: true}}
                        keyboardShouldPersistTaps='always'>
                   <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <View style={{ flex: 0.35, width: screenWidth, backgroundColor: colorYellow, justifyContent: 'center', alignItems: 'center'}}>
                            
                           <TouchableOpacity style ={{width: 20, height: 20, alignSelf: 'flex-start', marginLeft: 15}}
                                    onPress={() => this.props.navigation.goBack()}>
                                    <Image  style ={{width: 20, height: 20}}
                                        source={require('../icons/arrow_back.png')}/>
                            </TouchableOpacity>
                            
                            <Image 
                                style ={{width: 170, height: 170}} 
                                source={require('../images/harfa_logo.png')}/>
                        </View>

                        <View style={styles.logincontainer}>

                            <View>
                                <Text style={{color: colorYellow, fontSize: 18, fontWeight: 'bold', alignItems: 'center', justifyContent: 'center'}}>
                                    Activate your account
                                </Text>
                            </View>

                            <View style={{flexDirection: 'column'}}>                
                                <Text style={{fontSize: 12, alignItems: 'center', justifyContent: 'center', 
                                    textAlign: 'center', marginLeft: 30, marginRight: 30, marginTop: 10, }}>
                                    We're sending an SMS to phone number 
                                </Text>
                                <Text style={{fontSize: 14, alignItems: 'center', justifyContent: 'center', 
                                    fontWeight: 'bold',  textAlign: 'center', marginBottom: 40}}>
                                {this.state.mobile}
                                </Text>
                            </View>

                            <ShakingText style={{color: 'red', fontWeight: 'bold', marginBottom: 10}}>
                                {this.state.error}
                            </ShakingText>

                            <View>
                                <ActivityIndicator
                                    animating={true}
                                    color={colorPrimaryDark}
                                    style={{ opacity: this.state.opacity }}
                                    size="large">
                                </ActivityIndicator>
                                <Text style={{color: 'black', fontWeight: 'bold', textAlign:'center'}}>
                                    {this.state.timer}
                                </Text>

                            </View>

                            <View style={styles.textInputView}>
                                <TextInput 
                                    style={{ width: screenWidth-85, height: 50, color: 'black', fontSize: 16, }}
                                    placeholder='Your 6-digits code'
                                    keyboardType='numeric'
                                    onChangeText={ (otpInput) => this.setState({error:'', otp: otpInput})}
                                    value={this.state.otp}>
                                </TextInput>    
                            </View>

                            <TouchableOpacity style = {styles.buttonContainer}
                                onPress={this.checkValidation}>
                                <Text style={styles.text}>
                                    Verify
                                </Text>
                            </TouchableOpacity>   
                        </View>     
                  </View>
            </ScrollView>
            
            <View style={styles.loaderStyle}>
                {this.state.isLoading && (
                    <ActivityIndicator
                        style={{ height: 80 }}
                        color="#C00"
                        size="large" />
                )}
            </View>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent : 'center',
        alignItems: 'center',  
        backgroundColor: "#E8EEE9" 
     },
    logincontainer: {
        flex: .65,
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
        backgroundColor: 'white', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 }, 
        shadowOpacity: 0.75, 
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10 
    },
    separator:{
        borderBottomWidth: 0.8,
        borderBottomColor: '#ebebeb',
        marginTop: 5,
        marginBottom: 5
    },
    buttonContainer : {
        width: 200,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        marginBottom: 25,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    text: {
        fontSize: 16,
        color: 'white',
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


