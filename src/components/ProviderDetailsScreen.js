import React, { Component } from 'react';
import {View, StyleSheet, Image, Text, TouchableOpacity, Dimensions, ActivityIndicator, Modal,
   Linking, Alert, BackHandler, StatusBar, Platform } from 'react-native';
import { Rating, AirbnbRating } from 'react-native-ratings';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import firebase from 'react-native-firebase';
import Toast, {DURATION} from 'react-native-easy-toast';
import UserDetails from './UserDetails';
import Config from './Config';
import PendingJobRequest from './PendingJobRequest';
import WaitingDialog from './WaitingDialog';
import OnlineUsers from './OnlineUsers';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 
const colorGreen = 'green';
const colorRed = 'red';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const BOOKING_REQUEST = Config.baseURL+"jobrequest/addjobrequest";
const PRO_GET_PROFILE = Config.baseURL+"employee/";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const database = firebase.database();

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

export default class ProviderDetailsScreen extends Component {

    constructor(props) {
      super(props)
    
      this.state = {
        providerId: this.props.navigation.state.params.providerId,
        name: this.props.navigation.state.params.name,
        surname: this.props.navigation.state.params.surname,
        image: this.props.navigation.state.params.image,
        mobile: this.props.navigation.state.params.mobile,
        avgRating: this.props.navigation.state.params.avgRating,
        distance: this.props.navigation.state.params.distance,
        address: this.props.navigation.state.params.address,
        description: this.props.navigation.state.params.description,
        status: this.props.navigation.state.params.status,
        fcmId: this.props.navigation.state.params.fcmId,
        accountType: this.props.navigation.state.params.accountType,
        serviceName: this.props.navigation.state.params.serviceName,
        serviceId: this.props.navigation.state.params.serviceId,
        requestStatus: '',
        isJobAccepted: false,
        isErrorToast: false,
        isLoading: false,
       
        timer: null,
        minutes_Counter: '04',
        seconds_Counter: '59',

        title: '',
        body: '',
        data: '',
      }
      this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

  requestForBooking = () => {

      if(UserDetails.User.lang == "")
      {
        this.setState({
          isErrorToast: true,
        })
        this.showToast('Please update address first')
        //ToastAndroid.show("Please update address", ToastAndroid.SHORT);
      }
      else if(UserDetails.User.mobile == '')
      {
        this.setState({
          isErrorToast: true,
        })
        this.showToast('Please update mobile first')
        //ToastAndroid.show("Please update your mobile number", ToastAndroid.SHORT);
      }
      else if(this.state.status == '0')
      {
        this.setState({
          isErrorToast: true,
        })
        //ToastAndroid.show("Service provider is Offline", ToastAndroid.SHORT);
        this.showToast('Service provider is Offline');
      }
      else if(PendingJobRequest.Request.order_id != "")
      {
        Alert.alert(  
          "JOB REQUEST ALERT",  
          "Can't book another request, untill any ONGOING Request will not complete",  
          [  
            {  
              // text: 'Cancel',  
              // onPress: () => console.log('Cancel Pressed'),  
              // style: 'cancel',  
            },  
            {
              text: 'OK', 
              onPress: () => this.props.navigation.goBack(),
            },  
          ]  
        );  
      }
      else
      {
        this.setState({
          requestStatus: "Request Sending...",
          isLoading: true
        })
  
        const data = {
          'user_id': UserDetails.User.userId,
          'employee_id': this.state.providerId,
          'service_id': this.state.serviceId,
          'delivery_address': UserDetails.User.address,
          'delivery_lat' : UserDetails.User.lat,
          'delivery_lang': UserDetails.User.lang,
          'notification': {
            "fcm_id": this.props.navigation.state.params.fcmId,
            "title": "Booking Request",
            "body": 'A booking request from ' + UserDetails.User.username,
            "data": {
              userId: UserDetails.User.userId,
              serviceName: this.state.serviceName,
              delivery_address: UserDetails.User.address,
              delivery_lat : UserDetails.User.lat,
              delivery_lang: UserDetails.User.lang,
            },
          } 
        }
        console.log("SEND REQUEST : "+JSON.stringify(data));
  
        fetch(BOOKING_REQUEST, {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
          .then((response) => response.json())
          .then((responseJson) => {
            console.log("Response : " + JSON.stringify(responseJson))
            if (responseJson.result) {
              this.interval = setInterval(() => {

                var num = (Number(this.state.seconds_Counter) - 1).toString(),
                  count = this.state.minutes_Counter;

                if (Number(this.state.seconds_Counter) == 0) {
                  count = (Number(this.state.minutes_Counter) - 1).toString();
                  num = '59';
                }

                this.setState({
                  minutes_Counter: count.length == 1 ? '0' + count : count,
                  seconds_Counter: num.length == 1 ? '0' + num : num
                });
              }, 1000);

              this.setState({
                requestStatus: "Waiting for acceptance...",
                isLoading: false,
              })
            }
            else {
              if(responseJson.message == 'Already Exist')
              {
                Alert.alert(  
                  "JOB REQUEST ALERT",  
                  "Can't book another request, untill any ONGOING Request will not complete",  
                  [  
                    {  
                      // text: 'Cancel',  
                      // onPress: () => console.log('Cancel Pressed'),  
                      // style: 'cancel',  
                    },  
                    {
                      text: 'OK', 
                      onPress: () => this.props.navigation.goBack(),
                    },  
                  ]  
                );  
              }
              else if(responseJson.message == 'Service provider busy')
              {
                Alert.alert(  
                  "BUSY",  
                  "Service provider is busy. Book another service provider",  
                  [  
                    {  
                      // text: 'Cancel',  
                      // onPress: () => console.log('Cancel Pressed'),  
                      // style: 'cancel',  
                    },  
                    {
                      text: 'OK', 
                      onPress: () => this.props.navigation.goBack(),
                    },  
                  ]  
                );  
              }
              else if(responseJson.message == 'Service provider is offline')
              {
                Alert.alert(  
                  "OFFLINE",  
                  "Service provider is offline. Book another service provider",  
                  [  
                    {  
                      // text: 'Cancel',  
                      // onPress: () => console.log('Cancel Pressed'),  
                      // style: 'cancel',  
                    },  
                    {
                      text: 'OK', 
                      onPress: () => this.props.navigation.goBack(),
                    },  
                  ]  
                );  
              }
              else if(responseJson.message == 'No Response')
              {
                Alert.alert(  
                  "No Response",  
                  "Check your internet connection, may be it too slow",  
                  [  
                    {  
                      // text: 'Cancel',  
                      // onPress: () => console.log('Cancel Pressed'),  
                      // style: 'cancel',  
                    },  
                    {
                      text: 'OK', 
                      onPress: () => this.props.navigation.goBack(),
                    },  
                  ]  
                );  
              }
              else
              {
                //ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
                this.showToast('Something went wrong');
              }
              clearInterval(this.interval);
                this.setState({
                  isLoading: false,
                  minutes_Counter: '04',
                  seconds_Counter: '59',
                  requestStatus: 'No Response',
                });
            }
          })
          .catch((error) => {
            console.log("Error >>> " + error);
            this.setState({
              timer: null,
              requestStatus: 'No Response',
              isLoading: false
            });
            //ToastAndroid.show("Something went wrong", ToastAndroid.show);
            this.showToast('Something went wrong');
          })
      }
  } 

  componentDidUpdate(){

      console.log(this.state.minutes_Counter+" : "+this.state.seconds_Counter);
      if(this.state.minutes_Counter == '00'){ 
        if(this.state.seconds_Counter == '00')
        {
          clearInterval(this.interval);
          this.setState({
            minutes_Counter: '04',
            seconds_Counter: '59',
            requestStatus: 'No Response',
        });
        }
      }
  }

  componentDidMount(){
    const onlineUsers = OnlineUsers.Users;

    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    const { providerId } = this.state;
    const userRef = database.ref(`users/${providerId}`);

    userRef.on('child_changed', result => {
        console.log('something changed')
        if (result.key === "status" && providerId) 
            if (onlineUsers[providerId] && result.val() === '1') this.setState({status: onlineUsers[providerId].status});
            else this.setState({status: result.val()});
        else console.log('provider id unavailable')
    });

    userRef.once('value', data => {
        if (data) {
            const { status } = data.val();
            if (providerId) {
                if (onlineUsers[providerId] ) {
                    console.log('user in api')
                    if (status === onlineUsers[providerId].status) this.setState({status: onlineUsers[providerId].status});
                    else {
                        this.setState({status: status });
                    }
                }
            }
        }
    });
    
    /*firebase.notifications().onNotification((notification) => {

      const { title, body, data } = notification;

      console.log('Notification >>> ', notification);
      console.log("Title, body  data >>> " + title + " >>>" + body+ " >>> "+JSON.stringify(data));

      if (title == "Chat Request Accepted") {
        this.setState({
          requestStatus: title,
          title: title, 
          body: body,
          data: data,
        })

        var providerData = JSON.parse(data.ProviderData);

        var pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: providerData.ProviderId,
          image: providerData.imageSource,
          fcm_id: providerData.fcmId,
          name: providerData.name,
          surName: providerData.surname,
          mobile: providerData.mobile,
          description: providerData.description,
          address: providerData.address,
          lat: providerData.lat,
          lang: providerData.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        }
        PendingJobRequest.Request = pendingJobData;
        //ToastAndroid.show("Chat Request Accepted", ToastAndroid.SHORT);
        //this.showToast('Chat Request Accepted');
        Alert.alert(  
          "Accepted !",  
          "Chat Request Accepted",  
          [  
            {  
              // text: 'Cancel',  
              // onPress: () => console.log('Cancel Pressed'),  
              // style: 'cancel',  
            },  
            {
              text: 'OK', 
              onPress: () => console.log("OK"),
            },  
          ]  
        );  
      }
      else if(title == "Chat Request Rejected")
      {
        this.setState({
          requestStatus: title,
          title: title, 
          body: body,
          data: data,
          isJobAccepted: false,
        })
        this.showRejectionAlert("CHAT REQUEST REJECTED", "Service provider is rejected your request.")
      }
      else if(title == "No Response")
      {
        this.setState({
          requestStatus: title,
          title: title, 
          body: body,
          data: data,
        })
        var pendingJobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address: '',
          delivery_lat: '',
          delivery_lang: '',
        }
        PendingJobRequest.Request = pendingJobData;
        this.showRejectionAlert("No RESPONSE", "Service provider not responded to your request. Please try again later")
      }
      else if(title == "Job Accepted")
      {
        this.setState({
          isJobAccepted: true
        })       
        var pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: data.ProviderId,
          image: data.image,
          fcm_id: data.fcmId,
          name: data.name,
          surName: data.surname,
          mobile: data.mobile,
          description: data.description,
          address: data.address,
          lat: data.lat,
          lang: data.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        }
        PendingJobRequest.Request = pendingJobData;
      }
      else if(title == "Job Rejected")
      {
        this.setState({
          isJobAccepted: false
        })
        var pendingJobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address: '',
          delivery_lat: '',
          delivery_lang: '',
        }
        PendingJobRequest.Request = pendingJobData;
        this.showRejectionAlert("JOB REJECTED", "Your job has been rejected. Please try again later")
      }
      else if(title == "Job Completed")
      {
        var jobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address:'',
          delivery_lat: '',
          delivery_lang: '',
      }
      PendingJobRequest.Request = jobData;
      this.showRejectionAlert("JOB COMPLETED", "Your job has been completed.")
      }
    });*/
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  handleBackButtonClick() {
    this.props.navigation.goBack();
    return true;
  }

  goToChatScreen = () => {

    data = this.state.data;

    const providerData = JSON.parse(data.ProviderData);

    console.log("Data : "+JSON.stringify(data));
    console.log("ProviderData : "+JSON.stringify(providerData));

    var pendingJobData = {
      id: data.mainId,
      order_id: data.orderId,
      employee_id: providerData.providerId,
      image: providerData.imageSource,
      fcm_id: providerData.fcmId,
      name: providerData.name,
      surName: providerData.surname,
      mobile: providerData.mobile,
      description: providerData.description,
      address: providerData.address,
      lat: providerData.lat,
      lang: providerData.lang,
      service_name: this.state.serviceName,
      chat_status : data.chat_status,
      status : data.status,
      delivery_address: UserDetails.User.address,
      delivery_lat: UserDetails.User.lat,
      delivery_lang: UserDetails.User.lang,
    }
    PendingJobRequest.Request = pendingJobData;

    console.log("goToChatScreen ProviderInfo : " + JSON.stringify(PendingJobRequest.Request));

    this.props.navigation.navigate("Chat", {
      'titlePage': "ProviderDetails",
      'isJobAccepted': this.state.isJobAccepted,
    })
  }

  goToMapDirection = () => 
  {
    this.props.navigation.navigate("MapDirection",{
      titlePage: "ProviderDetails"
    })
  }

  callPhoneTask = () => {
    Linking.openURL('tel:'+this.state.mobile)
  }

  showRejectionAlert = (title, message) => 
  {
    Alert.alert(  
      title,  
      message,  
      [  
        {  
          // text: 'Cancel',  
          // onPress: () => console.log('Cancel Pressed'),  
          // style: 'cancel',  
        },  
        {
          text: 'OK', 
          onPress: () => this.props.navigation.goBack(),
        },  
      ]  
    );  
  }

  showToast = (message) => {
    this.refs.toast.show(message);
  }

  changeWaitingDialogVisibility = (bool) => {
    this.setState({
      isLoading: false
    })
  }

  render() {
      console.log(this.state.status)
    return (
      <View style={styles.container}>

        <StatusBarPlaceHolder />

        <View style={styles.header}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ width: 35, height: 35, justifyContent: 'center', marginLeft: 5, }}
              onPress={() => this.props.navigation.goBack()}>
              <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                source={require('../icons/arrow_back.png')} />
            </TouchableOpacity>

            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 5 }}>
              Provider Details
              </Text>
          </View>
        </View>

        <View style={{width: '100%', height: 50, flexDirection: 'row', backgroundColor: colorYellow, shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,}}>

          <View style={styles.textView}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', textAlignVertical: 'center' }}>
              {this.state.name}
            </Text>
          </View>

          <View style={styles.onlineOfflineView}>
            <View style={[styles.onlineOfflineText, { backgroundColor: this.state.status === '1' ? colorGreen : colorRed }]}>
              <Text style={{color: 'white', fontWeight: 'bold',}}>
                {this.state.status === '1' ? "ONLINE" : "OFFLINE"}</Text>
            </View>
          </View>
        </View>

        <View style={{
          width: screenWidth, flexDirection: 'row', backgroundColor: 'white', alignContent: 'center',
          paddingTop: 25, paddingBottom: 25, paddingLeft: 5, paddingRight: 5 }}>

          <View style={{ flexDirection: 'column', marginLeft: 10 }}>
            <Image style={{ width: 60, height: 60, borderRadius: 100, alignSelf: 'center' }}
              source={{ uri: this.state.image }} />

            <View style={{ backgroundColor: 'white', marginTop: 5 }}>
              <AirbnbRating
                type='custom'
                ratingCount={5}
                defaultRating={this.state.avgRating}
                size={10}
                ratingBackgroundColor={colorBg}
                showRating={false}
                onFinishRating={this.ratingCompleted} />
            </View>
          </View>

          <View style={{ width: screenWidth - 120, flexDirection: 'column', marginLeft: 10, }}>
            <Text>
              Account Type : {this.state.accountType}
            </Text>
            <Text>
              <Text style={{ fontWeight: 'bold' }}>{this.state.distance + " Km"}</Text>
              <Text> away from you</Text>
            </Text>
            <Text>
              {this.state.address}
            </Text>
            <Text style={{ borderRadius: 5, borderColor: colorGray, borderWidth: 1, padding: 5, marginTop: 5 }}>{this.state.description}</Text>
          </View>
        </View>

        {(this.state.requestStatus == '' || this.state.requestStatus == 'No Response') &&
          <View style={styles.bottomView}>
            <TouchableOpacity style={styles.buttonContainer}
              onPress={this.requestForBooking}>
              <Text style={styles.text}>
                Request
                </Text>
            </TouchableOpacity>
          </View>
        }

        {this.state.requestStatus == 'Chat Request Accepted' &&
          <View style={styles.bottomView}>
            <TouchableOpacity style={styles.buttonContainer}
              onPress={() => this.goToChatScreen()}>
              <Text style={styles.text}>
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonContainer}
              onPress={this.callPhoneTask} >
              <Text style={styles.text}>
                Call
              </Text>
            </TouchableOpacity>

            {this.state.isJobAccepted && (
              <View style={{
                flexDirection: 'column', width: screenWidth, height: 50, backgroundColor: 'white',
                borderRadius: 2, alignItems: 'center', justifyContent: 'flex-start',
              }}>
                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                <TouchableOpacity style={styles.textViewDirection}
                  onPress={this.goToMapDirection}>
                  <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                    source={require('../icons/mobile_gps.png')} />
                  <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                    Track Service Provider
              </Text>
                  <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                    source={require('../icons/right_arrow.png')} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }

        {this.state.requestStatus == 'Request Sending...' || this.state.requestStatus == 'Waiting for acceptance...' &&
          <View style={styles.loaderStyle}>
            <ActivityIndicator
              style={{ height: 55, width: 55, alignSelf: 'flex-start', alignContent: 'flex-start', marginLeft: 10 }}
              color={colorYellow}
              size="large" />

            <Text style={{ color: 'black', fontSize: 15, fontWeight: 'bold', textAlignVertical: 'center', alignSelf: 'center' }}>
              {this.state.requestStatus}
            </Text>

            <View style={styles.timerView}>
              <View style={[styles.timerTextView, {backgroundColor: colorGreen } ]}>
                <Text style={[styles.timerText ]}>
                  {this.state.minutes_Counter} : {this.state.seconds_Counter}</Text>
              </View>
            </View>
          </View>
        }
        <Toast
          ref="toast"
          style={{ backgroundColor: this.state.isErrorToast == true ? 'red' : 'green' }}
          position='bottom'
          positionValue={200}
          fadeInDuration={750}
          fadeOutDuration={1000}
          opacity={0.8}
          textStyle={{ color: 'white' }}/>

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
      backgroundColor: colorBg,
    },
    header: {
      width: '100%',
      height: 50,
      flexDirection: 'row',
      backgroundColor: colorYellow,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 5,
      elevation: 5,
    },
    mainContainer: {
      backgroundColor: 'white',
      margin: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 5,
      elevation: 5,
      backgroundColor: 'white',
      borderRadius: 2,
    },
    text: {
      fontSize: 16,
      color: 'white',
      textAlign: 'center',
      justifyContent: 'center',
    },
    textView: {
      height: 50, 
      justifyContent: 'center',
      alignItems: 'center', 
      marginLeft: 20,
  },

  onlineOfflineView: {
      flex: 1,
      height: 50,
      textAlignVertical: 'center',
      color: 'white',
      alignContent: 'center',
      justifyContent: 'center',
  },
  onlineOfflineText: {
      width: 90,
      textAlignVertical: 'center',
      textAlign: 'center',
      alignSelf: 'flex-end',
      paddingLeft: 15,
      paddingRight: 15,
      paddingTop: 8,
      paddingBottom: 8,
      borderRadius: 100,
      marginRight: 20,
  },
  timerView: {
    flex: 1,
    height: 65,
    textAlignVertical: 'center',
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
  },
  timerTextView: {
    width: 75,
    textAlignVertical: 'center',
    alignSelf: 'flex-end',
    padding: 10,
    borderRadius: 200,
    marginRight: 20,
  },
  timerText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontWeight: 'bold',
    color: 'white',

},
  bottomView: {
    width: screenWidth,
    flexDirection: 'column',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.75,
    shadowRadius: 5, 
    elevation: 5,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: screenWidth-60,
    paddingTop: 10,
    backgroundColor: '#000000',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: colorYellow,
    borderWidth: 2,
    marginBottom: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: 10,
  },
  loaderStyle: {
    width: screenWidth,
    height: 65,
    flexDirection: 'row',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.75,
    shadowRadius: 5, 
    elevation: 5,
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  }, 
});
  
