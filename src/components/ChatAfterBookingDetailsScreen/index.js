import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text,
    Dimensions, ActivityIndicator,
    BackHandler, ImageBackground, 
    StatusBar, Platform, KeyboardAvoidingView, 
    ScrollView
} from 'react-native';
import { cloneDeep } from 'lodash';
import database from '@react-native-firebase/database';
import {
    dbMessagesFetched
} from '../../Redux/Actions/messageActions';
import moment from 'moment';
import { startFetchingNotification, notificationsFetched, notificationError } from '../../Redux/Actions/notificationActions';
import { imageExists, chatDate } from '../../misc/helpers';
import Config from '../Config';
import { lightGray, colorBg, white } from '../../Constants/colors';
import { MessagesFooter, MessagesHeader, MessagesView } from '../MessagesComponents';
import style from './styles';

const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const socket = Config.socket;

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

class ChatAfterBookingDetailsScreen extends Component {
    constructor(props) {
        super()
        const { userInfo: { userDetails }, jobsInfo: { selectedJobRequest: { employee_id } }, messagesInfo: { messages } } = props;
        this.state = {
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: props.messagesInfo.dataChatSource[employee_id],
            messages,
            isLoading: !props.messagesInfo.fetched,
            isUpLoading: false,
            receiverId: props.navigation.state.params.providerId,
            receiverName: props.navigation.state.params.providerName + " " + props.navigation.state.params.providerSurname,
            receiverImage: props.navigation.state.params.providerImage,
            serviceName: props.navigation.state.params.serviceName,
            orderId: props.navigation.state.params.orderId,
            titlePage: props.navigation.state.params.pageTitle,
            isJobAccepted: props.navigation.state.params.isJobAccepted,
            proImageAvailable: null,
            provider_FCM_id: props.navigation.state.params.fcmId,
            selectedStatus: '0',
            liveChatStatus: '0',
            online: false
        }
    };

    componentDidMount() {
        const { 
            fetchedNotifications, navigation, 
            jobsInfo: { selectedJobRequest: { employee_id } },
            generalInfo: { OnlineUsers }
        } = this.props;
        const providerId = employee_id;
        fetchedNotifications({ type: 'messages', value: 0 });
        imageExists(this.props.navigation.state.params.providerImage).then(proImageAvailable => {
            this.setState({ proImageAvailable });
        });
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        const userRef = database().ref(`users/${providerId}`);
        userRef.on('child_changed', result => {
            if (result && result.key === "status" && providerId) {
                if (OnlineUsers[providerId] && result.val() === '1') this.setState({ selectedStatus: result.val(), online: OnlineUsers[providerId] && OnlineUsers[providerId].status === '1' });
                else this.setState({ online: result.val() === '1', selectedStatus: result.val() });
            } else console.log('provider id unavailable');
        });

        userRef.once('value', data => {
            if (data) {
                const { status } = data.val();
                if (providerId) {
                    if (OnlineUsers[providerId]) {
                        if (OnlineUsers[providerId] && status === '1') this.setState({ selectedStatus: status, online: OnlineUsers[providerId] && OnlineUsers[providerId].status === '1' });
                        else {
                            this.setState({ online: status === '1', selectedStatus: status, });
                        }
                    }
                }
            }
        });
    }

    reInit = () => {
        const props = this.props;
        const { userInfo: { userDetails }, jobsInfo: { selectedJobRequest: { employee_id } } } = props;
        this.setState({
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: props.messagesInfo.dataChatSource[employee_id],
            isLoading: !props.messagesInfo.fetched,
            isUpLoading: false,
            receiverId: props.navigation.state.params.providerId,
            receiverName: props.navigation.state.params.providerName + " " + props.navigation.state.params.providerSurname,
            receiverImage: props.navigation.state.params.providerImage,
            serviceName: props.navigation.state.params.serviceName,
            orderId: props.navigation.state.params.orderId,
            titlePage: props.navigation.state.params.pageTitle,
            isJobAccepted: props.navigation.state.params.isJobAccepted,
            proImageAvailable: null,
            provider_FCM_id: props.navigation.state.params.fcmId,
        });
    }

    componentDidUpdate() {
        const { 
            messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { employee_id } }, generalInfo: { OnlineUsers } } = this.props;
        const { isLoading, liveChatStatus, selectedStatus } = this.state;
        const providerId = employee_id;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        if (JSON.stringify(dataChatSource[employee_id]) !== JSON.stringify(localDataChatSource))
            this.setState({ dataChatSource: dataChatSource[employee_id] });
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
            navigation.navigate("AllMessage")
        else
            navigation.goBack();
        return true;
    }

    showHideButton = input => {

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
            };
            newMessages[receiverId].push({ message: inputMessage, recipient: receiverId, sender: senderId, time, date });
            dbMessagesFetched(newMessages);
            socket.emit('sent-message', messageObj);
        }
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
        const { showButton, receiverImage, receiverId, senderId, receiverName, online } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.container}
                    source={require('../../icons/bg_chat.png')}>
                    <MessagesHeader
                        receiverImage={receiverImage}
                        receiverName={receiverName}
                        online={online}
                        handleBackButtonClick={this.handleBackButtonClick}
                    />
                    <ScrollView
                        ref={ref => this.scrollView = ref}
                        contentContainerStyle={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            alwaysBounceVertical: true
                        }}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'
                    >
                        <MessagesView 
                            receiverId={receiverId}
                            senderId={senderId}
                        />
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="red"
                                size="large" />
                        </View>
                    )}
                    <View style={styles.footerContainer}>
                        {/*<View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>*/}
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
                                    onPress={() => this.props.navigation.navigate("MapDirection")}>
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
        backgroundColor: colorBg,
    },
    listView: {
        flex: 1,
        padding: 5,
    },
    footerContainer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
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
});

const mapStateToProps = state => {
    return {
        messagesInfo: state.messagesInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo,
        userInfo: state.userInfo
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
        dbMessagesFetched: messages => {
            dispatch(dbMessagesFetched(messages));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatAfterBookingDetailsScreen);