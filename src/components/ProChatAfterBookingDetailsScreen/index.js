import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
  ImageBackground,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import {
  dbMessagesFetched,
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import Config from '../Config';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {lightGray, colorBg, white} from '../../Constants/colors';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import {
  MessagesView,
  MessagesHeader,
  MessagesFooter,
} from '../ProMessagesComponents';
import {imageExists} from '../../misc/helpers';

const screenWidth = Dimensions.get('window').width;
const socket = Config.socket;
const ios = Platform.OS === 'ios';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return Platform.OS === 'ios' ? (
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

class ProChatAfterBookingDetailsScreen extends Component {
  constructor(props) {
    super();
    const {
      messagesInfo: {dataChatSource, fetched},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      navigation,
      generalInfo: {OnlineUsers},
      userInfo: {providerDetails},
    } = props;
    let imageAvailable;
    imageExists(navigation.state.params.receiverImage).then(res => {
      imageAvailable = res;
    });
    this.state = {
      showButton: false,
      senderId: providerDetails.providerId,
      senderName: providerDetails.name + ' ' + providerDetails.surname,
      senderImage: providerDetails.imageSource,
      inputMessage: '',
      showButton: false,
      dataChatSource: dataChatSource[user_id] || [],
      isLoading: !fetched,
      isUploading: false,
      receiverId: navigation.state.params.receiverId,
      receiverName: navigation.state.params.receiverName,
      receiverImage: navigation.state.params.receiverImage,
      imageAvailable,
      orderId: navigation.state.params.orderId,
      serviceName: navigation.state.params.serviceName,
      pageTitle: navigation.state.params.pageTitle,
      client_FCM_id: navigation.state.params.fcm_id,
      selectedStatus: '0',
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
      online: false,
      uploadingImage: false,
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const {
      fetchedNotifications,
      navigation,
      generalInfo: {OnlineUsers},
      userInfo: {providerDetails},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      fetchEmployeeMessages,
    } = this.props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchEmployeeMessages(providerDetails.providerId);
    }
    fetchedNotifications({type: 'messages', value: 0});
    setOnlineStatusListener({
      OnlineUsers,
      userId: user_id,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
    navigation.addListener('willFocus', async () => {
      this.reInit();
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      deregisterOnlineStatusListener(user_id);
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    this.setState({
      isLoading: false,
    });
  }

  reInit = async () => {
    const {
      messagesInfo: {dataChatSource, fetched},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      generalInfo: {OnlineUsers},
      navigation,
      userInfo: {providerDetails},
      fetchEmployeeMessages,
    } = this.props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchEmployeeMessages(providerDetails.providerId);
    }
    let imageAvailable;
    await imageExists(navigation.state.params.receiverImage).then(res => {
      imageAvailable = res;
    });
    this.setState({
      showButton: false,
      senderId: providerDetails.providerId,
      senderName: providerDetails.name + ' ' + providerDetails.surname,
      senderImage: providerDetails.imageSource,
      inputMessage: '',
      showButton: false,
      dataChatSource: dataChatSource[user_id] || [],
      isLoading: !fetched,
      isUploading: false,
      imageAvailable,
      receiverId: navigation.state.params.receiverId,
      receiverName: navigation.state.params.receiverName,
      receiverImage: navigation.state.params.receiverImage,
      orderId: navigation.state.params.orderId,
      serviceName: navigation.state.params.serviceName,
      pageTitle: navigation.state.params.pageTitle,
      client_FCM_id: navigation.state.params.fcm_id,
    });
    setOnlineStatusListener({
      OnlineUsers,
      userId: user_id,
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
        selectedJobRequest: {user_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    const {liveChatStatus, selectedStatus} = this.state;
    const localDataChatSource = this.state.dataChatSource;
    //if (fetched && isLoading) this.setState({isLoading: false});
    if (
      JSON.stringify(dataChatSource[user_id]) !==
      JSON.stringify(localDataChatSource)
    )
      this.setState({dataChatSource: dataChatSource[user_id]});
    if (
      OnlineUsers[user_id] &&
      liveChatStatus !== OnlineUsers[user_id].status
    ) {
      this.setState({
        online: OnlineUsers[user_id].status === '1' && selectedStatus === '1',
        liveChatStatus: OnlineUsers[user_id].status,
      });
    }
  }

  handleBackButtonClick = () => {
    const {pageTitle} = this.state;
    if (pageTitle === 'ProMapDirection')
      this.props.navigation.navigate('ProMapDirection');
    else if (pageTitle === 'ProDashboard')
      this.props.navigation.navigate('ProDashboard');
    else if (pageTitle === 'ProAllMessage')
      this.props.navigation.navigate('ProAllMessage');
    else this.props.navigation.goBack();
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

  attachFileProvider = async () =>
    await attachFile({
      senderId: this.state.senderId,
      receiverId: this.state.receiverId,
      dbMessagesFetched: this.props.dbMessagesFetched,
      messagesInfo: this.props.messagesInfo,
      sendMessageTask: this.sendMessageTaskProvider,
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

  sendMessageTaskProvider = async (type = 'text', altMessage) =>
    await sendMessageTask({
      type,
      userType: 'employee',
      userId: this.props?.userInfo?.providerDetails?.providerId,
      inputMessage: this.state.inputMessage,
      senderId: this.state.senderId,
      senderName: this.state.senderName,
      senderImage: this.state.senderImage,
      receiverId: this.state.receiverId,
      receiverName: this.state.receiverName,
      receiverImage: this.state.receiverImage,
      fcm_id: this.state.client_FCM_id,
      serviceName: this.state.serviceName,
      orderId: this.state.orderId,
      altMessage,
      fetchMessages: this.props.fetchEmployeeMessages,
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
      duration === Toast.LONG ||
      duration === Toast.SHORT
    )
      Toast.show(message, duration);
    else Toast.show(message);
  };

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  render() {
    const {
      showButton,
      senderId,
      receiverId,
      online,
      imageAvailable,
      receiverImage,
      receiverName,
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
            online={online}
            receiverImage={receiverImage}
            imageAvailable={imageAvailable}
            receiverName={receiverName}
            handleBackButtonClick={() => this.props.navigation.goBack()}
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
            <View style={{flexDirection: 'column', marginBottom: 45}}>
              <MessagesView
                senderId={senderId}
                receiverId={receiverId}
                uploadingImage={uploadingImage}
                messagesInfo={this.props.messagesInfo}
              />
            </View>
          </ScrollView>
          {this.state.isLoading && (
            <View style={styles.loaderStyle}>
              <ActivityIndicator
                style={{height: 80}}
                color="red"
                size="large"
              />
            </View>
          )}
          <View style={styles.footerContainer}>
            {/*<View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>*/}
            <MessagesFooter
              inputMesage={this.state.inputMessage}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              attachFileTask={this.attachFileProvider}
              sendMessageTask={this.sendMessageTaskProvider}
              showButton={showButton}
            />
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
  itemLeftChatContainer: {
    maxWidth: screenWidth / 2 + 30,
    flexDirection: 'row',
    backgroundColor: lightGray,
    padding: 10,
    borderRadius: 5,
    alignContent: 'center',
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
    justifyContent: 'center',
  },
});

const mapStateToProps = state => {
  return {
    messagesInfo: state.messagesInfo,
    userInfo: state.userInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
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
    fetchEmployeeMessages: (receiverId, callBack) => {
      dispatch(fetchEmployeeMessages({receiverId, callBack}));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProChatAfterBookingDetailsScreen);
