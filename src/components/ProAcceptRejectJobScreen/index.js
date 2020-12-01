import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, TextInput, ScrollView, Dimensions, BackHandler, ImageBackground, StatusBar, Platform, Modal
} from 'react-native';
import { withNavigation } from 'react-navigation';
import database from '@react-native-firebase/database';
import Toast from 'react-native-simple-toast';
import Geolocation from 'react-native-geolocation-service';
import { cloneDeep } from 'lodash';
import {
    startFetchingNotification,
    notificationsFetched,
    notificationError
} from '../../Redux/Actions/notificationActions';
import {
    fetchedJobProviderInfo,
    startFetchingJobProvider,
    fetchProviderJobInfoError,
    setSelectedJobRequest,
    getAllWorkRequestPro
} from '../../Redux/Actions/jobsActions';
import { chatDate } from '../../misc/helpers';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import { colorPrimary, lightGray, colorBg, white, black, themeRed, colorGreen, darkGray } from '../../Constants/colors';
import style from './styles'

const socket = Config.socket;
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
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

class ProAcceptRejectJobScreen extends Component {

    constructor(props) {
        super()
        const {
            userInfo: { providerDetails },
            jobsInfo: { jobRequestsProviders, selectedJobRequest: { user_id } },
            messagesInfo: { dataChatSource, fetched },
            generalInfo: { OnlineUsers },
            navigation
        } = props;
        let currRequestPos = navigation.getParam('currentPos', 0);
        this.state = {
            senderId: providerDetails.providerId,
            senderImage: providerDetails.imageSource,
            senderName: providerDetails.name,
            senderSurname: providerDetails.surname,
            inputMessage: '',
            showButton: false,
            isAcceptJob: jobRequestsProviders[currRequestPos].status === "Accepted",
            isRejectJob: false,
            dataChatSource: dataChatSource[user_id] || [],
            isLoading: !fetched,
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
            currRequestPos,
            selectedStatus: '0',
            liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
            online: false
        };
    };

    componentDidMount() {
        const { navigation, jobsInfo: { selectedJobRequest: { user_id } }, generalInfo: { OnlineUsers } } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        this.setState({
            isLoading: false,
        });
        const userRef = database().ref(`users/${user_id}`);
        userRef.on('child_changed', result => {
            if (result && result.key === "status" && user_id) {
                if (OnlineUsers[user_id] && result.val() === '1') this.setState({ selectedStatus: result.val(), online: OnlineUsers[user_id] && OnlineUsers[user_id].status === '1' });
                else this.setState({ online: result.val() === '1', selectedStatus: result.val() });
            } else console.log('provider id unavailable');
        });

        userRef.once('value', data => {
            if (data) {
                const { status } = data.val();
                if (user_id) {
                    if (OnlineUsers[user_id]) {
                        if (OnlineUsers[user_id] && status === '1') this.setState({ selectedStatus: status, online: OnlineUsers[user_id] && OnlineUsers[user_id].status === '1' });
                        else {
                            this.setState({ online: status === '1', selectedStatus: status, });
                        }
                    }
                }
            }
        });
    }

    componentDidUpdate() {
        const { generalInfo: { OnlineUsers }, jobsInfo: { selectedJobRequest: { user_id } } } = this.props;
        const { liveChatStatus } = this.state;
        if (OnlineUsers[user_id] && liveChatStatus !== OnlineUsers[user_id].status) {
            this.setState({ online: OnlineUsers[user_id].status === '1' && selectedStatus === '1', liveChatStatus: OnlineUsers[user_id].status })
        }
    }

    handleBackButtonClick = () => {
        this.props.navigation.navigate("ProDashboard");
        return true;
    }

    renderMessages = () => {
        const { senderId, receiverId } = this.state;
        const { messagesInfo: { messages } } = this.props;
        if (senderId && receiverId) {
            return (
                <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                    {
                        Object.keys(messages).map(key => {
                            const usersMessages = messages[key];
                            // display messages from selected user
                            if (String(key) === String(receiverId)) {
                                return <View key={key} style={style.messagesSubContainer}>
                                    {
                                        Object.keys(usersMessages).map(key => {
                                            const sender = usersMessages[key].sender;
                                            const message = usersMessages[key].message;
                                            const time = usersMessages[key].time;
                                            if (String(sender) === String(receiverId)) {
                                                return (
                                                    <View key={key} style={style.recievedContainer}>
                                                        <View style={style.recievedMsgContainer}>
                                                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                                                            <Text style={style.recievedMsg}>{message}</Text>
                                                        </View>
                                                    </View>
                                                )
                                            }
                                            else if (String(sender) === String(senderId)) {
                                                return (
                                                    <View key={key} style={style.sentContainer}>
                                                        <View style={style.sentMsgContainer}>
                                                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                                                            <Text style={style.sentMsg}>{message}</Text>
                                                        </View>
                                                    </View>
                                                )
                                            }
                                            else return;
                                        })
                                    }
                                </View>
                            }
                        })
                    }
                </View>
            )
        }

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
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, receiverFcmId, receiverName, serviceName, orderId } = this.state;
        this.setState({
            inputMessage: '',
            showButton: false,
        });
        if (this.state.inputMessage.length > 0) {
            socket.emit('sent-message', { userType: 'employee', textMessage: inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, fcm_id: receiverFcmId, receiverName, serviceName, orderId });
        }
    }

    acceptJobTask = () => {
        this.setState({
            isLoading: true
        });
        const { userInfo: { providerDetails } } = this.props;
        const { receiverId } = this.state;
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Accepted',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Accepted",
                "type": "JobAcceptence",
                "Notification_by": "Employee",
                "user_id": receiverId,
                "employee_id": providerDetails.providerId,
                "order_id": this.state.orderId,
                "save_notification": true,
                "body": 'Your request has been accepted by ' + providerDetails.name + " " + providerDetails.surname + ' Request Id : ' + this.state.orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    image: providerDetails.imageSource ? providerDetails.imageSource : 'null',
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
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
                const { fetchedPendingJobInfo, getAllWorkRequestPro, jobsInfo: { jobRequestsProviders } } = this.props;
                const { currRequestPos } = this.state;
                var newjobRequestsProviders = cloneDeep(jobRequestsProviders);
                if (responseJson.data) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    });

                    newjobRequestsProviders[currRequestPos].chat_status = responseJson.data.chat_status;
                    newjobRequestsProviders[currRequestPos].status = responseJson.data.status;
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    getAllWorkRequestPro(providerDetails.providerId);
                    //Send Location to Firebase for tracking
                    Geolocation.getCurrentPosition(
                        (position) => {
                            //console.log("Position : " + JSON.stringify(position));
                            let locationData = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            }

                            let updates = {};
                            updates['tracking/' + this.props.navigation.state.params.orderId] = locationData;
                            database().ref().update(updates);
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
        });
        const { userInfo: { providerDetails } } = this.props;
        const { receiverId, orderId } = this.state;
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Rejected',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Rejected",
                "type": "JobRejection",
                "notification_by": "Employee",
                "save_notification": true,
                "user_id": receiverId,
                "employee_id": providerDetails.providerId,
                "order_id": orderId,
                "body": 'Your request has been rejected by ' + providerDetails.name + ' Request Id : ' + this.state.orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    image: providerDetails.imageSource ? providerDetails.imageSource : 'null',
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
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
                    newjobRequestsProviders.splice(currRequestPos, 1);
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    this.props.navigation.replace("ProDashboard");
                }
                else {
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
        const { userInfo: { providerDetails }, fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
        const { currRequestPos } = this.state;
        var newjobRequestsProviders = [...jobRequestsProviders];
        var jobData = {
            ProviderId: providerDetails.providerId,
            image: providerDetails.imageSource,
            fcmId: providerDetails.fcmId,
            name: providerDetails.name,
            surname: providerDetails.surname,
            mobile: providerDetails.mobile,
            description: providerDetails.description,
            address: providerDetails.address,
            lat: providerDetails.lat,
            lang: providerDetails.lang,
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
        this.props.navigation.navigate("ProMapDirection", {
            'pageTitle': "ProAcceptRejectJob",
        });
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { showButton } = this.state;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
                            onPress={this.handleBackButtonClick}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center', tintColor: black }}
                                source={require('../../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 20 }}
                            source={{ uri: this.state.receiverImage }} />
                        <Text style={{ color: black, fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            {this.state.receiverName}
                        </Text>
                    </View>
                </View>
                <ImageBackground style={{ flex: 1 }}
                    source={require('../../icons/bg_chat.png')}>
                    <ScrollView
                        style={{ marginBottom: 50 }}
                        ref={ref => this.scrollView = ref}
                        contentContainerStyle={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            alwaysBounceVertical: true
                        }}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            this.scrollView.scrollToEnd({ animated: true })
                        }}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'
                    >
                        <View style={{ flexDirection: 'column', marginBottom: 45 }}>
                            <View style={[styles.listView]}>
                                {this.renderMessages()}
                            </View>
                            {this.state.isAcceptJob && (
                                <TouchableOpacity style={styles.textViewDirection}
                                    onPress={this.goToMapDirection}>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                        source={require('../../icons/mobile_gps.png')} />
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                        Direction
                            </Text>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                        source={require('../../icons/right_arrow.png')} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        {(!this.state.isAcceptJob && !this.state.isRejectJob) &&
                            <View style={{
                                flex: 1, width: screenWidth, justifyContent: 'center',
                                backgroundColor: themeRed, alignItems: 'center'
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 10, marginBottom: 10 }}>
                                    <TouchableOpacity style={styles.buttonContainer}
                                        onPress={this.acceptJobTask}>
                                        <Text style={[styles.text, { color: colorGreen, fontWeight: 'bold' }]}>Accept job</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.buttonContainer}
                                        onPress={this.rejectJobTask}>
                                        <Text style={[styles.text, { color: themeRed, fontWeight: 'bold' }]}>Reject job</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        }
                        <View style={styles.textInputContainer}>
                            <TextInput style={styles.textInput}
                                placeholder='Type message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>
                            {showButton && <TouchableOpacity
                                style={styles.sendButton}
                                onPress={this.sendMessageTask}>
                                <Image style={styles.sendButtonImg}
                                    source={require('../../images/png/paper-plane-thicc.png')}
                                />
                            </TouchableOpacity>}
                        </View>

                    </View>
                </ImageBackground>
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
        flex: 1,
        padding: 5,
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: lightGray,
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
        flexDirection: 'row',
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    sendButtonImg: {
        width: 50,
        height: 30,
        tintColor: darkGray,
        resizeMode: 'contain',
    },
    sendButton: {
        height: 50,
        flexDirection: 'row',
        backgroundColor: lightGray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 10,
        borderRadius: 25,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        flex: 1
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 4,
        backgroundColor: lightGray,
        borderRadius: 25,
        height: 50,
        paddingHorizontal: 10,
        fontSize: 16,
        marginHorizontal: 5,
    },
    textInputContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 2,
        marginVertical: 5
    },
    footer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: white,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
    },
    sentContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    sentMsg: {
        margin: 3,
        padding: 3,
        borderRadius: 3,
        textAlign: 'right',
        color: "#000",
        backgroundColor: "#ffffff"
    },
    messagesContainer: {
        height: '100%',
        minHeight: 100,
        padding: 10,
        height: 200
    },
    messagesSubContainer: {
        display: 'flex',
        flex: 1,
        width: '100%',
        flexDirection: "column"
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
        generalInfo: state.generalInfo,
        userInfo: state.userInfo,
        messagesInfo: state.messagesInfo
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
        },
        getAllWorkRequestPro: providerId => {
            getAllWorkRequestPro(providerId)
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withNavigation(ProAcceptRejectJobScreen));