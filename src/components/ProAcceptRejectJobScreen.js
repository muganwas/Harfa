import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, TextInput, ScrollView, FlatList, Dimensions,
    ActivityIndicator, BackHandler, ImageBackground, StatusBar, Platform, Modal
} from 'react-native';
import firebase from 'react-native-firebase';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import WaitingDialog from './WaitingDialog';
import ImagePicker from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';
import Geolocation from 'react-native-geolocation-service';
import ProviderDetails from './ProviderDetails';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingJobProvider, fetchedJobProviderInfo, fetchProviderJobInfoError, setSelectedJobRequest } from '../Redux/Actions/jobsActions';
import Config from './Config';
import ProPendingJobRequest from './ProPendingJobRequest';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
const GET_IMAGE_URL = Config.baseURL + "thirdpartyapi/chatupload"

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const options = {
    title: 'Sélectionnez une photo',
    takePhotoButtonTitle: 'Prendre une photo',
    chooseFromLibraryButtonTitle: 'Choisir depuis la galerie',
    quality: 1
};


function StatusBarPlaceHolder() {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: colorPrimaryDark
            }}>
                <StatusBar
                    barStyle="light-content" />
            </View>
            :
            <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
    );
}

class ProAcceptRejectJobScreen extends Component {

    constructor(props) {
        super(props)
        const { jobsInfo: { jobRequestsProviders, selectedJobRequest: { user_id } } } = this.props;
        var currRequestPos;
        Object.keys(jobRequestsProviders).map(key => {
            const currEmpId = jobRequestsProviders[key].user_id;
            if (currEmpId === user_id) currRequestPos = key;
        });

        this.state = {
            senderId: ProviderDetails.Provider.providerId,
            senderImage: ProviderDetails.Provider.imageSource,
            senderName: ProviderDetails.Provider.name,
            senderSurname: ProviderDetails.Provider.surname,
            inputMessage: '',
            showButton: false,
            isAcceptJob: jobRequestsProviders[currRequestPos].status === "Accepted",
            isRejectJob: false,
            dataChatSource: [],
            isLoading: true,
            isErrorToast: false,
            receiverId: jobRequestsProviders[currRequestPos].user_id,
            receiverName: jobRequestsProviders[currRequestPos].name,
            receiverImage: jobRequestsProviders[currRequestPos].image,
            receiverMobile: jobRequestsProviders[currRequestPos].mobile,
            receiverDob: jobRequestsProviders[currRequestPos].dob,
            receiverAddress: jobRequestsProviders[currRequestPos].address,
            receiverLat: jobRequestsProviders[currRequestPos].lat,
            receiverLang: jobRequestsProviders[currRequestPos].lang,
            receiverFcmId: jobRequestsProviders[currRequestPos].fcm_id,
            orderId: jobRequestsProviders[currRequestPos].order_id,
            serviceName: jobRequestsProviders[currRequestPos].service_name,
            mainId: jobRequestsProviders[currRequestPos].id,
            delivertAddress: jobRequestsProviders[currRequestPos].delivery_address,
            deliveryLat: jobRequestsProviders[currRequestPos].delivery_lat,
            deliveryLang: jobRequestsProviders[currRequestPos].delivery_lang,
            chatStatus: jobRequestsProviders[currRequestPos].chat_status,
            status: jobRequestsProviders[currRequestPos].status,
            userImageExists: jobRequestsProviders[currRequestPos].imageAvailable,
            currRequestPos
        };

        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

        firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId)
            .on('child_added', value => {
                this.setState(prevState => {
                    return {
                        dataChatSource: [...prevState.dataChatSource, value.val()],
                        isLoading: false,
                    }
                })
            });

