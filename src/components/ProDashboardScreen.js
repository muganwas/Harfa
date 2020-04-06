
import React, { Component } from 'react';
import {
    Text, StyleSheet, View, Image, ActivityIndicator, Dimensions, FlatList, TouchableOpacity, 
    ScrollView, Modal, Animated, BackHandler, RefreshControl, StatusBar, Platform} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import { createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import { DrawerActions } from 'react-navigation-drawer';
import WaitingDialog from './WaitingDialog';
import RNExitApp from 'react-native-exit-app';
import firebase from 'react-native-firebase';
import LinearGradient from 'react-native-linear-gradient';
import Toast, { DURATION } from 'react-native-easy-toast';
import ReviewDialog from './ReviewDialog';
import ProChatScreen from './ProChatScreen';
import ProChatAcceptScreen from './ProChatAcceptScreen';
import ProMapDirectionScreen from './ProMapDirectionScreen';
import ProAllMessageScreen from './ProAllMessageScreen'
import ProAcceptRejectJobScreen from './ProAcceptRejectJobScreen';
import ProviderDetails from './ProviderDetails';
import Config from './Config';
import ProPendingJobRequest from './ProPendingJobRequest';
import ProBookingScreen from './ProBookingScreen';
import ProBookingDetailsScreen from './ProBookingDetailsScreen';
import ProChatAfterBookingDetailsScreen from './ProChatAfterBookingDetailsScreen';
import OnlineUsers from './OnlineUsers';
import NetInfo from "@react-native-community/netinfo";
import Notifications from './Notifications';
import Hamburger from './ProHamburger';

const socket = Config.socket;

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const PRO_INFO_UPDATE = Config.baseURL + "employee/";
const BOOKING_HISTORY = Config.baseURL + 'jobrequest/employee_request/';
const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
const RECENT_USER = Config.baseURL + 'jobrequest/usergroupby/';
const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
const ASK_FOR_REVIEW = Config.baseURL + "notification/addreviewrequest";
const database = firebase.database();

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

class ProDashBoardScreen extends Component {

    constructor(props) {
        super(props)

        this.state = {
            isLoading: true,
            isErrorToast: false,
            mainId: '',
            reviewData: '',
            width: Dimensions.get('window').width,
            status: ProviderDetails.Provider.status == '1' ? "ONLINE" : "OFFLINE",
            availBackground: ProviderDetails.Provider.status == '1' ? 'green' : 'red',
            dataSource: [],
            dataUserSource: [],
            dataWorkSource: [],
            isDialogLogoutVisible: false,
            isRecentMessage: false,
            isWorkRequest: false,
            isRecentUser: false,
            isReviewDialogVisible: false,
            rating: '3',
            review: '',
            refreshing: false,
            pause: false,
            backClickCount: 0,
            online: false,
            connectivityAvailable: false
        }
        this.springValue = new Animated.Value(100);
        this.goToProMapDirection = this.goToProMapDirection.bind(this)

        console.log("OrderId >>> " + ProPendingJobRequest.Request.order_id);
    }

    //Get All Bookings
    async componentDidMount() {
        console.log('setting listeners...')
        const { navigation } = this.props;
        NetInfo.addEventListener(state => {
            if (!state.isConnected) this.setState({connectivityAvailable: false});
            else this.setState({connectivityAvailable: true});
        });
        NetInfo.fetch().then(state => {
            if (!state.isConnected) this.setState({connectivityAvailable: false});
            else this.setState({connectivityAvailable: true});
        });
        socket.on('connect', () => {
            const userId = ProviderDetails.Provider.providerId;
            if (userId) {
                socket.emit('connected', userId);
                this.setState({online:true});
            }
            console.log('connected');
        });
        socket.on('user-disconnected', users => {
            console.log('someone disconnected')
            OnlineUsers.Users = users;
        })
        socket.on('user-joined', users => {
            console.log('someone connected')
            OnlineUsers.Users = users;
        })
        socket.on('disconnect', info => {
            console.log('you disconnected')
            console.log(info);
            this.setState({online:false});
            if (!this.state.online && this.state.connectivityAvailable) socket.open();
        })
        socket.open();
        navigation.addListener('willFocus', async () => {
            console.log("willFocus runs >>")
            this.onRefresh();
        });

    }

    componentWillMount() {

        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton.bind(this));

        firebase.notifications().onNotification((notification) => {

            const { title, body, data } = notification;

            console.log("Title, body , data >>> " + title + " >> " + body + " >> " + JSON.stringify(data));
            console.log('DeliveryAddress >>> ', data.delivery_address);
            console.log('DeliveryLat >>> ', data.delivery_lat);

            if(title == "Booking Request")
            {
                this.props.navigation.navigate("ProChatAccept", {
                    'userId': data.userId,
                    'serviceName': data.serviceName,
                    'mainId': data.main_id,
                    'orderId': data.order_id,
                    'delivery_address': data.delivery_address,
                    'delivery_lat': data.delivery_lat,
                    'delivery_lang': data.delivery_lang,
                })
            }
        });
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton.bind(this));
        this.notificationOpenedListener();
    }

    //Recent Chat Message
    getAllRecentChat() {
        let dbRef = firebase.database().ref('recentMessage').child(ProviderDetails.Provider.providerId);
        dbRef.once('value', (snapshot) => {
            const key = snapshot.key;
            const message = snapshot.val();

            this.setState({
                isLoading: true,
            })

            if (message != null) {
                dbRef.on('child_added', (val) => {

                    let message = val.val();
                    let id = val.key;
                    console.log("Id Firebase : " + id);
                    console.log("Message Firebase : " + JSON.stringify(message));

                    this.setState({
                        isLoading: false,
                    })

                    this.setState((prevState) => {

                        return {
                            dataSource: [...prevState.dataSource, message],
                            isLoading: false,
                            isRecentMessage: true,
                        }
                    })
                })
            }
            else {
                this.setState({
                    isLoading: false,
                    isRecentMessage: false,
                })
            }
        })
    }

    getAllWorkRequest() {

        this.setState({
            isLoading: true
        })

        fetch(BOOKING_HISTORY + ProviderDetails.Provider.providerId)
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("Response Booking History : " + JSON.stringify(responseJson))

                if (responseJson.result) {
                    for (let i = 0; i < responseJson.data.length; i++) {
                        if (responseJson.data[i].chat_status == "1") {
                            this.state.dataWorkSource.push(responseJson.data[i]);
                        }
                        else if (responseJson.data[i].chat_status == "0") {
                            if (responseJson.data[i].status != "Pending") {
                                this.state.dataWorkSource.push(responseJson.data[i]);
                            }
                        }
                    }
                    if (this.state.dataWorkSource.length > 0) {
                        this.setState({
                            isLoading: false,
                            isWorkRequest: true,
                        })
                    }
                    else {
                        this.setState({
                            isLoading: false,
                            isWorkRequest: false,
                        })
                    }
                }
                else {
                    this.setState({
                        isLoading: false,
                        isWorkRequest: false,
                    })
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    isLoading: false,
                    isWorkRequest: true,
                    isErrorToast: true
                })
                //ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
                this.showToast("Something went wrong, Check your internet connection");
            })
    }

    getAllRecentUser() {
        this.setState({
            isLoading: true
        })

        fetch(RECENT_USER + ProviderDetails.Provider.providerId)
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("Response getAllRecentUser : " + JSON.stringify(responseJson))

                if (responseJson.result) {
                    this.setState({
                        dataUserSource: responseJson.data,
                        isLoading: false,
                        isRecentUser: true,
                    })
                }
                else {
                    this.setState({
                        isLoading: false,
                        isRecentUser: false,
                    })
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    isLoading: false,
                    isRecentUser: true,
                    isErrorToast: true
                })
               // ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
                this.showToast("Something went wrong, Check your internet connection");
            })
    }

    renderRecentMessageItem = ({ item }) => {
        const customerImage = item.image;
        return (
            <TouchableOpacity style={styles.itemMainContainer}
                onPress={() => this.props.navigation.navigate("ProChat", {
                    'userId': item.id,
                    'name': item.name,
                    'image': item.image,
                    'orderId': item.orderId,
                    'serviceName': item.serviceName,
                    'pageTitle': "ProDashboard"
                })}>
                <View style={styles.itemImageView}>
                    <Image style={{ width: 40, height: 40, borderRadius: 100 }}
                        source={ customerImage ? { uri: item.image } : require('../images/generic_avatar.png')} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'black', textAlignVertical: 'center' }}>
                        {item.name}
                    </Text>
                    <Text style={{
                        width: screenWidth - 150, fontSize: 10, color: 'black',
                        textAlignVertical: 'center', color: 'gray', marginTop: 3,
                    }}
                        numberOfLines={2}>
                        {item.textMessage}
                    </Text>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                    <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
                        {item.date}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderWorkItem = ({ item }) => {
        console.log(ProviderDetails.Provider.providerId)
        //console.log(item);
        if (String(item.employee_id) === String(ProviderDetails.Provider.providerId)) {
            return (
                <TouchableOpacity style={{ width: screenWidth, flexDirection: 'row', backgroundColor: 'white' }}
                    onPress={() => this.props.navigation.navigate("ProBookingDetails", {
                        "bookingDetails": item
                    })}>
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{item.service_details.service_name}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', ...item.status == 'Pending' ? styles.colorYellow : item.status == 'Accepted' ? styles.colorGreen : item.status == 'Completed' ? styles.colorBlack : styles.colorRed }}>{item.status}</Text>
                    </View>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}
                        onPress={() => this.askForReview(item)}>
                        <Text style={{ fontSize: 12, }}>{item.customer_review == "Requested" ? 'Waiting' : item.customer_rating == "" ? 'Ask for review' : item.customer_rating + "/5"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5, }}
                        onPress={() => this.changeDialogVisibility(true, "", item, "", "")}>
                        <Text style={{ fontSize: 12, }}>{item.employee_rating == "" ? 'Give review' : item.employee_rating + "/5"}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            )
        }
        else return null;
    }

    renderRecentUserItem = ({ item }) => {
        const recentUserImage = item.user_details.image;
        return (
            <TouchableOpacity style={styles.itemMainContainer}
                onPress={()=> this.props.navigation.navigate("ProBooking")}>
                <View style={styles.itemImageView}>
                    <Image style={{ width: 40, height: 40, borderRadius: 100 }}
                        source={ recentUserImage ? { uri: item.user_details.image } : require('../images/generic_avatar.png')} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'black', textAlignVertical: 'center' }}>
                        {item.user_details.username}
                    </Text>
                    <Text style={{
                        width: screenWidth - 150, fontSize: 10, color: 'black',
                        textAlignVertical: 'center', color: 'gray', marginTop: 3,
                    }}
                        numberOfLines={1} >
                        {item.user_details.address}
                    </Text>
                    <Text style={{
                        width: screenWidth - 150, fontSize: 12, color: 'black', fontWeight: 'bold',
                        textAlignVertical: 'center', color: 'gray', marginTop: 3,
                    }}
                        numberOfLines={2} >
                        {item.service_details.service_name}
                    </Text>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                    <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
                        {item.createdDate}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    updateAvailabilityInMongoDB = userData => {

        fetch(PRO_INFO_UPDATE + ProviderDetails.Provider.providerId,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            .then((response) => response.json())
            .then((response) => {
                console.log("Response" + JSON.stringify(response));
                if (response.result) {
                    if (this.state.status == 'ONLINE') {
                        this.setState({
                            status: "OFFLINE",
                            availBackground: 'red',
                            isLoading: false,
                            isErrorToast: false
                        })
                    }
                    else if (this.state.status == 'OFFLINE') {
                        this.setState({
                            status: "ONLINE",
                            availBackground: 'green',
                            isLoading: false,
                            isErrorToast: false
                        })
                    }
                    //ToastAndroid.show(response.message, ToastAndroid.show);
                    this.showToast(response.message)
                }
                else {
                    this.setState({
                        isLoading: false,
                    })
                    //ToastAndroid.show(response.message, ToastAndroid.show);
                    this.showToast(response.message)
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

    changeAvailabilityStaus = () => {
        var statusValue = null;
        const providerId = ProviderDetails.Provider.providerId;
        const usersRef = database.ref('users/' + providerId);
        this.setState({
            isLoading: true,
        })

        if (this.state.status == 'ONLINE') {
            statusValue = '0';
        }
        else if (this.state.status == 'OFFLINE') {
            statusValue = '1';
        }

        const userData = {
            "status": statusValue
        }
        usersRef.once('value', data => {
            if (data) {
                usersRef.update(userData).then(() => {
                    console.log("updated");
                    this.updateAvailabilityInMongoDB(userData);
                }).
                catch(e => {
                    console.log(e.message)
                });
            }
            else {
                usersRef.set(userData).then(() => {
                    this.updateAvailabilityInMongoDB(userData);
                }).
                catch(e => {
                    console.log(e.message);
                });
            }
        })

    };

    _spring() {
        this.setState({ backClickCount: 1 }, () => {
            Animated.sequence([
                Animated.spring(
                    this.springValue,
                    {
                        toValue: -.15 * 1,
                        friction: 5,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),
                Animated.timing(
                    this.springValue,
                    {
                        toValue: 100,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),

            ]).start(() => {
                this.setState({ backClickCount: 0 });
            });
        });
    }

    handleBackButton = () => {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
        return true
    };

    renderSeparator = () => {
        return (
            <View
                style={{ height: 1, width: '100%', backgroundColor: colorBg }}>
            </View>
        );
    };

    //Call also from ReviewDialog
    changeDialogVisibility = (bool, text, item, rating, review) => {

        if (item != '') {

            if (item.employee_rating == '') {
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                    mainId: item._id,
                })
            }
        }
        else {
            if (text == "Not now") {
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                })
            }
            else if (text == "Submitted") {
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                    rating: rating,
                    review: review,
                })

                this.reviewTask(rating, review);
            }
        }
    }

    goToProMapDirection = () => {
        if (ProPendingJobRequest.Request.chat_status == '0') {
            this.setState({
                isErrorToast: true,
            })
            //ToastAndroid.show("Accept Chat Request First", ToastAndroid.SHORT);
            this.showToast("Accept Chat Request First");
        }
        else {
            if (ProPendingJobRequest.Request.status == 'Pending') {
                this.props.navigation.navigate("ProAcceptRejectJob");
            }
            else if (ProPendingJobRequest.Request.status == 'Accepted') {
                this.props.navigation.navigate("ProMapDirection", {
                    'pageTitle': "ProDashboard",
                });
            }
        }
    }

    acceptChatRequest = () => {

        this.setState({
            isLoading: true,
        })

        const data = {
            main_id: ProPendingJobRequest.Request.id,
            chat_status: '1',
            status: 'Pending',
            'notification': {
                "fcm_id": ProPendingJobRequest.Request.fcm_id,
                "title": "Chat Request Accepted",
                "body": 'Chat request has been accepted by ' + ProviderDetails.Provider.name + ' Request Id : ' + ProPendingJobRequest.Request.order_id,
                "data": {
                    ProviderData: ProviderDetails.Provider,
                    serviceName: ProPendingJobRequest.Request.service_name,
                    orderId: ProPendingJobRequest.Request.order_id,
                    mainId: ProPendingJobRequest.Request.id,
                    chat_status: '1',
                    status: 'Pending',
                },
            }
        }

        console.log("ACCEPT CHAT Data >> " + JSON.stringify(data));

        fetch(REJECT_ACCEPT_REQUEST, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("Response acceptChatRequest: " + JSON.stringify(responseJson))
                if (responseJson.result) {
                    this.setState({
                        isLoading: false
                    })
                    var jobData = {
                        id: responseJson.data.id,
                        order_id: ProPendingJobRequest.Request.order_id,
                        user_id: ProPendingJobRequest.Request.user_id,
                        image: ProPendingJobRequest.Request.image,
                        fcm_id: ProPendingJobRequest.Request.fcm_id,
                        name: ProPendingJobRequest.Request.name,
                        mobile: ProPendingJobRequest.Request.mobile,
                        dob: ProPendingJobRequest.Request.dob,
                        address: ProPendingJobRequest.Request.address,
                        lat: ProPendingJobRequest.Request.lat,
                        lang: ProPendingJobRequest.Request.lang,
                        service_name: ProPendingJobRequest.Request.service_name,
                        chat_status: "1",
                        status: "Pending",
                        delivery_address: ProPendingJobRequest.Request.delivery_address,
                        delivery_lat: ProPendingJobRequest.Request.delivery_lat,
                        delivery_lang: ProPendingJobRequest.Request.delivery_lang,
                    }
                    ProPendingJobRequest.Request = jobData;

                    console.log("acceptJob :>>>" + JSON.stringify(ProPendingJobRequest.Request))

                    this.props.navigation.navigate("ProAcceptRejectJob");
                }
                else {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true,
                    });
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.showToast("Something went wrong")  
                }
            })
            .catch((error) => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            })
    }

    reviewTask(rating, review) {

        console.log("Main Id : " + this.state.mainId);
        console.log("Rating :  " + rating);
        console.log("Review : " + review);

        this.setState({
            isLoading: true,
        })

        const reviewData = {
            "main_id": this.state.mainId,
            "type": "Employee",
            "rating": rating,
            "review": review,
        }

        fetch(REVIEW_RATING,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            })
            .then((response) => response.json())
            .then((response) => {
                console.log("Response" + JSON.stringify(response));
                if (response.result) {
                    this.setState({
                        isLoading: false,
                        isReviewDialogVisible: false,
                        mainId: "",
                        isErrorToast: false
                    })
                    //ToastAndroid.show("Review submitted", ToastAndroid.show);
                    this.showToast("Review submitted");

                    this.onRefresh();
                }
                else {
                    this.setState({
                        isLoading: false,
                    })
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.showToast("Something went wrong");
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

    askForReview(item) {

        if (item.customer_review != "Requested" && item.customer_rating == "") {
            this.setState({
                isLoading: true,
            })

            const askReviewData = {
                "order_id": item._id,
                "user_id": item.user_id,
                "employee_id": ProviderDetails.Provider.providerId,
                'notification': {
                    "fcm_id": item.user_details.fcm_id,
                    "title": "Ask For Review",
                    "body": ProviderDetails.Provider.name + " " + ProviderDetails.Provider.surname + " waiting for your feedback",
                }
            }

            console.log("askReviewData : " + JSON.stringify(askReviewData));

            fetch(ASK_FOR_REVIEW,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(askReviewData)
                })
                .then((response) => response.json())
                .then((response) => {
                    console.log("Response" + JSON.stringify(response));
                    if (response.result) {
                        this.setState({
                            isLoading: false,
                            dataWorkSource: [],
                            isErrorToast: false,
                        })
                        //ToastAndroid.show("Request submitted successfully", ToastAndroid.show);
                        this.showToast("Request submitted successfully")

                        this.getAllWorkRequest();
                    }
                    else {
                        this.setState({
                            isLoading: false,
                            isErrorToast: true
                        })
                        //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                        this.showToast("Something went wrong")
                    }
                })
                .catch((error) => {
                    console.log("Error :" + error);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    })
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.showToast("Something went wrong")
                })
                .done()
        }
        else if (item.customer_review == "Requested") {
            console.log("You have already asked, Please wait for customer feedback");
            this.setState({
                isErrorToast: true
            })
           // ToastAndroid.show("You have already asked, Please wait for customer feedback", ToastAndroid.show);
            this.showToast("You have already asked, Please wait for customer feedback");
        }
    }

    showToast = (message) => {
        this.refs.toast.show(message);
    }

    onRefresh() {
        this.state.refreshing = true;

        this.setState({
            dataSource: [],
            dataWorkSource: [],
            dataUserSource: [],
            isRecentMessage: false,
            isWorkRequest: false,
            isJobRequest: false,
            isRecentUser: false
        })
        this.getAllRecentChat();
        this.getAllWorkRequest();
        this.getAllRecentUser();

        this.state.refreshing = false;
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const customerImage = ProPendingJobRequest.Request.image;
        const { notificationTotal } = this.state;
        return (
            <View style={styles.container}>

                <StatusBarPlaceHolder/>

                <View style={styles.header}>
                    <Hamburger 
                        Notifications={Notifications}
                        navigation={this.props.navigation}
                        text='Harfa'
                    />
                </View>

                <View style={styles.onlineOfflineHeader}>
                    <Text style={{
                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start',
                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'}}>
                        Availability
                    </Text>
            
                    <TouchableOpacity style={styles.onlineOfflineView}
                        onPress={this.changeAvailabilityStaus}>
                        <View style={[styles.onlineOfflineText, { backgroundColor: this.state.availBackground  }]}>
                            <Text style={{ color: 'white', fontWeight: 'bold', alignSelf: 'center' }}>
                                {this.state.status}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ marginBottom: ProPendingJobRequest.Request.order_id == '' ? 0 : 80 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.onRefresh.bind(this)}
                            title="Loading" />
                    }>
                    <View>
                        {this.state.isRecentMessage &&
                            <View style={styles.mainContainer}>
                                <View style={styles.recentMessageHeader}>
                                    <Text style={{
                                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start', fontSize: 18,
                                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'
                                    }}>
                                        Recent Message
                                    </Text>
                                    {false &&
                                    <TouchableOpacity style={styles.viewAll}
                                        onPress={() => this.props.navigation.navigate("ProAllMessage")}>
                                        <Text style={styles.textViewAll}>View All</Text>
                                    </TouchableOpacity>
                                    }
                                </View>

                                <View style={styles.listView}>
                                    <FlatList
                                        numColumns={1}
                                        data={this.state.dataSource}
                                        renderItem={this.renderRecentMessageItem}
                                        keyExtractor={(item, index) => index.toString()}
                                        showsVerticalScrollIndicator={false}
                                        extraData={this.state} />
                                </View>
                            </View>
                        }
                        {this.state.isWorkRequest &&
                            <View style={styles.mainContainer}>
                                <View style={styles.recentMessageHeader}>
                                    <Text style={{
                                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start', fontSize: 18,
                                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'
                                    }}>
                                        Work
                                    </Text>
                                    {false &&
                                    <TouchableOpacity style={styles.viewAll}>
                                        <Text style={styles.textViewAll}>View All</Text>
                                    </TouchableOpacity>
                                    }
                                </View>
                                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                                <View style={{ flexDirection: 'row', padding: 10, justifyContent: 'center' }}>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Job's Name</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Review</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Client Review</Text>
                                </View>

                                <View style={styles.listView}>
                                    <FlatList
                                        numColumns={1}
                                        data={this.state.dataWorkSource}
                                        renderItem={this.renderWorkItem}
                                        keyExtractor={(item, index) => index.toString()}
                                        showsVerticalScrollIndicator={false}
                                        extraData={this.state}
                                        ItemSeparatorComponent={this.renderSeparator} />
                                </View>
                            </View>
                        }
                        {/*this.state.isRecentUser &&
                            <View style={styles.mainContainer}>
                                <View style={styles.recentMessageHeader}>
                                    <Text style={{
                                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start', fontSize: 18,
                                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'}}>
                                        Recent User
                                    </Text>
                                    {false && 
                                    <TouchableOpacity style={styles.viewAll}>
                                        <Text style={styles.textViewAll}>View All</Text>
                                    </TouchableOpacity>
                                    }
                                </View>
                                <View style={styles.listView}>
                                    <FlatList
                                        numColumns={1}
                                        data={this.state.dataUserSource}
                                        renderItem={this.renderRecentUserItem}
                                        keyExtractor={(item, index) => index.toString()}
                                        showsVerticalScrollIndicator={false}
                                        extraData={this.state} />
                                </View>
                            </View>*/
                        }
                        <Modal transparent={true} visible={this.state.isDialogLogoutVisible} animationType='fade'
                            onRequestClose={() => this.changeDialogVisibility(false, "", "", "", "", "")}>
                            <ReviewDialog style={{
                                shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.75, shadowRadius: 5, elevation: 5}}
                                changeDialogVisibility={this.changeDialogVisibility}
                                data={JSON.stringify(this.state.reviewData)+"//////"+"0"} />
                        </Modal>
                    </View>

                    {!this.state.isRecentUser && !this.state.isWorkRequest && !this.state.isLoading &&
                        <View style={{ width: screenWidth, height: screenHeight - 130, justifyContent: 'center' }}>
                            <Image style={{ height: 75, width: 75, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, }}
                                source={require('../icons/no_request.png')} />
                            <Text style={{ fontSize: 18, alignItems: 'center', alignSelf: 'center' }}>
                                No Job Request Found
                            </Text>
                        </View>
                    }
                </ScrollView>

                {ProPendingJobRequest.Request.order_id != '' &&
                    <TouchableOpacity style={styles.pendingJobStyle}
                        onPress={this.goToProMapDirection}>
                        <LinearGradient style={styles.pendingJobStyle}
                            colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                            <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, borderRadius: 200, }}
                                source={ customerImage ? { uri: customerImage } : require('../images/generic_avatar.png')} />
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center' }}>
                                    {ProPendingJobRequest.Request.name}
                                </Text>
                                <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                                    {"Request for " + ProPendingJobRequest.Request.service_name}
                                </Text>
                                <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                    {ProPendingJobRequest.Request.chat_status == "0" ? "New Job Request" : ProPendingJobRequest.Request.status == "Pending" ? "Chat Request Accepted" : "Job Accepted"}
                                </Text>
                            </View>
                            {ProPendingJobRequest.Request.chat_status == '1' &&
                                <View style={styles.arrowView}>
                                    <Image style={styles.arrow}
                                        source={require('../icons/arrow_right_animated.gif')} />
                                </View>
                            }
                            {ProPendingJobRequest.Request.chat_status == '0' &&
                                <TouchableOpacity style={styles.arrowView}
                                    onPress={this.acceptChatRequest}>
                                    <View style={styles.viewAccept}> 
                                    <Text style={styles.textAccept}>Accept</Text>
                                    </View>   
                                </TouchableOpacity>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                }

                <Toast
                    ref="toast"
                    style={{ backgroundColor: this.state.isErrorToast == true ? 'red' : 'green' }}
                    position='bottom'
                    positionValue={200}
                    fadeInDuration={750}
                    fadeOutDuration={1500}
                    opacity={0.8}
                    textStyle={{ color: 'white' }} />

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

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Press back again to exit the app</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }
}

const AppStackNavigator = createStackNavigator({
    ProDashBoard: {
        screen: ProDashBoardScreen,
        navigationOptions: {
            header: null
        }
    },
    ProAllMessage: {
        screen: ProAllMessageScreen,
        navigationOptions: {
            header: null
        }
    },
    ProChat: {
        screen: ProChatScreen,
        navigationOptions: {
            header: null
        }
    },
    ProChatAccept:
    {
        screen: ProChatAcceptScreen,
        navigationOptions: {
            header: null
        }
    },
    ProAcceptRejectJob: {
        screen: ProAcceptRejectJobScreen,
        navigationOptions: {
            header: null
        }
    },
    ProMapDirection:
    {
        screen: ProMapDirectionScreen,
        navigationOptions: {
            header: null
        }
    },
    ProBooking: {
        screen: ProBookingScreen,
        navigationOptions: {
            header: null
        }  
    },
    ProBookingDetails: {
        screen: ProBookingDetailsScreen,
        navigationOptions: {
            header: null
        }
    },
    ProChatAfterBookingDetails: {
        screen: ProChatAfterBookingDetailsScreen,
        navigationOptions: {
            header: null
        }
    },
});

const XYZ = createAppContainer(AppStackNavigator);
export default XYZ;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    onlineOfflineHeader: {
        width: screenWidth,
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center'
    },
    onlineOfflineView: {
        flex: 1,
        textAlignVertical: 'center',
        color: 'white',
    },
    onlineOfflineText: {
        width: 90,
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        fontWeight: 'bold',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 8,
        paddingBottom: 8,
        color: 'white',
        borderRadius: 3,
        marginRight: 20,
    },
    mainContainer: {
        flexDirection: 'column',
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
        marginTop: 10
    },
    noticationsCount: {
        position: 'absolute',
        textAlignVertical: 'center',
        textAlign: 'center',
        borderRadius: 10,
        color: 'white',
        right: 15,
        height: 20,
        width: 20,
        backgroundColor: 'red',
        top: 5
    },
    recentMessageHeader: {
        width: screenWidth,
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorBg,
        alignItems: 'center'
    },
    viewAll : {
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: 'white',
        borderColor: colorYellow,
        borderWidth: 2,
        borderRadius: 5,
        marginRight: 20,
    },
    textViewAll: {
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        color: 'black',
    },
    viewAccept: {
        alignSelf: 'flex-end',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: 'white',
        borderColor: colorYellow,
        borderWidth: 2,
        borderRadius: 5,
        marginRight: 20,
    },
    textAccept: {
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        fontWeight: 'bold',
        color: '#4c4c4c',
    },
    touchaleHighlight: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 15,
    },
    textHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlignVertical: 'center',
        alignSelf: 'center'
    },
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    itemMainContainer: {
        width: screenWidth,
        flex: 1,
        height: 70,
        flexDirection: 'row',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        padding: 5,
    },
    itemImageView: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 5,
    },
    colorYellow: {
        color: colorYellow,
    },
    colorRed: {
        color: 'red',
    },
    colorGreen: {
        color: 'green',
    },
    colorBlack: {
        color: 'black',
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
    animatedView: {
        width: screenWidth,
        backgroundColor: colorPrimaryDark,
        elevation: 2,
        position: "absolute",
        bottom: 0,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    exitTitleText: {
        textAlign: "center",
        color: 'white',
        marginRight: 20,
    },
    exitText: {
        color: 'red',
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 3
    },
    pendingJobStyle: {
        flex: 1,
        width: screenWidth,
        height: 80,
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    linearGradient: {
        flex: 1,
        paddingLeft: 15,
        paddingRight: 15,
        borderRadius: 5
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Gill Sans',
        textAlign: 'center',
        margin: 10,
        color: '#ffffff',
        backgroundColor: 'transparent',
    },
    arrowView: {
        flex: 1,
        height: 80,
        color: 'white',
        alignContent: 'center',
        justifyContent: 'center',
    },
    arrow: {
        width: 35,
        height: 35,
        alignSelf: 'flex-end',
        marginRight: 30,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: "absolute",
        end: 0,
        left: 0,
        top: 0,
        bottom: 0
    },
    modal: {
        height: 360,
        paddingTop: 10,
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: colorBg,
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    touchableHighlight: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: 5,
        alignSelf: 'stretch',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 5,
        marginLeft: 5,
        marginRight: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
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