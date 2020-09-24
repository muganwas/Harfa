import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text,
    FlatList, TextInput, Dimensions, ActivityIndicator,
    BackHandler, ImageBackground, StatusBar, Platform, Alert, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { imageExists, chatDate } from '../misc/helpers';
import Config from './Config';
import { colorPrimary, colorPrimaryDark, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';

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
                backgroundColor: colorPrimaryDark
            }}>
                <StatusBar
                    barStyle="light-content" />
            </View>
            :
            <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
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
        console.log('chat after booking --')
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
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
        this.props.navigation.goBack();
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
        this.setState({
            inputMessage: '',
            showButton: false,
        });
        if (inputMessage.length > 0) {
            socket.emit('sent-message', { type: 'text', userType: 'client', textMessage: inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, fcm_id: provider_FCM_id, receiverName, serviceName, orderId });
        }
    }

    renderMessages = () => {
        const { userInfo: { userDetails: { userId } }, jobsInfo: { selectedJobRequest: { employee_id } }, messagesInfo: { messages } } = this.props;
        return (
            <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                {
                    Object.keys(messages).map(key => {
                        const usersMessages = messages[key];
                        // display messages from selected user
                        if (String(key) === String(employee_id)) {
                            return <View key={key} style={styles.messagesSubContainer}>
                                {
                                    Object.keys(usersMessages).map(key => {
                                        const sender = usersMessages[key].sender;
                                        const message = usersMessages[key].message;
                                        if (String(sender) === String(employee_id)) {
                                            return (
                                                <View key={key} style={styles.recievedContainer}>
                                                    <Text style={styles.recievedMsg}>{message}</Text>
                                                </View>
                                            )
                                        }
                                        else if (String(sender) === String(userId)) {
                                            return (
                                                <View key={key} style={styles.sentContainer}>
                                                    <Text style={styles.sentMsg}>{message}</Text>
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

    renderMessageItem = ({ item }) => {
        const { userInfo: { userDetails: { userId } } } = this.props;
        if (item) {
            const senderImage = item.senderImage;
            return (
                this.state.senderId != item.senderId
                    ?
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                            <View style={styles.itemLeftChatContainer}>
                                <View style={styles.itemChatImageView}>
                                    <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                        source={{ uri: senderImage }} />
                                </View>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {chatDate(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
                    :
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                            <View style={styles.itemRightChatContainer}>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{
                                        fontSize: 8, color: 'black', textAlignVertical: 'center',
                                        color: 'white', marginRight: 5, marginTop: 4
                                    }}>
                                        {chatDate(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
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
                                onPress={() => this.props.navigation.goBack()}>
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

                    <ScrollView ref={ref => this.scrollView = ref}
                        contentContainerStyle={{
                            justifyContent: 'center', alignItems: 'center',
                            alwaysBounceVertical: true
                        }}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'>

                        <View style={{ flexDirection: 'column', marginBottom: 45 }}>
                            <View style={styles.listView}>
                                {/*<FlatList
                                    numColumns={1}
                                    data={this.state.dataChatSource}
                                    renderItem={this.renderMessageItem}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    extraData={this.state}
                                    ItemSeparatorComponent={this.renderSeparator}
                                    ref={(ref) => { this.myFlatListRef = ref }}
                                    onContentSizeChange={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }}
                                onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />*/}
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
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chatContainer: {
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      },
      input: {
        display: 'flex',
        flex: 8,
        padding: 3,
        borderWidth: 1.5,
        borderColor: '#D4D4D4',
        borderRadius: 3,
        height: 30,
      },
      userInfoContainer: {
        position: 'relative',
        backgroundColor: '#EDEDED',
        zIndex: 1
      },
      members: {
        position: 'relative',
        width: '100%',
        height: 'auto',
      },
      roundPic: {
        width: 20,
        height: 20,
        margin: 3,
        borderWidth: 1,
        borderColor: '#c9c9c9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius:10,
      },
      userInfo: {
        position: 'relative',
        margin: 5,
        zIndex: 1,
      },
      userTextInfoContainer: {
        margin: 3,
        position: 'relative',
        alignContent: 'center',
        alignItems: 'center',
        textAlignVertical:'top',
      },
      closeButton: {
        margin: 3,
        position: 'relative',
        alignContent: 'center',
        alignItems: 'center',
        textAlignVertical:'top',
        zIndex: 1,
      },
      closeButtonText: {
        textAlignVertical:'top',
        color: '#16B5F3',
      },
      username: {
        fontWeight: 'bold',
        textAlign: 'left',
        fontSize: 10,
        textTransform: 'capitalize'
      },
      availability: {
        textAlign: 'left',
        fontSize: 8,
        fontWeight: '100',
        textTransform: 'capitalize'
      },
      recievedContainer: {
        textAlign: 'left',
        alignItems: 'flex-start',
        alignContent: 'flex-start',
      },
      recievedMsg: {
        margin: 3,
        padding: 3,
        borderRadius: 3,
        alignItems: 'flex-start',
        color: "#000",
        textAlign: 'left',
        backgroundColor: "#16B5F3"
      },
      sentContainer: {
        flex: 1,
        alignContent: 'flex-end',
        alignItems: 'flex-end',
        textAlign: 'right',
      },
      sentMsg: {
        margin: 3,
        padding: 3,
        borderRadius: 3,
        alignItems: 'flex-end',
        textAlign: 'right',
        color: "#000",
        backgroundColor: "#16B5F3"
      },
      messagesContainer: {
        height: '100%',
        minHeight: 100,
        padding: 10,
        height: 200
      },
      messagesSubContainer: {
        display: 'flex'
      },
      inputContainer: {
        display: 'flex',
        flexDirection: 'row'
      },
      button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        marginLeft: 10,
        height: 30,
        minWidth: 50,
        backgroundColor: '#16B5F2'
      },
      disabledButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        marginLeft: 10,
        height: 30,
        minWidth: 50,
        backgroundColor: '#7F8787'
      },
      buttonText: {
        textAlign: 'center',
        color: '#fff'
      },
      friendActive: {
        backgroundColor: '#EDEDED',
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 0,
        marginRight: 0,
        zIndex: 0
      },
      friendHovered: {
        backgroundColor: '#FDD906',
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 0,
        marginRight: 0,
        zIndex: 0
      },
      friend: {
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 0,
        marginRight: 0,
        zIndex: 0
      },
      leftCol: {
        position: 'relative',
      },
      avatarContainer: {
        width: 30,
        height: 30,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#c9c9c9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 15
      },
      avatar: {
        position: 'relative',
        width: 30,
        height: 30
      },
      userOnline: {
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: 4,
        backgroundColor: '#0ed43f',
        width: 8,
        height: 8,
        zIndex: 1000
      },
      userOffline: {
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: 4,
        backgroundColor: '#a5a5a5',
        width: 8,
        height: 8,
        zIndex: 1000
      },
      name: {
        textTransform: 'capitalize',
        alignItems: 'center',
        textAlignVertical: 'center',
        alignContent: 'center',
        padding: 5,
        fontSize: 10,
        fontWeight: '700'
      },
      messages: {
        backgroundColor: '#b9b9b9',
        padding: 3,
        textTransform: 'lowercase',
        fontStyle: 'italic',
        color: '#f0f0f0'
      },
      conversationContainer: {
        position: 'relative',
        padding: 10,
        flex: 7,
        zIndex: 1
      },
      messagingCallToAction: {
        color: '#bbbbbb',
        textAlign: 'center'
      }
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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatAfterBookingDetailsScreen);