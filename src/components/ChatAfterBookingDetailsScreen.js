import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text,
    TextInput, Dimensions, ActivityIndicator,
    BackHandler, ImageBackground, StatusBar, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import {
    dbMessagesFetched
} from '../Redux/Actions/messageActions';
import moment from 'moment';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { imageExists, chatDate } from '../misc/helpers';
import Config from './Config';
import { colorPrimary, colorPrimaryDark, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';
import { cloneDeep } from 'lodash';
import style from './chatStyle';

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
        }
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
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
        const { messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { employee_id } } } = this.props;
        const { isLoading } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        if (JSON.stringify(dataChatSource[employee_id]) !== JSON.stringify(localDataChatSource))
            this.setState({ dataChatSource: dataChatSource[employee_id] });
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
        const { navigation: { state: { params: { providerImage } } } } = this.props
        const { showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.container}
                    source={require('../icons/bg_chat.png')}>

                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
                                onPress={this.handleBackButtonClick}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10 }}
                                source={{ uri: providerImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName + " "}{this.state.surname}
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
                                color="red"
                                size="large" />
                        </View>
                    )}
                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
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
                                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                                <TouchableOpacity style={styles.textViewDirection}
                                    onPress={() => this.props.navigation.navigate("MapDirection")}>
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
        backgroundColor: colorBg,
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
        bottom: 0, //Footer
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