        this.setState({
            isLoading: false,
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        this.props.navigation.navigate("ProDashBoard");
        return true;
    }

    selectPhoto = () => {

        console.log('SELECT PHOTO ');

        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else {

                let source

                source = { uri: response.uri };

                this.setState({
                    imageURI: source,
                    imageDataObject: response,
                });

                this.getImageURL(response)
            }
        });
    }

    getImageURL = async (imageObject) => {

        let message = {
            textMessage: 'uploading',
            imageMessage: imageObject,
            time: firebase.database.ServerValue.TIMESTAMP,
            senderId: this.state.senderId,
            senderImage: this.state.senderImage,
            senderName: this.state.senderName,
            receiverId: this.state.receiverId,
            receiverName: this.state.receiverName,
            receiverImage: this.state.receiverImage,
            serviceName: this.state.serviceName,
            orderId: this.state.orderId,
            type: "image",
            date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
        }
        this.setState(prevState => ({
            dataChatSource: [...prevState.dataChatSource, message]
        }))

        this.setState({
            isUploading: true
        })

        let imageData = new FormData();
        imageData.append('file', { type: imageObject.type, uri: imageObject.uri, name: imageObject.fileName });

        fetch(GET_IMAGE_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "multipart/form-data",
                "otherHeader": "foo",
            },
            body: imageData
        })
            .then((response) => response.json())
            .then((responseJson) => {
                //console.log("Response getImageURL >> " + JSON.stringify(responseJson));
                this.setState({
                    isLoading: false
                })
                if (responseJson.result) {
                    this.sendImageTask(responseJson.file);
                }
                else {
                    Alert.alert(
                        "OUPS !",
                        responseJson.message,
                        [
                            {
                                text: 'Annuler',
                                onPress: () => console.log('Cancel Pressed'),
                            },
                            {
                                text: 'Retenter',
                                onPress: () => this.getImageURL(imageObject),
                            },
                        ]
                    );
                }
            })
            .catch((error) => {
                Alert.alert(
                    "OUPS !",
                    error,
                    [
                        {
                            text: 'Annuler',
                            onPress: () => console.log('Cancel Pressed'),
                        },
                        {
                            text: 'Retenter',
                            onPress: () => this.getImageURL(imageObject),
                        },
                    ]
                );
            });
    }

    renderMessageItem = ({ item }) => {
        return (
            this.state.senderId != item.senderId
                ?
                item.type == 'text'
                    ?
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={styles.itemLeftChatContainer}>
                            <View style={styles.itemChatImageView}>
                                <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                    source={this.state.userImageExists ? { uri: item.senderImage } : require('../images/generic_avatar.png')} />
                            </View>
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                    {item.textMessage}
                                </Text>
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                    {this.convertTime(item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    :
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={{
                            width: 125, height: 135, backgroundColor: 'white',
                            borderRadius: 3, marginRight: 10
                        }}>
                            <Image style={{ width: 110, height: 110, marginHorizontal: 7.5, marginTop: 7.5 }}
                                source={{ uri: item.imageMessage }}>
                            </Image>
                            <Text style={{
                                fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right',
                                color: 'black', marginRight: 7.5, marginTop: 2
                            }}>
                                {this.convertTime(item.time)}
                            </Text>
                        </View>
                    </View>
                :
                item.type == 'text'
                    ?
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={styles.itemRightChatContainer}>
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                    {item.textMessage}
                                </Text>
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'white', marginLeft: 5 }}>
                                    {this.convertTime(item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    :
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={{
                            width: 125, height: 135, backgroundColor: 'white', borderRadius: 3,
                            marginRight: 10
                        }}>
                            <Image style={{ width: 115, height: 115, marginHorizontal: 5, marginTop: 5 }}
                                source={item.textMessage == "uploading" ? item.imageMessage : { uri: item.imageMessage }}
                                resizeMode='cover'>
                            </Image>
                            <Text style={{
                                fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right',
                                color: 'black', marginRight: 7.5, marginTop: 2
                            }}>
                                {this.convertTime(item.time)}
                            </Text>
                            {this.state.isUploading && item.textMessage == "uploading" && (
                                <View style={styles.loaderStyle}>
                                    <ActivityIndicator
                                        style={{ height: 40 }}
                                        color="#C00"
                                        size="large" />
                                </View>
                            )}
                        </View>
                    </View>
        )
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    convertTime = (time) => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (c.getDay() !== d.getDay()) {
            result = d.getDay() + '/' + d.getMonth() + "/" + d.getFullYear() + ', ' + result;
        }
        return result;
    }

    showHideButton = (input) => {

        this.setState({
            inputMessage: input,
        })
        if (input == '') {
            this.setState({
                showButton: false,
            })
        }
        else {
            this.setState({
                showButton: true,
            })
        }
    }

    sendMessageTask = () => {

        console.log("Sender Id : " + this.state.senderId);
        console.log("Receiver Id : " + this.state.receiverId);
        console.log("Sender Id : " + this.state.orderId);
        if (this.state.inputMessage.length > 0) {
            let msgId = firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                senderId: this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName + " " + this.state.senderSurname,
                receiverId: this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),

            }

            console.log("MessageData : " + JSON.stringify(message));

            let recentMessageReceiver = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.senderId,
                name: this.state.senderName + " " + this.state.senderSurname,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",

            }
            let recentMessageSender = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.receiverId,
                name: this.state.receiverName,
                image: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",

            }
            updates['chatting/' + this.state.senderId + '/' + this.state.receiverId + '/' + msgId] = message;
            updates['chatting/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = message;
            firebase.database().ref().update(updates);

            recentUpdates['recentMessage/' + this.state.senderId + '/' + this.state.receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + this.state.receiverId + '/' + this.state.senderId] = recentMessageReceiver;
            firebase.database().ref().update(recentUpdates)

            this.setState({
                inputMessage: '',
                showButton: false,
            });
        }
    }

    sendImageTask = async (imageURL) => {

        console.log("Sender Id : " + this.state.senderId);
        console.log("Receiver Id : " + this.state.receiverId);

        if (imageURL != '' && imageURL != null) {
            let msgId = firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: '',
                imageMessage: imageURL,
                time: firebase.database.ServerValue.TIMESTAMP,
                senderId: this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName,
                receiverId: this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "image",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
            }
            let recentMessageReceiver = {
                textMessage: '',
                imageMessage: imageURL,
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.senderId,
                name: this.state.senderName,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "image",
            }
            let recentMessageSender = {
                textMessage: '',
                imageMessage: imageURL,
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.receiverId,
                name: this.state.receiverName,
                image: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "image",
            }

            //Remove Last item from Array
            var array = [...this.state.dataChatSource]; // make a separate copy of the array
            if (array.length > 0) {
                array.splice(array.length - 1, 1);
                this.setState({ dataChatSource: array });
            }

            updates['chatting/' + this.state.senderId + '/' + this.state.receiverId + '/' + msgId] = message;
            updates['chatting/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = message;
            firebase.database().ref().update(updates);

            recentUpdates['recentMessage/' + this.state.senderId + '/' + this.state.receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + this.state.receiverId + '/' + this.state.senderId] = recentMessageReceiver;

            firebase.database().ref().update(recentUpdates)

            this.setState({
                isUploading: false,
            })
        }
    }

    acceptJobTask = () => {

        this.setState({
            isLoading: true
        });

        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Accepted',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Accepted",
                "body": 'Your request has been accepted by ' + ProviderDetails.Provider.name + " " + ProviderDetails.Provider.surname + ' Request Id : ' + ProPendingJobRequest.Request.order_id,
                "data": {
                    ProviderId: ProviderDetails.Provider.providerId,
                    image: ProviderDetails.Provider.imageSource,
                    fcmId: ProviderDetails.Provider.fcmId,
                    name: ProviderDetails.Provider.name,
                    surname: ProviderDetails.Provider.surname,
                    mobile: ProviderDetails.Provider.mobile,
                    description: ProviderDetails.Provider.description,
                    address: ProviderDetails.Provider.address,
                    lat: ProviderDetails.Provider.lat,
                    lang: ProviderDetails.Provider.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: "1",
                    status: "Accepted",
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }

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
                //console.log("Response : " + JSON.stringify(responseJson));
                const { fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
                const { currRequestPos } = this.state;
                var newjobRequestsProviders = [...jobRequestsProviders];
                console.log(responseJson)
                if (responseJson.data) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    })

                    var jobData = {
                        id: rresponseJson.data.id,
                        order_id: responseJson.data.order_id,
                        user_id: responseJson.data.user_id,
                        image: responseJson.data.image,
                        fcm_id: responseJson.data.fcm_id,
                        name: responseJson.data.name,
                        mobile: responseJson.data.mobile,
                        dob: responseJson.data.dob,
                        address: responseJson.data.address,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        service_name: responseJson.data.service_name,
                        chat_status: responseJson.data.chat_status,
                        status: responseJson.data.status,
                        delivery_address: responseJson.data.delivery_address,
                        delivery_lat: responseJson.data.delivery_lat,
                        delivery_lang: responseJson.data.delivery_lang,
                    }
                    newjobRequestsProviders[currRequestPos] = jobData;
                    fetchedPendingJobInfo(newjobRequestsProviders);

                    //Send Location to Firebase for tracking
                    Geolocation.getCurrentPosition(
                        (position) => {
                            //console.log("Position : " + JSON.stringify(position));
                            let locationData = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            }

                            let updates = {};
                            updates['tracking/' + ProPendingJobRequest.Request.order_id] = locationData;
                            firebase.database().ref().update(updates);
                        });
                }
                else {
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Something went wrong");
                }
            })
            .catch((error) => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            })
    };

    rejectJobTask = () => {

        this.setState({
            isLoading: true
        })

        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Rejected',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Rejected",
                "body": 'Your request has been rejected by ' + ProviderDetails.Provider.name + ' Request Id : ' + ProPendingJobRequest.Request.order_id,
                "data": {
                    ProviderId: ProviderDetails.Provider.providerId,
                    image: ProviderDetails.Provider.imageSource,
                    fcmId: ProviderDetails.Provider.fcmId,
                    name: ProviderDetails.Provider.name,
                    surname: ProviderDetails.Provider.surname,
                    mobile: ProviderDetails.Provider.mobile,
                    description: ProviderDetails.Provider.description,
                    address: ProviderDetails.Provider.address,
                    lat: ProviderDetails.Provider.lat,
                    lang: ProviderDetails.Provider.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: "0",
                    status: "Rejected",
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }

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
                const { fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
                const { currRequestPos } = this.state;
                var newjobRequestsProviders = [...jobRequestsProviders];
                if (responseJson.result) {
                    this.setState({
                        isLoading: false,
                        isRejectJob: true
                    });
                    delete newjobRequestsProviders[currRequestPos];
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    this.props.navigation.navigate("ProDashBoard");
                }
                else {
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Something went wrong")
                }
            })
            .catch(error => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            });
    };

    goToMapDirection = () => {
        const { fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
        const { currRequestPos } = this.state;
        var newjobRequestsProviders = [...jobRequestsProviders];
        var jobData = {
            ProviderId: ProviderDetails.Provider.providerId,
            image: ProviderDetails.Provider.imageSource,
            fcmId: ProviderDetails.Provider.fcmId,
            name: ProviderDetails.Provider.name,
            surname: ProviderDetails.Provider.surname,
            mobile: ProviderDetails.Provider.mobile,
            description: ProviderDetails.Provider.description,
            address: ProviderDetails.Provider.address,
            lat: ProviderDetails.Provider.lat,
            lang: ProviderDetails.Provider.lang,
            serviceName: this.state.serviceName,
            orderId: this.state.orderId,
            mainId: this.state.mainId,
            chat_status: "1",
            status: "Accepted",
            delivery_address: this.state.delivertAddress,
            delivery_lat: this.state.deliveryLat,
            delivery_lang: this.state.deliveryLang,
        }
        newjobRequestsProviders[currRequestPos] = jobData;
        fetchedPendingJobInfo(newjobRequestsProviders);

        //console.log("goToMapDirection :>>> " + JSON.stringify(ProPendingJobRequest.Request))

        this.props.navigation.navigate("ProMapDirection", {
            'pageTitle': "ProAcceptRejectJob",
        });
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBarPlaceHolder />

                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
                            onPress={() => this.props.navigation.navigate("ProDashBoard")}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 20 }}
                            source={this.state.userImageExists ? { uri: this.state.receiverImage } : require('../images/generic_avatar.png')} />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            {this.state.receiverName}
                        </Text>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'column', marginBottom: 110 }}>
                        <ImageBackground style={styles.listView}
                            source={require('../icons/bg_chat.png')}>
                            <FlatList
                                numColumns={1}
                                data={this.state.dataChatSource}
                                renderItem={this.renderMessageItem}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                extraData={this.state}
                                ItemSeparatorComponent={this.renderSeparator}
                                ref={(ref) => { this.myFlatListRef = ref }}
                                onContentSizeChange={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }}
                                onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />
                        </ImageBackground>

                        {this.state.isAcceptJob && (
                            <TouchableOpacity style={styles.textViewDirection}
                                onPress={this.goToMapDirection}>
                                <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                    source={require('../icons/mobile_gps.png')} />
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                    Direction
                            </Text>
                                <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                    source={require('../icons/right_arrow.png')} />
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    {(!this.state.isAcceptJob && !this.state.isRejectJob) &&
                        <View style={{
                            flex: 1, width: screenWidth, justifyContent: 'center',
                            backgroundColor: 'white', alignItems: 'center'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 10, marginBottom: 10 }}>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.acceptJobTask}>
                                    <Text style={styles.text}>Accepter l'emploi</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.rejectJobTask}>
                                    <Text style={styles.text}>Refuser le travail</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                            placeholder='Tapez un message'
                            value={this.state.inputMessage}
                            multiline={true}
                            onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                        </TextInput>

                        <TouchableOpacity style={{ height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', marginRight: 25 }}
                            onPress={this.selectPhoto.bind(this)}>
                            <Image style={{ width: 20, height: 20 }}
                                source={require('../icons/camera.png')} />
                        </TouchableOpacity>

                        {this.state.showButton &&
                            <TouchableOpacity style={{ height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0, }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: colorYellow, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                            </Text>
                            </TouchableOpacity>
                        }
                    </View>
                </View>

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
        backgroundColor: colorBg,
    },
    listView: {
        height: screenHeight,
        padding: 5,
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: colorGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
    },
    itemChatImageView: {
        width: 20,
        height: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRightChatContainer: {
        maxWidth: screenWidth / 2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    buttonContainer: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    text: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    footer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
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

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchNotifications: data => {
            dispatch(startFetchingNotification(data));
        },
        fetchedNotifications: data => {
            dispatch(notificationsFetched(data));
        },
        fetchingNotificationsError: error => {
            dispatch(notificationError(error));
        },
        fetchingPendingJobInfo: () => {
            dispatch(startFetchingJobProvider());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobProviderInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchProviderJobInfoError(error))
        },
        dispatchSelectedJobRequest: job => {
            dispatch(setSelectedJobRequest(job));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProAcceptRejectJobScreen);