import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  ScrollView,
  Dimensions,
  BackHandler,
  ImageBackground,
  StatusBar,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import {withNavigation} from 'react-navigation';
import database from '@react-native-firebase/database';
import Toast from 'react-native-simple-toast';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import {cloneDeep} from 'lodash';
import {
  dbMessagesFetched,
  fetchEmployeeMessages,
} from '../../Redux/Actions/messageActions';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {
  fetchedJobProviderInfo,
  startFetchingJobProvider,
  fetchProviderJobInfoError,
  setSelectedJobRequest,
  getAllWorkRequestPro,
  fetchedDataWorkSource,
} from '../../Redux/Actions/jobsActions';
import {
  MessagesView,
  MessagesHeader,
  MessagesFooter,
} from '../ProMessagesComponents';
import {attachFile} from '../../controllers/chats';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import {
  lightGray,
  colorBg,
  white,
  themeRed,
  colorGreen,
  darkGray,
  black,
} from '../../Constants/colors';

const socket = Config.socket;
const screenWidth = Dimensions.get('window').width;
const ios = Platform.OS === 'ios';

const REJECT_ACCEPT_REQUEST = Config.baseURL + 'jobrequest/updatejobrequest';
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

class ProAcceptRejectJobScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      online: false,
      receiverName: '',
      receiverImage: '',
      imageAvailable: false,
      receiverId: '',
      senderId: '',
      showButton: false,
      uploadingImage: false,
    };
  }

  componentDidMount() {
    const {navigation} = this.props;
    this.init(this.props);
    navigation.addListener('willFocus', async () => {
      this.init(this.props);
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
    this.setState({
      isLoading: false,
    });
  }

  init = props => {
    const {
      userInfo: {providerDetails},
      jobsInfo: {
        jobRequestsProviders,
        selectedJobRequest: {user_id},
      },
      messagesInfo: {dataChatSource, fetched},
      generalInfo: {OnlineUsers},
      navigation,
      fetchEmployeeMessages,
    } = props;
    if (!socket.connected) {
      socket.close();
      socket.connect();
      fetchEmployeeMessages(providerDetails.providerId);
    }
    let currRequestPos = navigation.getParam('currentPos', 0);
    this.setState({
      senderId: providerDetails.providerId,
      senderImage: providerDetails.imageSource,
      senderName: providerDetails.name,
      senderSurname: providerDetails.surname,
      inputMessage: '',
      showButton: false,
      isAcceptJob: jobRequestsProviders[currRequestPos].status === 'Accepted',
      isRejectJob: false,
      dataChatSource: dataChatSource[user_id] || [],
      isLoading: !fetched,
      isErrorToast: false,
      receiverId: jobRequestsProviders[currRequestPos].user_id,
      receiverName: jobRequestsProviders[currRequestPos].name,
      receiverImage: jobRequestsProviders[currRequestPos].image,
      receiverMobile: jobRequestsProviders[currRequestPos].mobile,
      receiverDob: jobRequestsProviders[currRequestPos].dob,
      receiverAddress: jobRequestsProviders[currRequestPos].address,
      receiverLat: jobRequestsProviders[currRequestPos].lat,
      receiverLang: jobRequestsProviders[currRequestPos].lang,
      receiverFcmId: jobRequestsProviders[currRequestPos].fcm_id,
      orderId: jobRequestsProviders[currRequestPos].order_id,
      serviceName: jobRequestsProviders[currRequestPos].service_name,
      mainId: jobRequestsProviders[currRequestPos].id,
      deliveryAddress: jobRequestsProviders[currRequestPos].delivery_address,
      deliveryLat: jobRequestsProviders[currRequestPos].delivery_lat,
      deliveryLang: jobRequestsProviders[currRequestPos].delivery_lang,
      chatStatus: jobRequestsProviders[currRequestPos].chat_status,
      status: jobRequestsProviders[currRequestPos].status,
      imageAvailable: jobRequestsProviders[currRequestPos].imageAvailable,
      currRequestPos,
      selectedStatus: '0',
      liveChatStatus: OnlineUsers[user_id] ? OnlineUsers[user_id].status : '0',
      online: false,
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
  };

  componentDidUpdate() {
    const {
      generalInfo: {OnlineUsers},
      jobsInfo: {
        selectedJobRequest: {user_id},
      },
    } = this.props;
    const {liveChatStatus, selectedStatus} = this.state;
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

  renderSeparator = () => {
    return <View style={{height: 5, width: '100%'}} />;
  };

  convertTime = time => {
    let d = new Date(time);
    let c = new Date();
    let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
    result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (c.getDay() !== d.getDay()) {
      result =
        d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ', ' + result;
    }
    return result;
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

  sendMessageTask = async (type = 'text', altMessage) => {
    const {
      userInfo: {providerDetails},
      fetchEmployeeMessages,
    } = this.props;
    if (!socket.connected) {
      this.setState({isLoading: true});
      socket.close();
      socket.connect();
      await fetchEmployeeMessages(providerDetails.providerId, () =>
        setTimeout(() => this.setState({isLoading: false}), 200),
      );
    }
    const {
      inputMessage,
      senderId,
      senderName,
      senderImage,
      receiverId,
      receiverImage,
      receiverFcmId,
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
    if (inputMessage.length > 0 || (altMessage && type === 'image')) {
      const messageObj = {
        type,
        userType: 'employee',
        textMessage: inputMessage || altMessage.uri,
        file: altMessage,
        senderId,
        senderName,
        senderImage,
        receiverId,
        receiverImage,
        fcm_id: receiverFcmId,
        receiverName,
        serviceName,
        orderId,
        type,
        time,
        date,
      };
      if (type === 'text') {
        if (newMessages[receiverId])
          newMessages[receiverId].push({
            message: inputMessage,
            recipient: receiverId,
            sender: senderId,
            type,
            time,
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
      }
      if (socket.connected) {
        this.setState({
          inputMessage: '',
          showButton: false,
        });
        dbMessagesFetched(newMessages);
        socket.emit('sent-message', messageObj);
      } else {
        this.showToast(
          'No connection, wait a few seconds and send again or check your internet connection.',
          Toast.LONG,
        );
      }
    }
  };

  acceptJobTask = async () => {
    this.setState({
      isLoading: true,
    });
    const {
      userInfo: {providerDetails},
      jobsInfo: {dataWorkSource},
      fetchedDataWorkSource,
    } = this.props;
    const {
      receiverId,
      receiverFcmId,
      orderId,
      deliveryAddress,
      deliveryLat,
      deliveryLang,
      serviceName,
      mainId,
    } = this.state;
    let newDWS = cloneDeep(dataWorkSource);
    let dataWSPos;
    await newDWS.map((wks, i) => {
      if (wks.order_id === orderId) dataWSPos = i;
    });
    const data = {
      main_id: this.state.mainId,
      chat_status: '1',
      status: 'Accepted',
      notification: {
        fcm_id: receiverFcmId,
        title: 'Job Accepted',
        type: 'JobAcceptence',
        notification_by: 'Employee',
        user_id: receiverId,
        employee_id: providerDetails.providerId,
        order_id: orderId,
        save_notification: true,
        body:
          'Your request has been accepted by ' +
          providerDetails.name +
          ' ' +
          providerDetails.surname +
          ' Request Id : ' +
          orderId,
        data: {
          userId: receiverId,
          providerId: providerDetails.providerId,
          ProviderData: providerDetails,
          serviceName: serviceName,
          orderId: orderId,
          mainId: mainId,
          chat_status: '1',
          status: 'Accepted',
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lang: deliveryLang,
        },
      },
    };
    try {
      fetch(REJECT_ACCEPT_REQUEST, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => response.json())
        .then(responseJson => {
          const {
            fetchedPendingJobInfo,
            getAllWorkRequestPro,
            jobsInfo: {jobRequestsProviders},
          } = this.props;
          const {currRequestPos} = this.state;
          var newjobRequestsProviders = cloneDeep(jobRequestsProviders);
          if (responseJson.data) {
            this.setState({
              isLoading: false,
              isAcceptJob: true,
            });
            if (dataWSPos || dataWSPos === 0) {
              newDWS[dataWSPos].status = 'Accepted';
              fetchedDataWorkSource(newDWS);
            }
            newjobRequestsProviders[currRequestPos].chat_status =
              responseJson.data.chat_status;
            newjobRequestsProviders[currRequestPos].status =
              responseJson.data.status;
            fetchedPendingJobInfo(newjobRequestsProviders);
            getAllWorkRequestPro(providerDetails.providerId);
            //Send Location to Firebase for tracking
            Geolocation.getCurrentPosition(position => {
              let locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              let updates = {};
              updates[
                'tracking/' + this.props.navigation.state.params.orderId
              ] = locationData;
              database()
                .ref()
                .update(updates);
            });
          } else {
            //ToastAndroid.show("Something went wrong", ToastAndroid.show);
            this.setState({
              isLoading: false,
              isErrorToast: true,
            });
            this.showToast('Something went wrong');
          }
        })
        .catch(error => {
          console.log('Error >>> ' + error);
          this.setState({
            isLoading: false,
          });
        });
    } catch (e) {
      console.log('Error >>> ' + e);
      this.setState({
        isLoading: false,
      });
    }
  };

  rejectJobTask = async () => {
    this.setState({
      isLoading: true,
    });
    const {
      fetchedDataWorkSource,
      jobsInfo: {dataWorkSource},
      userInfo: {providerDetails},
    } = this.props;
    let newDWS = cloneDeep(dataWorkSource);
    let dataWSPos;
    const {orderId, receiverId} = this.state;
    console.log('new dws', newDWS);
    await newDWS.map((wks, i) => {
      if (wks.order_id === orderId) dataWSPos = i;
    });
    const data = {
      main_id: this.state.mainId,
      chat_status: '1',
      status: 'Rejected',
      notification: {
        fcm_id: this.state.receiverFcmId,
        title: 'Job Rejected',
        type: 'JobRejection',
        notification_by: 'Employee',
        save_notification: true,
        user_id: receiverId,
        employee_id: providerDetails.providerId,
        order_id: orderId,
        body:
          'Your request has been rejected by ' +
          providerDetails.name +
          ' Request Id : ' +
          this.state.orderId,
        data: {
          ProviderId: providerDetails.providerId,
          image: providerDetails.imageSource
            ? providerDetails.imageSource
            : 'null',
          fcmId: providerDetails.fcmId,
          name: providerDetails.name,
          surname: providerDetails.surname,
          mobile: providerDetails.mobile,
          description: providerDetails.description,
          address: providerDetails.address,
          lat: providerDetails.lat,
          lang: providerDetails.lang,
          serviceName: this.state.serviceName,
          orderId: this.state.orderId,
          mainId: this.state.mainId,
          chat_status: '0',
          status: 'Rejected',
          delivery_address: this.state.deliveryAddress,
          delivery_lat: this.state.deliveryLat,
          delivery_lang: this.state.deliveryLang,
        },
      },
    };
    try {
      fetch(REJECT_ACCEPT_REQUEST, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => response.json())
        .then(responseJson => {
          const {
            fetchedPendingJobInfo,
            jobsInfo: {jobRequestsProviders},
            navigation,
          } = this.props;
          const {currRequestPos} = this.state;
          var newjobRequestsProviders = cloneDeep(jobRequestsProviders);
          if (responseJson.result) {
            this.setState({
              isLoading: false,
              isRejectJob: true,
            });
            if (dataWSPos || dataWSPos === 0) {
              newDWS.splice(dataWSPos, 1);
              fetchedDataWorkSource(newDWS);
            }
            newjobRequestsProviders.splice(currRequestPos, 1);
            fetchedPendingJobInfo(newjobRequestsProviders);
            navigation.navigate('ProDashboard');
          } else {
            this.setState({
              isLoading: false,
              isErrorToast: true,
            });
            this.showToast('Something went wrong');
          }
        })
        .catch(error => {
          console.log('Error >>> ' + error);
          this.setState({
            isLoading: false,
          });
        });
    } catch (e) {
      console.log('Error >>> ' + e);
      this.setState({
        isLoading: false,
      });
    }
  };

  goToMapDirection = () => {
    this.props.navigation.navigate('ProMapDirection', {
      pageTitle: 'ProAcceptRejectJob',
    });
  };

  showToast = (message, duration) => {
    if (
      typeof duration === 'number' ||
      duration === Toast.LONG ||
      duration === Toast.SHORT
    )
      Toast.show(message, duration);
    else Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    const {
      online,
      senderId,
      receiverId,
      imageAvailable,
      receiverImage,
      receiverName,
      uploadingImage,
    } = this.state;
    const {messagesInfo} = this.props;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={ios ? 'padding' : null}>
        <StatusBarPlaceHolder />
        <MessagesHeader
          online={online}
          imageAvailable={imageAvailable}
          receiverImage={receiverImage}
          receiverName={receiverName}
          handleBackButtonClick={this.handleBackButtonClick}
        />
        <ImageBackground
          style={{flex: 1}}
          source={require('../../icons/bg_chat.png')}>
          <ScrollView
            style={{marginBottom: 50}}
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
                messagesInfo={messagesInfo}
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
            {!this.state.isAcceptJob && !this.state.isRejectJob && (
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
                    marginTop: 10,
                    marginBottom: 10,
                  }}>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.acceptJobTask}>
                    <Text
                      style={[
                        styles.text,
                        {color: colorGreen, fontWeight: 'bold'},
                      ]}>
                      Accept job
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={this.rejectJobTask}>
                    <Text
                      style={[
                        styles.text,
                        {color: themeRed, fontWeight: 'bold'},
                      ]}>
                      Reject job
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <MessagesFooter
              inputMesage={this.state.inputMessage}
              textChangeAction={inputMesage => this.showHideButton(inputMesage)}
              attachFileTask={this.attachFileProvider}
              sendMessageTask={this.sendMessageTask}
              showButton={this.state.showButton}
            />
            {this.state.isAcceptJob && (
              <View
                style={{
                  flexDirection: 'column',
                  width: screenWidth,
                  height: 50,
                  backgroundColor: white,
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
                  onPress={this.goToMapDirection}>
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
                    Direction
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
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
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
  text: {
    fontSize: 14,
    textAlign: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 4,
    backgroundColor: lightGray,
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  textViewDirection: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    shadowColor: black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: white,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
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
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
    messagesInfo: state.messagesInfo,
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
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobProvider());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobProviderInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchProviderJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    getAllWorkRequestPro: providerId => {
      getAllWorkRequestPro(providerId);
    },
    dbMessagesFetched: messages => {
      dispatch(dbMessagesFetched(messages));
    },
    fetchedDataWorkSource: dws => {
      dispatch(fetchedDataWorkSource(dws));
    },
    fetchEmployeeMessages: (receiverId, callBack) => {
      dispatch(fetchEmployeeMessages({receiverId, callBack}));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withNavigation(ProAcceptRejectJobScreen));
