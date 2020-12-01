import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, TextInput, Dimensions,
    BackHandler, ActivityIndicator, ImageBackground, StatusBar, Platform,
    KeyboardAvoidingView,
} from 'react-native';
import moment from 'moment';
import { cloneDeep } from 'lodash';
import {
    dbMessagesFetched
} from '../../Redux/Actions/messageActions';
import database from '@react-native-firebase/database';
import { chatDate } from '../../misc/helpers';
import Config from '../Config';
import { startFetchingNotification, notificationsFetched, notificationError } from '../../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../../Redux/Actions/messageActions';
import { colorPrimary, lightGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../../Constants/colors';
import style from './styles';

const screenWidth = Dimensions.get('window').width;
const socket = Config.socket;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;

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

class ProChatScreen extends Component {
    constructor(props) {
        super()
        const {
            messagesInfo: { dataChatSource, fetched },
            navigation: { state: { params: { currentPos } } },
            jobsInfo: { allJobRequestsProviders, selectedJobRequest: { user_id } },
            navigation,
            userInfo: { providerDetails },
            generalInfo: { OnlineUsers }
        } = props;
        this.state = {
            showButton: false,
            senderId: providerDetails.providerId,
            senderName: providerDetails.name + " " + providerDetails.surname,
            senderImage: providerDetails.imageSource,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[user_id] || [],
            isLoading: !fetched,
            //From ProDashboardScreen && ProMapDirection
            pageTitle: navigation.state.params.pageTitle,
            receiverId: allJobRequestsProviders[currentPos].user_id,
            receiverName: allJobRequestsProviders[currentPos].user_details.username,
            receiverImage: allJobRequestsProviders[currentPos].user_details.image,
            orderId: allJobRequestsProviders[currentPos].order_id,
            serviceName: allJobRequestsProviders[currentPos].service_details.service_name,
            userImageAvailable: allJobRequestsProviders[currentPos].imageAvailable,
            customer_FCM_id: allJobRequestsProviders[currentPos].user_details.fcm_id,
            selectedStatus: '0',
            liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
            online: false
        };
    };

    componentDidMount() {
        const { 
            navigation, 
            jobsInfo: { selectedJobRequest: { user_id } },
            generalInfo: { OnlineUsers }
        } = this.props;
        
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        const userRef = database().ref(`users/${user_id}`);
        userRef.on('child_changed', result => {
            if (result && result.key === "status" && user_id) {
                if (OnlineUsers[user_id] && result.val() === '1') this.setState({ selectedStatus: result.val(), online: OnlineUsers[user_id] && OnlineUsers[user_id].status === '1' });
                else this.setState({ online: result.val() === '1', selectedStatus: result.val() });
            } else console.log('provider id unavailable');
        });

        userRef.once('value', data => {
            console.log('data', data)
            if (data) {
                const { status } = data.val();
                console.log('status', status)
                if (user_id) {
                    if (OnlineUsers[user_id]) {
                        if (OnlineUsers[user_id] && status === '1') this.setState({ selectedStatus: status, online: OnlineUsers[user_id] && OnlineUsers[user_id].status === '1' });
                        else {
                            this.setState({ online: status === '1', selectedStatus: status });
                        }
                    }
                }
            }
        });
    }

    reInit = () => {
        const {
            messagesInfo: { dataChatSource, fetched },
            navigation: { state: { params: { currentPos } } },
            jobsInfo: { allJobRequestsProviders, selectedJobRequest: { user_id } },
            navigation,
            userInfo: { providerDetails }
        } = this.props;
        this.setState({
            showButton: false,
            senderId: providerDetails.providerId,
            senderName: providerDetails.name + " " + providerDetails.surname,
            senderImage: providerDetails.imageSource,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[user_id] || [],
            isLoading: !fetched,
            //From ProDashboardScreen && ProMapDirection
            pageTitle: navigation.state.params.pageTitle,
            receiverId: allJobRequestsProviders[currentPos].user_id,
            receiverName: allJobRequestsProviders[currentPos].user_details.username,
            receiverImage: allJobRequestsProviders[currentPos].user_details.image,
            orderId: allJobRequestsProviders[currentPos].order_id,
            serviceName: allJobRequestsProviders[currentPos].service_details.service_name,
            userImageAvailable: allJobRequestsProviders[currentPos].imageAvailable,
            customer_FCM_id: allJobRequestsProviders[currentPos].user_details.fcm_id,
        });
    }

    componentDidUpdate() {
        const { 
            messagesInfo: { fetched, dataChatSource }, 
            jobsInfo: { selectedJobRequest: { user_id } },
            generalInfo: { OnlineUsers },
        } = this.props;
        console.log('online users', OnlineUsers)
        console.log('user id', user_id)
        const { isLoading, liveChatStatus, selectedStatus } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        if (JSON.stringify(dataChatSource[user_id]) !== JSON.stringify(localDataChatSource))
            this.setState({ dataChatSource: dataChatSource[user_id] });
        if (OnlineUsers[user_id] && liveChatStatus !== OnlineUsers[user_id].status) {
            this.setState({ online: OnlineUsers[user_id].status === '1' && selectedStatus === '1', liveChatStatus: OnlineUsers[user_id].status })
        }
    }

    handleBackButtonClick = () => {
        const { pageTitle } = this.state;
        if (pageTitle === "ProMapDirection")
            this.props.navigation.navigate("ProMapDirection");
        else if (pageTitle === "ProDashboard")
            this.props.navigation.navigate("ProDashboard");
        else if (pageTitle === 'ProAllMessage')
            this.props.navigation.navigate("ProAllMessage");
        else
            this.props.navigation.goBack();
        return true;
    }

    showHideButton = (input) => {
        this.setState({
            inputMessage: input,
        });
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
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, customer_FCM_id, receiverName, serviceName, orderId } = this.state;
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
                userType: 'employee',
                textMessage: inputMessage,
                senderId,
                senderName,
                senderImage,
                receiverId,
                receiverImage,
                fcm_id: customer_FCM_id,
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
        let { showButton, online } = this.state;
        console.log('online', online)
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.subContainer}
                    source={require('../../icons/bg_chat.png')}>
                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
                                onPress={() => this.state.pageTitle == 'ProMapDirection' ? this.props.navigation.navigate("ProMapDirection") : this.props.navigation.navigate("ProDashboard")}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 20 }}
                                source={{ uri: this.state.receiverImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName}
                            </Text>
                        </View>
                    </View>

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
                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Type a message'
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
    subContainer: {
        backgroundColor: 'yellow',
        flex: 1
    },
    listView: {
        flex: 1,
        padding: 5,
    },
    footer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        marginBottom: 0,
        bottom: 0, //Footer
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
        messagesInfo: state.messagesInfo,
        generalInfo: state.generalInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchMessages: () => {
            dispatch(startFetchingMessages());
        },
        fetchedMessages: data => {
            dispatch(messagesFetched(data));
        },
        fetchingMessagesError: error => {
            dispatch(messagesError(error));
        },
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

export default connect(mapStateToProps, mapDispatchToProps)(ProChatScreen);