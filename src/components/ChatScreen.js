import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError } from '../Redux/Actions/jobsActions';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, TextInput, Dimensions,
    ActivityIndicator, BackHandler, ImageBackground, StatusBar, Platform, Alert,
    KeyboardAvoidingView, ScrollView
} from 'react-native';
import {
    dbMessagesFetched
} from '../Redux/Actions/messageActions';
import Config from './Config';
import moment from 'moment';
import { chatDate } from '../misc/helpers';
import { cloneDeep } from 'lodash';
import { colorPrimary, colorPrimaryDark, colorYellow, lightGray, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';
import style from './chatStyle';

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
        const { userInfo: { userDetails }, jobsInfo: { allJobRequestsClient, selectedJobRequest: { employee_id } }, messagesInfo: { dataChatSource, fetched }, navigation } = props;
        var currRequestPos;
        Object.keys(allJobRequestsClient).map(key => {
            const currEmpId = allJobRequestsClient[key].employee_id;
            if (currEmpId === employee_id) currRequestPos = key;
        });
        this.state = {
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[employee_id] || [],
            isLoading: !fetched,
            isUploading: false,
            isJobAccepted: allJobRequestsClient[currRequestPos].status === 'Accepted',
            requestStatus: allJobRequestsClient[currRequestPos].status,
            receiverId: allJobRequestsClient[currRequestPos].employee_id,
            receiverName: allJobRequestsClient[currRequestPos].employee_details.username,
            receiverImage: allJobRequestsClient[currRequestPos].employee_details.image,
            serviceName: allJobRequestsClient[currRequestPos].service_details.service_name,
            orderId: allJobRequestsClient[currRequestPos].order_id,
            titlePage: navigation.state.params.titlePage,
            provider_FCM_id: allJobRequestsClient[currRequestPos].employee_details.fcm_id,
            dataChatSourceSynced: false
        }
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
        fetchedNotifications({ type: 'messages', value: 0 });
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    reInit = () => {
        const { userInfo: { userDetails }, jobsInfo: { allJobRequestsClient, selectedJobRequest: { employee_id } }, messagesInfo: { dataChatSource, fetched }, navigation } = this.props;
        var currRequestPos;
        Object.keys(allJobRequestsClient).map(key => {
            const currEmpId = allJobRequestsClient[key].employee_id;
            if (currEmpId === employee_id) currRequestPos = key;
        });
        this.setState({
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[employee_id] || [],
            isLoading: !fetched,
            isUploading: false,
            isJobAccepted: allJobRequestsClient[currRequestPos].status === 'Accepted',
            requestStatus: allJobRequestsClient[currRequestPos].status,
            receiverId: allJobRequestsClient[currRequestPos].employee_id,
            receiverName: allJobRequestsClient[currRequestPos].employee_details.username,
            receiverImage: allJobRequestsClient[currRequestPos].employee_details.image,
            serviceName: allJobRequestsClient[currRequestPos].service_details.service_name,
            orderId: allJobRequestsClient[currRequestPos].order_id,
            titlePage: navigation.state.params.titlePage,
            provider_FCM_id: allJobRequestsClient[currRequestPos].employee_details.fcm_id,
            dataChatSourceSynced: false
        });
    }

    componentDidUpdate() {
        const { messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { employee_id } } } = this.props;
        const { isLoading, dataChatSourceSynced } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        if (JSON.stringify(dataChatSource[employee_id]) !== JSON.stringify(localDataChatSource) && !dataChatSourceSynced)
            this.setState({ dataChatSource: dataChatSource[employee_id], dataChatSourceSynced: true });
    }

    handleBackButtonClick = () => {
        const { titlePage } = this.state;
        console.log(titlePage)
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
        let newMessages = cloneDeep(messagesInfo.messages);
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
        var currRequestPos;
        jobRequests.map((obj, key) => {
            const currEmpId = obj.employee_id;
            if (currEmpId === employee_id) currRequestPos = key;
        });
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
                "notification_by": "Client",
                "data": {
                    ProviderId: jobRequests[currRequestPos].employee_id,
                    image: jobRequests[currRequestPos].image,
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
                    Alert.alert("OOPS!", "Something went wrong, try again later");
                    this.setState({
                        isLoading: false,
                    });
                }
            })
            .catch((error) => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    renderMessages = () => {
        const { senderId, receiverId } = this.state;
        const { messagesInfo: { messages } } = this.props;
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

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    render() {
        const { requestStatus, showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.container}
                    source={require('../icons/bg_chat.png')}>

                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 10, paddingRight: 20, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center' }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10 }}
                                source={{ uri: this.state.receiverImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName + " "}{this.state.surname}
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={{ marginBottom: requestStatus === 'Pending' ? 100 : 50 }} ref={ref => this.scrollView = ref}
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
                            <View style={styles.listView}>
                                {this.renderMessages()}
                            </View>
                        </View>
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                    <View style={[styles.footer, { minHeight: requestStatus === 'Pending' ? 120 : 50 }]}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>
                        {requestStatus === 'Pending' ? <View style={{
                            flex: 1, width: screenWidth, justifyContent: 'center',
                            backgroundColor: 'white', alignItems: 'center'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.jobCancelTask}>
                                    <Text style={styles.text}>Cancel Request</Text>
                                </TouchableOpacity>
                            </View>
                        </View> :
                            null}
                        <View style={{ flex: 1, flexDirection: 'row', }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Tapez un message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>
                            <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                                        source={require('../icons/mobile_gps.png')} />
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                        Fournisseur de services de suivi
                                </Text>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                        source={require('../icons/right_arrow.png')} />
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
    footer: {
        width: screenWidth,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
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
        color: "#000",
        textAlign: 'left',
        backgroundColor: "#16B5F3"
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