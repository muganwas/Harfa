import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  dbMessagesFetched,
  fetchClientMessages,
} from '../../Redux/Actions/messageActions';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import Config from '../Config';
import {lightGray, colorBg, white} from '../../Constants/colors';
import {
  MessagesFooter,
  MessagesHeader,
  MessagesView,
} from '../MessagesComponents';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import SimpleToast from 'react-native-simple-toast';

const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;
const socket = Config.socket;

const StatusBarPlaceHolder = () => {
  return ios ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

class ChatAfterBookingDetailsScreen extends Component {
  constructor(props) {
    super();
    const {
      userInfo: {userDetails},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      messagesInfo: {messages},
    } = props;
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
      receiverName:
        props.navigation.state.params.providerName +
        ' ' +
        props.navigation.state.params.providerSurname,
      receiverImage: props.navigation.state.params.providerImage,
      imageAvailable: props.navigation.state.params.imageAvailable || false,
      serviceName: props.navigation.state.params.serviceName,
      orderId: props.navigation.state.params.orderId,
      titlePage: props.navigation.state.params.pageTitle,
      isJobAccepted: props.navigation.state.params.isJobAccepted,
      provider_FCM_id: props.navigation.state.params.fcmId,
      selectedStatus: '0',
      liveChatStatus: '0',
      uploadingImage: false,
      online: false,
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const {
      fetchedNotifications,
      navigation,
      userInfo: {userDetails},
      generalInfo: {OnlineUsers},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      fetchClientMessages,
    } = this.props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchClientMessages(userDetails.userId);
    }
    fetchedNotifications({type: 'messages', value: 0});
    setOnlineStatusListener({
      OnlineUsers,
      userId: employee_id,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
    navigation.addListener('willFocus', async () => {
      this.reInit();
      BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    navigation.addListener('willBlur', () => {
      deregisterOnlineStatusListener(employee_id);
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
  }

  reInit = () => {
    const props = this.props;
    const {
      userInfo: {userDetails},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      generalInfo: {OnlineUsers},
      fetchClientMessages,
    } = props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchClientMessages(userDetails.userId);
    }
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
      receiverName:
        props.navigation.state.params.providerName +
        ' ' +
        props.navigation.state.params.providerSurname,
      receiverImage: props.navigation.state.params.providerImage,
      imageAvailable: props.navigation.state.params.imageAvailable,
      serviceName: props.navigation.state.params.serviceName,
      orderId: props.navigation.state.params.orderId,
      titlePage: props.navigation.state.params.pageTitle,
      isJobAccepted: props.navigation.state.params.isJobAccepted,
      provider_FCM_id: props.navigation.state.params.fcmId,
    });
    setOnlineStatusListener({
      OnlineUsers,
      userId: employee_id,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
  };

  componentDidUpdate() {
    const {
      messagesInfo: {dataChatSource},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    const {liveChatStatus, selectedStatus} = this.state;
    const providerId = employee_id;
    const localDataChatSource = this.state.dataChatSource;
    //if (fetched && isLoading) this.setState({isLoading: false});
    if (
      JSON.stringify(dataChatSource[employee_id]) !==
      JSON.stringify(localDataChatSource)
    )
      this.setState({dataChatSource: dataChatSource[employee_id]});
    if (
      OnlineUsers[providerId] &&
      liveChatStatus !== OnlineUsers[providerId].status
    ) {
      this.setState({
        online:
          OnlineUsers[providerId].status === '1' && selectedStatus === '1',
        liveChatStatus: OnlineUsers[providerId].status,
      });
    }
  }

  handleBackButtonClick = () => {
    const {titlePage} = this.state;
    const {navigation} = this.props;
    if (titlePage === 'MapDirection')
      navigation.navigate('MapDirection', {
        titlePage: 'Chat',
      });
    else if (titlePage === 'ProviderDetails')
      navigation.navigate('ProviderDetails');
    else if (titlePage === 'AllMessage') navigation.navigate('AllMessage');
    else navigation.goBack();
    return true;
  };

  showHideButton = input => {
    this.setState({
      inputMessage: input,
    });
    if (input === '') {
      this.setState({
        showButton: false,
      });
    } else {
      this.setState({
        showButton: true,
      });
    }
  };

  attachFileCustomer = async () =>
    await attachFile({
      senderId: this.state.senderId,
      receiverId: this.state.receiverId,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      sendMessageTask: this.sendMessageTask,
      clearInput: () =>
        this.setState({
          inputMessage: '',
          showButton: false,
        }),
      toggleUploadingImage: bool =>
        this.setState(prevState => ({
          uploadingImage:
            typeof bool === 'boolean' ? bool : !prevState.uploadingImage,
        })),
    });

  sendMessageTask = async (type = 'text', altMessage) =>
    await sendMessageTask({
      type,
      userType: 'client',
      userId: this.props?.userInfo?.userDetails?.userId,
      inputMessage: this.state.inputMessage,
      senderId: this.state.senderId,
      senderName: this.state.senderName,
      senderImage: this.state.senderImage,
      receiverId: this.state.receiverId,
      receiverName: this.state.receiverName,
      receiverImage: this.state.receiverImage,
      fcm_id: this.state.provider_FCM_id,
      serviceName: this.state.serviceName,
      orderId: this.state.orderId,
      altMessage,
      fetchMessages: this.props.fetchClientMessages,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      toggleIsLoading: bool =>
        this.setState(prevState => ({
          isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
        })),
      clearInput: () =>
        this.setState({
          inputMessage: '',
          showButton: false,
        }),
    });

  showToast = (message, duration) => {
    if (
      typeof duration === 'number' ||
      duration === SimpleToast.LONG ||
      duration === SimpleToast.SHORT
    )
      SimpleToast.show(message, duration);
    else SimpleToast.show(message);
  };

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  render() {
    console.log('after booking');
    const {
      showButton,
      receiverImage,
      receiverId,
      senderId,
      receiverName,
      imageAvailable,
      online,
      isLoading,
      uploadingImage,
    } = this.state;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <ImageBackground
          style={styles.container}
          source={require('../../icons/bg_chat.png')}>
          <MessagesHeader
            receiverImage={receiverImage}
            imageAvailable={imageAvailable}
            receiverName={receiverName}
            online={online}
            handleBackButtonClick={this.handleBackButtonClick}
          />
          <ScrollView
            ref={ref => (this.scrollView = ref)}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              alwaysBounceVertical: true,
            }}
            onContentSizeChange={(contentWidth, contentHeight) => {
              this.scrollView.scrollToEnd({animated: true});
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <MessagesView
              receiverId={receiverId}
              senderId={senderId}
              uploadingImage={uploadingImage}
              messagesInfo={this.props.messagesInfo}
            />
          </ScrollView>
          {isLoading && (
            <View style={styles.loaderStyle}>
              <ActivityIndicator
                style={{height: 80}}
                color="red"
                size="large"
              />
            </View>
          )}
          <View style={styles.footerContainer}>
            <MessagesFooter
              sendMessageTask={this.sendMessageTask}
              attachFileTask={this.attachFileCustomer}
              showButton={showButton}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              inputMesage={this.state.inputMessage}
            />
            {this.state.isJobAccepted && (
              <View
                style={{
                  flexDirection: 'column',
                  width: screenWidth,
                  height: 50,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <View
                  style={{
                    width: screenWidth,
                    height: 1,
                    backgroundColor: lightGray,
                  }}
                />
                <TouchableOpacity
                  style={styles.textViewDirection}
                  onPress={() =>
                    this.props.navigation.navigate('MapDirection')
                  }>
                  <Image
                    style={{width: 20, height: 20, marginLeft: 20}}
                    source={require('../../icons/mobile_gps.png')}
                  />
                  <Text
                    style={{
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: 16,
                      textAlign: 'center',
                      marginLeft: 10,
                    }}>
                    Tracking service provider
                  </Text>
                  <Image
                    style={{
                      width: 20,
                      height: 20,
                      marginLeft: 20,
                      position: 'absolute',
                      end: 0,
                      marginRight: 15,
                    }}
                    source={require('../../icons/right_arrow.png')}
                  />
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
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#000',
    textAlign: 'left',
    backgroundColor: '#16B5F3',
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
    color: '#000',
    backgroundColor: '#ffffff',
  },
  messagesContainer: {
    height: '100%',
    minHeight: 100,
    padding: 10,
    height: 200,
  },
  messagesSubContainer: {
    display: 'flex',
    flex: 1,
    width: '100%',
    flexDirection: 'column',
  },
});

const mapStateToProps = state => {
  return {
    messagesInfo: state.messagesInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
  };
};

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
    },
    fetchClientMessages: (senderId, callBack) => {
      dispatch(fetchClientMessages({senderId, callBack}));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChatAfterBookingDetailsScreen);
