import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  fetchCustomerJobInfoError,
} from '../../Redux/Actions/jobsActions';
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
import Toast from 'react-native-simple-toast';
import DialogComponent from '../DialogComponent';
import {
  dbMessagesFetched,
  fetchClientMessages,
} from '../../Redux/Actions/messageActions';
import {jobCancelTask} from '../../controllers/jobs';
import Config from '../Config';
import {
  attachFile,
  sendMessageTask,
  setOnlineStatusListener,
  deregisterOnlineStatusListener,
} from '../../controllers/chats';
import {
  MessagesFooter,
  MessagesHeader,
  MessagesView,
} from '../MessagesComponents';
import {
  colorBg,
  lightGray,
  darkGray,
  white,
  themeRed,
  black,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const socket = Config.socket;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;

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

class ChatScreen extends Component {
  constructor() {
    super();
    this.state = {
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      isLoading: true,
      dialogLeftText: 'Cancel',
      imageAvailable: false,
      dialogRightText: 'Retry',
      uploadingImage: false,
    };
    this.leftButtonActon = null;
    this.rightButtonAction = null;
  }

  componentDidMount() {
    const {
      fetchedNotifications,
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      navigation,
    } = this.props;
    this.reInit(this.props);
    fetchedNotifications({type: 'messages', value: 0});
    navigation.addListener('willFocus', async () => {
      this.reInit(this.props);
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

  reInit = props => {
    const {
      userInfo: {userDetails},
      jobsInfo: {
        jobRequests,
        selectedJobRequest: {employee_id},
      },
      messagesInfo: {dataChatSource, fetched},
      generalInfo: {OnlineUsers},
      fetchClientMessages,
      navigation,
    } = props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchClientMessages(userDetails.userId);
    }
    const currRequestPos = navigation.getParam('currentPosition');
    const providerId = navigation.getParam('providerId', null) || employee_id;
    this.setState({
      senderId: userDetails.userId,
      senderImage: userDetails.image,
      senderName: userDetails.username,
      inputMessage: '',
      showButton: false,
      dataChatSource: dataChatSource[employee_id] || [],
      isLoading: !fetched,
      isUploading: false,
      isJobAccepted:
        jobRequests[currRequestPos] &&
        jobRequests[currRequestPos].status === 'Accepted',
      requestStatus:
        jobRequests[currRequestPos] && jobRequests[currRequestPos].status,
      receiverId:
        jobRequests[currRequestPos] && jobRequests[currRequestPos].employee_id,
      receiverName:
        (jobRequests[currRequestPos] &&
          jobRequests[currRequestPos].employee_details.name) ||
        (jobRequests[currRequestPos] &&
          jobRequests[currRequestPos].employee_details.username),
      receiverImage:
        (jobRequests[currRequestPos] &&
          jobRequests[currRequestPos].employee_details.imageSource) ||
        (jobRequests[currRequestPos] &&
          jobRequests[currRequestPos].employee_details.image),
      serviceName:
        jobRequests[currRequestPos] && jobRequests[currRequestPos].service_name,
      orderId:
        jobRequests[currRequestPos] && jobRequests[currRequestPos].order_id,
      titlePage: navigation.state.params.titlePage,
      provider_FCM_id:
        jobRequests[currRequestPos] &&
        jobRequests[currRequestPos].employee_details.fcm_id,
      dataChatSourceSynced: false,
      liveChatStatus: OnlineUsers[providerId]
        ? OnlineUsers[providerId].status
        : '0',
      imageAvailable:
        jobRequests[currRequestPos] &&
        jobRequests[currRequestPos].imageAvailable,
      selectedStatus: '0',
      showDialog: false,
      dialogType: null,
      dialogTitle: '',
      dialogDesc: '',
      dialogLeftText: 'Cancel',
      dialogRightText: 'Retry',
    });
    setOnlineStatusListener({
      OnlineUsers,
      userId: providerId,
      setStatus: (selectedStatus, online) =>
        this.setState({
          selectedStatus,
          online,
        }),
    });
  };

  componentDidUpdate() {
    const {
      messagesInfo: {fetched, dataChatSource},
      jobsInfo: {
        selectedJobRequest: {employee_id},
        jobRequests,
      },
      generalInfo: {OnlineUsers},
      navigation,
    } = this.props;
    const currRequestPos = navigation.getParam('currentPosition');
    const providerId =
      navigation.getParam('providerId', null) ||
      jobRequests[currRequestPos].employee_id;
    const {
      isLoading,
      dataChatSourceSynced,
      liveChatStatus,
      selectedStatus,
    } = this.state;
    const localDataChatSource = this.state.dataChatSource;
    if (fetched && isLoading) this.setState({isLoading: false});

    if (
      JSON.stringify(dataChatSource[employee_id]) !==
        JSON.stringify(localDataChatSource) &&
      !dataChatSourceSynced
    )
      this.setState({
        dataChatSource: dataChatSource[employee_id],
        dataChatSourceSynced: true,
      });
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
    else if ((titlePage = 'ProviderDetails'))
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
      sendMessageTask: this.sendMessageTaskCustomer,
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

  sendMessageTaskCustomer = async (type = 'text', altMessage) =>
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
      duration === Toast.LONG ||
      duration === Toast.SHORT
    )
      Toast.show(message, duration);
    else Toast.show(message);
  };

  jobCancelTaskChat = async () =>
    await jobCancelTask({
      userType: 'Customer',
      currRequestPos: this.props.navigation.getParam('currentPosition'),
      toggleIsLoading: this.changeWaitingDialogVisibility,
      updatePendingJobInfo: this.props?.fetchedPendingJobInfo,
      jobRequests: this.props?.jobsInfo?.jobRequests,
      userDetails: this.props?.userInfo?.userDetails,
      onError: msg => {
        this.leftButtonActon = () => {
          this.setState({
            isLoading: false,
            showDialog: false,
            dialogType: null,
          });
        };
        this.rightButtonAction = () => {
          this.jobCancelTaskChat();
          this.setState({
            showDialog: false,
            dialogType: null,
          });
        };
        this.setState({
          isLoading: false,
          showDialog: true,
          dialogType: 'error',
          dialogTitle: 'OOPS!',
          dialogDesc: msg,
          dialogLeftText: 'Cancel',
          dialogRightText: 'Retry',
        });
      },
      navigate: this.props?.navigation?.navigate,
    });

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

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  changeDialogVisibility = () =>
    this.setState(prevState => ({showDialog: !prevState.showDialog}));

  render() {
    console.log('reg chat');
    const {
      requestStatus,
      showButton,
      online,
      senderId,
      receiverId,
      showDialog,
      dialogType,
      dialogTitle,
      dialogDesc,
      dialogLeftText,
      dialogRightText,
      imageAvailable,
      receiverImage,
      receiverName,
      uploadingImage,
      isLoading,
    } = this.state;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <DialogComponent
          isDialogVisible={showDialog && dialogType !== null ? true : false}
          transparent={true}
          animation="fade"
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
            style={{marginBottom: requestStatus === 'Pending' ? 100 : 50}}
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
              senderId={senderId}
              receiverId={receiverId}
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
          <View
            style={[
              styles.footerContainer,
              {minHeight: requestStatus === 'Pending' ? 120 : 50},
            ]}>
            {/*<View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>*/}
            {requestStatus === 'Pending' ? (
              <View
                style={{
                  flex: 1,
                  width: screenWidth,
                  justifyContent: 'center',
                  backgroundColor: themeRed,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                  }}>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.jobCancelTaskChat}>
                    <Text
                      style={[
                        styles.text,
                        {color: themeRed, fontWeight: 'bold'},
                      ]}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            <MessagesFooter
              sendMessageTask={this.sendMessageTaskCustomer}
              showButton={showButton}
              attachFileTask={this.attachFileCustomer}
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
                    this.props.navigation.navigate('MapDirection', {
                      titlePage: 'ProviderDetails',
                    })
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
    shadowOffset: {width: 0, height: 3},
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
    maxWidth: screenWidth / 2 + 30,
    flexDirection: 'row',
    backgroundColor: lightGray,
    padding: 10,
    borderRadius: 5,
    alignContent: 'center',
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
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 10,
    borderRadius: 25,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    flex: 1,
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
    backgroundColor: '#16B5F3',
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
    marginVertical: 5,
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
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
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
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobCustomer());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobCustomerInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchCustomerJobInfoError(error));
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
)(ChatScreen);
