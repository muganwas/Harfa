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
} from 'react-native';
import {cloneDeep} from 'lodash';
import FilePickerManager from 'react-native-file-picker';
import moment from 'moment';
import {dbMessagesFetched} from '../../Redux/Actions/messageActions';
import Config from '../Config';
import database from '@react-native-firebase/database';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {lightGray, colorBg, white} from '../../Constants/colors';
import {
  MessagesView,
  MessagesHeader,
  MessagesFooter,
} from '../ProMessagesComponents';

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
      orderId: navigation.state.params.orderId,
      serviceName: navigation.state.params.serviceName,
      pageTitle: navigation.state.params.pageTitle,
      client_FCM_id: navigation.state.params.fcm_id,
      selectedStatus: '0',
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
      online: false,
    };
  }

  componentDidMount() {
    const {
      fetchedNotifications,
      navigation,
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    fetchedNotifications({type: 'messages', value: 0});
    navigation.addListener('willFocus', async () => {
      this.reInit();
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
    const userRef = database().ref(`users/${user_id}`);
    userRef.on('child_changed', result => {
      if (result && result.key === 'status' && user_id) {
        if (OnlineUsers[user_id] && result.val() === '1')
          this.setState({
            selectedStatus: result.val(),
            online: OnlineUsers[user_id] && OnlineUsers[user_id].status === '1',
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
        if (user_id) {
          if (OnlineUsers[user_id]) {
            if (OnlineUsers[user_id] && status === '1')
              this.setState({
                selectedStatus: status,
                online:
                  OnlineUsers[user_id] && OnlineUsers[user_id].status === '1',
              });
            else {
              this.setState({online: status === '1', selectedStatus: status});
            }
          }
        }
      }
    });
    this.setState({
      isLoading: false,
    });
  }

  reInit = () => {
    const {
      messagesInfo: {dataChatSource, fetched},
      navigation: {
        state: {
          params: {currentPos},
        },
      },
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      navigation,
      userInfo: {providerDetails},
    } = this.props;
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
      receiverId: navigation.state.params.receiverId,
      receiverName: navigation.state.params.receiverName,
      receiverImage: navigation.state.params.receiverImage,
      orderId: navigation.state.params.orderId,
      serviceName: navigation.state.params.serviceName,
      pageTitle: navigation.state.params.pageTitle,
      client_FCM_id: navigation.state.params.fcm_id,
    });
  };

  componentDidUpdate() {
    const {
      messagesInfo: {fetched, dataChatSource},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
      generalInfo: {OnlineUsers},
    } = this.props;
    const {isLoading, liveChatStatus, selectedStatus} = this.state;
    const localDataChatSource = this.state.dataChatSource;
    if (fetched && isLoading) this.setState({isLoading: false});
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

  attachFile = () => {};

  sendMessageTask = async () => {
    const {
      inputMessage,
      senderId,
      senderName,
      senderImage,
      receiverId,
      receiverImage,
      client_FCM_id,
      receiverName,
      serviceName,
      orderId,
    } = this.state;
    const {dbMessagesFetched, messagesInfo} = this.props;
    let newMessages = cloneDeep(messagesInfo.messages);
    this.setState({
      inputMessage: '',
      showButton: false,
    });
    const time = moment().toISOString();
    const date =
      new Date().getDate() +
      '/' +
      (new Date().getMonth() + 1) +
      '/' +
      new Date().getFullYear();
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
        fcm_id: client_FCM_id,
        receiverName,
        serviceName,
        orderId,
        time,
        date,
      };
      if (newMessages[receiverId])
        newMessages[receiverId].push({
          message: inputMessage,
          recipient: receiverId,
          sender: senderId,
          time,
          date,
        });
      else {
        newMessages[receiverId] = [];
        newMessages[receiverId].push({
          message: inputMessage,
          recipient: receiverId,
          sender: senderId,
          time,
          date,
        });
      }
      dbMessagesFetched(newMessages);
      socket.emit('sent-message', messageObj);
    }
  };

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  render() {
    let {showButton, senderId, receiverId, online} = this.state;
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
            receiverImage={this.state.receiverImage}
            receiverName={this.state.receiverName}
            handleBackButtonClick={() => this.props.navigation.goBack()}
          />
          <ScrollView
            ref={ref => (this.scrollView = ref)}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              alwaysBounceVertical: true,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={{flexDirection: 'column', marginBottom: 45}}>
              <MessagesView senderId={senderId} receiverId={receiverId} />
            </View>
          </ScrollView>

          <View style={styles.footerContainer}>
            {/*<View style={{ width: screenWidth, height: 1, backgroundColor: lightGray }}></View>*/}
            <MessagesFooter
              inputMesage={this.state.inputMessage}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              attachFileTask={this.attachFile}
              sendMessageTask={this.sendMessageTask}
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProChatAfterBookingDetailsScreen);
