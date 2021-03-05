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
import {cloneDeep} from 'lodash';
import FilePickerManager from 'react-native-file-picker';
import database from '@react-native-firebase/database';
import {dbMessagesFetched} from '../../Redux/Actions/messageActions';
import moment from 'moment';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {imageExists} from '../../misc/helpers';
import {uploadAttachment} from '../../controllers/storage';
import Config from '../Config';
import {lightGray, colorBg, white} from '../../Constants/colors';
import {
  MessagesFooter,
  MessagesHeader,
  MessagesView,
} from '../MessagesComponents';
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
      serviceName: props.navigation.state.params.serviceName,
      orderId: props.navigation.state.params.orderId,
      titlePage: props.navigation.state.params.pageTitle,
      isJobAccepted: props.navigation.state.params.isJobAccepted,
      proImageAvailable: null,
      provider_FCM_id: props.navigation.state.params.fcmId,
      selectedStatus: '0',
      liveChatStatus: '0',
      uploadingImage: false,
      online: false,
    };
  }

  componentDidMount() {
    const {
      fetchedNotifications,
      navigation,
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    const providerId = employee_id;
    fetchedNotifications({type: 'messages', value: 0});
    imageExists(this.props.navigation.state.params.providerImage).then(
      proImageAvailable => {
        this.setState({proImageAvailable});
      },
    );
    navigation.addListener('willFocus', async () => {
      this.reInit();
      BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    const userRef = database().ref(`users/${providerId}`);
    userRef.on('child_changed', result => {
      if (result && result.key === 'status' && providerId) {
        if (OnlineUsers[providerId] && result.val() === '1')
          this.setState({
            selectedStatus: result.val(),
            online:
              OnlineUsers[providerId] && OnlineUsers[providerId].status === '1',
          });
        else
          this.setState({
            online: result.val() === '1',
            selectedStatus: result.val(),
          });
      } else console.log('provider id unavailable');
    });

    userRef.once('value', data => {
      if (data) {
        const {status} = data.val();
        if (providerId) {
          if (OnlineUsers[providerId]) {
            if (OnlineUsers[providerId] && status === '1')
              this.setState({
                selectedStatus: status,
                online:
                  OnlineUsers[providerId] &&
                  OnlineUsers[providerId].status === '1',
              });
            else {
              this.setState({online: status === '1', selectedStatus: status});
            }
          }
        }
      }
    });
  }

  reInit = () => {
    const props = this.props;
    const {
      userInfo: {userDetails},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
    } = props;
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
      serviceName: props.navigation.state.params.serviceName,
      orderId: props.navigation.state.params.orderId,
      titlePage: props.navigation.state.params.pageTitle,
      isJobAccepted: props.navigation.state.params.isJobAccepted,
      proImageAvailable: null,
      provider_FCM_id: props.navigation.state.params.fcmId,
    });
  };

  componentDidUpdate() {
    const {
      messagesInfo: {fetched, dataChatSource},
      jobsInfo: {
        selectedJobRequest: {employee_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    const {isLoading, liveChatStatus, selectedStatus} = this.state;
    const providerId = employee_id;
    const localDataChatSource = this.state.dataChatSource;
    if (fetched && isLoading) this.setState({isLoading: false});
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
    if (titlePage == 'MapDirection')
      navigation.navigate('MapDirection', {
        titlePage: 'Chat',
      });
    else if (titlePage == 'ProviderDetails')
      navigation.navigate('ProviderDetails');
    else if (titlePage === 'AllMessage') navigation.navigate('AllMessage');
    else navigation.goBack();
    return true;
  };

  showHideButton = input => {
    this.setState({
      inputMessage: input,
    });
    if (input == '') {
      this.setState({
        showButton: false,
      });
    } else {
      this.setState({
        showButton: true,
      });
    }
  };

  attachFile = async () => {
    const {senderId, receiverId} = this.state;
    const {dbMessagesFetched, messagesInfo} = this.props;
    let newMessages = cloneDeep(messagesInfo.messages);
    const time = moment().toISOString();
    const date =
      new Date().getDate() +
      '/' +
      (new Date().getMonth() + 1) +
      '/' +
      new Date().getFullYear();
    this.setState({
      inputMessage: '',
      showButton: false,
    });
    try {
      FilePickerManager.showFilePicker(null, async response => {
        this.setState({uploadingImage: true});
        let urlText = response.uri;
        const ext = response.fileName.split('.').pop();
        const altMessage = {
          name: response.fileName,
          ext,
          fileType: response.type,
          uri: urlText,
          path: response.path,
        };
        if (newMessages[receiverId])
          newMessages[receiverId].push({
            message: urlText,
            file: altMessage,
            recipient: receiverId,
            sender: senderId,
            local: true,
            notUploaded: true,
            time,
            type: 'image',
            date,
          });
        else {
          newMessages[receiverId] = [];
          newMessages[receiverId].push({
            message: urlText,
            file: altMessage,
            recipient: receiverId,
            sender: senderId,
            notUploaded: true,
            local: true,
            type: 'image',
            time,
            date,
          });
        }
        dbMessagesFetched(newMessages);
        //SetTimeout(() => this.setState({uploadingImage: false}), 500);
        const newUrlText = await uploadAttachment(response);
        altMessage.uri = newUrlText;
        if (newUrlText) {
          this.sendMessageTask('image', altMessage);
          this.setState({uploadingImage: false});
        }
      });
    } catch (e) {
      SimpleToast('Something went wrong, try again later', SimpleToast.SHORT);
    }
  };

  sendMessageTask = async (type = 'text', altMessage) => {
    const {
      inputMessage,
      senderId,
      senderName,
      senderImage,
      receiverId,
      receiverImage,
      provider_FCM_id,
      receiverName,
      serviceName,
      orderId,
    } = this.state;
    const {dbMessagesFetched, messagesInfo} = this.props;
    let newMessages = cloneDeep(messagesInfo.messages);
    const time = moment().toISOString();
    const date =
      new Date().getDate() +
      '/' +
      (new Date().getMonth() + 1) +
      '/' +
      new Date().getFullYear();
    this.setState({
      inputMessage: '',
      showButton: false,
    });
    if (inputMessage.length > 0 || (altMessage && type === 'image')) {
      const messageObj = {
        type,
        userType: 'client',
        textMessage: inputMessage || altMessage.uri,
        file: altMessage,
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
        date,
      };
      if (type === 'text') {
        if (newMessages[receiverId])
          newMessages[receiverId].push({
            message: inputMessage,
            recipient: receiverId,
            sender: senderId,
            time,
            type,
            date,
          });
        else {
          newMessages[receiverId] = [];
          newMessages[receiverId].push({
            message: inputMessage,
            recipient: receiverId,
            sender: senderId,
            type,
            time,
            date,
          });
        }
      } else {
        newMessages[receiverId][
          newMessages[receiverId].length - 1
        ].notUploaded = false;
        dbMessagesFetched(newMessages);
      }
      dbMessagesFetched(newMessages);
      socket.emit('sent-message', messageObj);
    }
  };

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  render() {
    const {
      showButton,
      receiverImage,
      receiverId,
      senderId,
      receiverName,
      online,
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
              uploadingImage={this.state.uploadingImage}
              messagesInfo={this.props.messagesInfo}
            />
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
            <MessagesFooter
              sendMessageTask={this.sendMessageTask}
              attachFileTask={this.attachFile}
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChatAfterBookingDetailsScreen);
