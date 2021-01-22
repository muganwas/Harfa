import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../../Redux/Actions/notificationActions';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError } from '../../Redux/Actions/jobsActions';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, Dimensions,
    ActivityIndicator, BackHandler, ImageBackground, StatusBar, Platform,
    KeyboardAvoidingView, ScrollView
} from 'react-native';
import moment from 'moment';
import { cloneDeep, clone } from 'lodash';
import database from '@react-native-firebase/database';
import DialogComponent from '../DialogComponent';
import {
    dbMessagesFetched
} from '../../Redux/Actions/messageActions';
import Config from '../Config';
import { MessagesFooter, MessagesHeader, MessagesView } from '../MessagesComponents';
import { colorBg, lightGray, darkGray, white, themeRed, black } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const socket = Config.socket;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";

const StatusBarPlaceHolder = () => {
    return (
        ios ?
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

class ChatScreen extends Component {
    constructor(props) {
        super();
        this.state = {}
        this.reInit(props);
        this.leftButtonActon = null;
        this.rightButtonAction = null;
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
        fetchedNotifications({ type: 'messages', value: 0 });
        navigation.addListener('willFocus', async () => {
            this.reInit(this.props);
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    reInit = (props) => {
        const {
            userInfo: { userDetails },
            jobsInfo: { allJobRequestsClient, selectedJobRequest: { employee_id } },
            messagesInfo: { dataChatSource, fetched },
            generalInfo: { OnlineUsers },
            navigation
        } = props;
        const onlineUsers = clone(OnlineUsers);
        const providerId = navigation.getParam('providerId', null) || allJobRequestsClient[currRequestPos].employee_id;
        const currRequestPos = navigation.getParam('currentPosition');
        this.setState({
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[employee_id] || [],
            isLoading: !fetched,
            isUploading: false,
            isJobAccepted: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].status === 'Accepted',
            requestStatus: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].status,
            receiverId: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].employee_id,
            receiverName: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].employee_details.username,
            receiverImage: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].employee_details.image,
            serviceName: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].service_details.service_name,
            orderId: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].order_id,
            titlePage: navigation.state.params.titlePage,
            provider_FCM_id: allJobRequestsClient[currRequestPos] && allJobRequestsClient[currRequestPos].employee_details.fcm_id,
            dataChatSourceSynced: false,
            liveChatStatus: OnlineUsers[providerId] ? OnlineUsers[providerId].status : '0',
            selectedStatus: '0',
            showDialog: false,
            dialogType: null,
            dialogTitle: '',
            dialogDesc: '',
            dialogLeftText: 'Cancel',
            dialogRightText: 'Retry'
        });
        const userRef = database().ref(`users/${providerId}`);
        userRef.on('child_changed', result => {
            if (result && result.key === "status" && providerId) {
                if (onlineUsers[providerId] && result.val() === '1') this.setState({ selectedStatus: result.val(), online: onlineUsers[providerId] && onlineUsers[providerId].status === '1' });
                else this.setState({ online: result.val() === '1', selectedStatus: result.val() });
            } else console.log('provider id unavailable');
        });

        userRef.once('value', data => {
            if (data) {
                const { status } = data.val();
                if (providerId) {
                    if (onlineUsers[providerId]) {
                        if (onlineUsers[providerId] && status === '1') this.setState({ selectedStatus: status, online: onlineUsers[providerId] && onlineUsers[providerId].status === '1' });
                        else {
                            this.setState({ online: status === '1', selectedStatus: status, });
                        }
                    }
                }
            }
        });
    }

    componentDidUpdate() {
        const {
            messagesInfo: { fetched, dataChatSource },
            jobsInfo: { selectedJobRequest: { employee_id }, allJobRequestsClient },
            generalInfo: { OnlineUsers },
            navigation
        } = this.props;
        const currRequestPos = navigation.getParam('currentPosition');
        const providerId = navigation.getParam('providerId', null) || allJobRequestsClient[currRequestPos].employee_id;
        const { isLoading, dataChatSourceSynced, liveChatStatus, selectedStatus } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });

        if (JSON.stringify(dataChatSource[employee_id]) !== JSON.stringify(localDataChatSource) && !dataChatSourceSynced)
            this.setState({ dataChatSource: dataChatSource[employee_id], dataChatSourceSynced: true });
        if (OnlineUsers[providerId] && liveChatStatus !== OnlineUsers[providerId].status) {
            this.setState({ online: OnlineUsers[providerId].status === '1' && selectedStatus === '1', liveChatStatus: OnlineUsers[providerId].status })
        }
    }

    handleBackButtonClick = () => {
        const { titlePage } = this.state;
        const { navigation } = this.props;
        if (titlePage == 'MapDirection')
            navigation.navigate("MapDirection", {
                titlePage: "Chat"
            });
        else if (titlePage == 'ProviderDetails')
            navigation.navigate("ProviderDetails");
        else if (titlePage === "AllMessage")
            navigation.navigate("AllMessage");
        else
            navigation.goBack();
        return true;
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

    sendMessageTask = async () => {
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, provider_FCM_id, receiverName, serviceName, orderId } = this.state;
        const { dbMessagesFetched, messagesInfo } = this.props;
        const newMessages = cloneDeep(messagesInfo.messages);
        const time = moment().toISOString();
        const date = new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear();
        this.setState({
            inputMessage: '',
            showButton: false,
        });
        if (inputMessage.length > 0) {
            const messageObj = {
                type: 'text',
                userType: 'client',
                textMessage: inputMessage,
                senderId,
                senderName,
                senderImage,
                receiverId,
                receiverImage,
                fcm_id: provider_FCM_id,
                receiverName,
                serviceName,
                orderId,
                time,
                date
            }
            newMessages[receiverId].push({ message: inputMessage, recipient: receiverId, sender: senderId, time, date });
            dbMessagesFetched(newMessages);
            socket.emit('sent-message', messageObj);
        }
    }

    jobCancelTask = () => {
        const { fetchedPendingJobInfo, jobsInfo: { jobRequests, selectedJobRequest: { employee_id } } } = this.props;
        let currRequestPos;
        jobRequests.map((obj, key) => {if (obj.employee_id === employee_id) currRequestPos = key});
        var newJobRequests = cloneDeep(jobRequests);
        this.setState({
            isLoading: true
        });

        const data = {
            main_id: jobRequests[currRequestPos].id,
            chat_status: '1',
            status: 'Canceled',
            'notification': {
                "fcm_id": jobRequests[currRequestPos].fcm_id,
                "title": "Job Canceled",
                "type": "JobCancellation",
                "body": 'Job request has been canceled by client' + ' Request Id : ' + jobRequests[currRequestPos].order_id,
                "save_notification": true,
                "user_id": this.state.senderId,
                "employee_id": employee_id,
                "order_id": jobRequests[currRequestPos].order_id,
                "notification_by": "Customer",
                "data": {
                    ProviderId: jobRequests[currRequestPos].employee_id,
                    image: jobRequests[currRequestPos].image ? jobRequests[currRequestPos].image : 'null',
                    fcmId: jobRequests[currRequestPos].fcm_id,
                    name: jobRequests[currRequestPos].name,
                    surname: jobRequests[currRequestPos].surname,
                    mobile: jobRequests[currRequestPos].mobile,
                    description: jobRequests[currRequestPos].description,
                    address: jobRequests[currRequestPos].address,
                    lat: jobRequests[currRequestPos].lat,
                    lang: jobRequests[currRequestPos].lang,
                    serviceName: jobRequests[currRequestPos].service_name,
                    orderId: jobRequests[currRequestPos].order_id,
                    mainId: jobRequests[currRequestPos].id,
                    chat_status: jobRequests[currRequestPos].chat_status,
                    status: 'Canceled',
                    delivery_address: jobRequests[currRequestPos].delivery_address,
                    delivery_lat: jobRequests[currRequestPos].delivery_lat,
                    delivery_lang: jobRequests[currRequestPos].delivery_lang,
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
                if (responseJson.result) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    })

                    newJobRequests.splice(currRequestPos, 1);
                    fetchedPendingJobInfo(newJobRequests);
                    this.props.navigation.navigate("Dashboard");
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
                        dialogDesc: "Something went wrong, try again later",
                        dialogLeftText: 'Cancel',
                        dialogRightText: 'Ok'
                    });
                }
            })
            .catch((error) => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    handleBackButtonClick = () => {
        const { titlePage } = this.state;
        const { navigation } = this.props;
        if (titlePage == 'MapDirection')
            navigation.navigate("MapDirection", {
                titlePage: "Chat"
            });
        else if (titlePage == 'ProviderDetails')
            navigation.navigate("ProviderDetails");
        else if (titlePage === "AllMessage")
            navigation.navigate("AllMessage")
        else
            navigation.goBack();
        return true;
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    changeDialogVisibility = () => this.setState(prevState => ({ showDialog: !prevState.showDialog }))

    render() {
        const { requestStatus, showButton, online, senderId, receiverId, showDialog, dialogType,
            dialogTitle, dialogDesc, dialogLeftText, dialogRightText } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
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
                <ImageBackground style={styles.container}
                    source={require('../../icons/bg_chat.png')}>
                    <MessagesHeader
                        receiverImage={this.state.receiverImage}
                        receiverName={this.state.receiverName}
                        online={online}
                        handleBackButtonClick={this.handleBackButtonClick}
                    />
                    <ScrollView
                        style={{ marginBottom: requestStatus === 'Pending' ? 100 : 50 }}
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
                        <MessagesView
                            senderId={senderId}
                            receiverId={receiverId}
                        />
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                    <View style={[styles.footerContainer, { minHeight: requestStatus === 'Pending' ? 120 : 50 }]}>
                        {/*<View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>*/}
                        {requestStatus === 'Pending' ? <View style={{
                            flex: 1, width: screenWidth, justifyContent: 'center',
                            backgroundColor: themeRed, alignItems: 'center'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.jobCancelTask}>
                                    <Text style={[styles.text, { color: themeRed, fontWeight: 'bold' }]}>Cancel Request</Text>
                                </TouchableOpacity>
                            </View>
                        </View> : null}
                        <MessagesFooter
                            sendMessageTask={this.sendMessageTask}
                            showButton={showButton}
                            textChangeAction={inputMesage => this.showHideButton(inputMesage)}
                            inputMesage={this.state.inputMessage}
                        />
                        {this.state.isJobAccepted && (
                            <View style={{
                                flexDirection: 'column', width: screenWidth, height: 50, backgroundColor: 'white',
                                borderRadius: 2, alignItems: 'center', justifyContent: 'flex-start',
                            }}>
                                <View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>
                                <TouchableOpacity style={styles.textViewDirection}
                                    onPress={() => this.props.navigation.navigate("MapDirection", {
                                        "titlePage": "ProviderDetails"
                                    })}>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                        source={require('../../icons/mobile_gps.png')} />
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                        Tracking service provider
                                </Text>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                        source={require('../../icons/right_arrow.png')} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listView: {
        flex: 1,
        padding: 5,
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
    text: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: lightGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
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
    recievedContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    recievedMsg: {
        margin: 3,
        padding: 3,
        borderRadius: 3,
        color: black,
        textAlign: 'left',
        backgroundColor: "#16B5F3"
    },
    textInput: {
        flex: 4,
        backgroundColor: lightGray,
        borderRadius: 25,
        paddingHorizontal: 10,
        fontSize: 16,
        height: 50,
        marginHorizontal: 5,
    },
    textInputContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 2,
        marginVertical: 5
    },
    footerContainer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
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
    }
});

const mapStateToProps = state => {
    return {
        messagesInfo: state.messagesInfo,
        jobsInfo: state.jobsInfo,
        userInfo: state.userInfo,
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
        fetchingPendingJobInfo: () => {
            dispatch(startFetchingJobCustomer());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobCustomerInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchCustomerJobInfoError(error))
        },
        fetchingNotificationsError: error => {
            dispatch(notificationError(error));
        },
        dbMessagesFetched: messages => {
            dispatch(dbMessagesFetched(messages));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);