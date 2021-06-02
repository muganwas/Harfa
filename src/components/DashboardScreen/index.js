import React, {Component} from 'react';
import {
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  BackHandler,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  YellowBox,
} from 'react-native';
import {connect} from 'react-redux';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import RNExitApp from 'react-native-exit-app';
import Toast from 'react-native-simple-toast';
import WaitingDialog from '../WaitingDialog';
import Hamburger from '../Hamburger';
import {updateLatestChats} from '../../Redux/Actions/messageActions';
import {getAllRecentChats} from '../../controllers/chats';
import {
  startFetchingJobCustomer,
  fetchedJobCustomerInfo,
  fetchCustomerJobInfoError,
  setSelectedJobRequest,
  updateActiveRequest,
  getAllWorkRequestClient,
  getPendingJobRequest,
} from '../../Redux/Actions/jobsActions';
import {
  colorPrimary,
  colorBg,
  themeRed,
  white,
  lightGray,
  darkGray,
  black,
} from '../../Constants/colors';
import images from '../../Constants/images';
import {jobCancelTask, fetchServices} from '../../controllers/jobs';

const screenWidth = Dimensions.get('window').width;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
YellowBox.ignoreWarnings(['']);

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

class DashboardScreen extends Component {
  constructor() {
    super();
    this.state = {
      dataSource: [],
      isLoading: true,
      backClickCount: 0,
      isToastShow: false,
      availabilityChecked: false,
      availabilityObj: {},
    };
    this.springValue = new Animated.Value(100);
  }

  buttonType = buttonType1 => {
    this.setState({buttonType: buttonType1});
  };

  componentDidMount = () => {
    const {navigation} = this.props;
    this.onRefresh();
    navigation.addListener('willFocus', async () => {
      //this.onRefresh();
      BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButton,
      );
    });
  };

  _spring = () => {
    this.setState({backClickCount: 1}, () => {
      Animated.sequence([
        Animated.spring(this.springValue, {
          toValue: -0.15 * 1,
          friction: 5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(this.springValue, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        this.setState({backClickCount: 0});
      });
    });
  };

  jobCancelTaskDash = async currRequestPos =>
    await jobCancelTask({
      userType: 'Customer',
      currRequestPos,
      updatePendingJobInfo: this.props?.fetchedPendingJobInfo,
      jobRequests: this.props?.jobsInfo?.jobRequests,
      userDetails: this.props?.userInfo?.userDetails,
      toggleIsLoading: this.changeWaitingDialogVisibility,
      onError: msg => {
        this.leftButtonActon = () => {
          this.setState({
            isLoading: false,
            showDialog: false,
            dialogType: null,
          });
        };
        this.rightButtonAction = () => {
          this.jobCancelTaskDash(currRequestPos);
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

  handleBackButton = () => {
    if (Platform.OS === 'ios')
      this.state.backClickCount === 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount === 1 ? BackHandler.exitApp() : this._spring();
    return true;
  };

  //GridView Items
  renderItem = ({item, index}) => {
    if (item)
      return (
        <TouchableOpacity
          key={index}
          style={{
            flex: 1,
            flexDirection: 'column',
            margin: 5,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 3},
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
            backgroundColor: themeRed,
            borderRadius: 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            this.props.navigation.navigate('ListOfProviders', {
              serviceName: item.service_name,
              serviceId: item.id,
              serviceImage: item.image,
            });
          }}>
          {item.image ? (
            <Image
              style={{
                width: 40,
                height: 40,
                tintColor: white,
                margin: 10,
                zIndex: 1000,
              }}
              source={images[item.image]}
            />
          ) : (
            <Image
              style={{
                width: 40,
                height: 40,
                margin: 10,
                tintColor: white,
                zIndex: 1000,
              }}
              source={require('../../images/png/picture.png')}
            />
          )}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5,
              alignItems: 'center',
            }}>
            <Text
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: white,
                fontSize: 12,
                marginTop: 5,
                alignSelf: 'center',
              }}>
              {item.service_name}
            </Text>
          </View>
        </TouchableOpacity>
      );
  };

  _spring = () => {
    this.setState({backClickCount: 1}, () => {
      Animated.sequence([
        Animated.spring(this.springValue, {
          toValue: -0.15 * 1,
          friction: 5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(this.springValue, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        this.setState({backClickCount: 0});
      });
    });
  };

  renderSeparator = () => {
    return <View style={{height: 1, width: '100%', backgroundColor: black}} />;
  };

  onRefresh = async () => {
    const {
      getAllWorkRequestClient,
      userInfo: {userDetails},
    } = this.props;
    if (
      !this.state.dataSource ||
      (this.state.dataSource && this.state.dataSource.length === 0)
    ) {
      this.setState({isLoading: true});
      try {
        await fetchServices({
          onSuccess: data => {
            this.setState({
              dataSource: data,
              isLoading: false,
            });
          },
          onError: err => {
            this.showToast(err);
            this.setState({isLoading: false});
          },
        });
      } catch (e) {
        this.setState({
          isLoading: false,
        });
        this.showToast('An error has occurred, try again');
      }
    } else {
      this.setState({
        isLoading: false,
      });
    }
    await getAllWorkRequestClient(userDetails.userId);
    //await getPendingJobRequest(this.props, userDetails.userId);
    await this.getAllRecentChatsCustomer();
    this.setState({isLoading: false});
  };

  //Recent Chat Message
  getAllRecentChatsCustomer = async () =>
    await getAllRecentChats({
      id: this.props?.userInfo?.userDetails?.userId,
      dataSource: this.props?.messagesInfo?.latestChats,
      onSuccess: data => {
        this.props.updateLatestChats(data);
        this.setState({isLoading: false, isRecentMessage: true});
      },
    });

  goToNextPage = (chat_status, jobInfo) => {
    const {dispatchSelectedJobRequest, fetchedNotifications} = this.props;
    if (chat_status === '0') {
      this.showToast('Your chat request has been accepted yet. Please wait...');
    } else {
      const {
        status,
        fcm_id,
        image,
        order_id,
        service_name,
        name,
        employee_id,
        currentPos,
      } = jobInfo;
      const nameArr = name.split(' ');
      const username = nameArr[0];
      const surname = nameArr.pop();
      let currentPostInAllJobs = currentPos;
      dispatchSelectedJobRequest(jobInfo);
      if (jobInfo.status.toLowerCase() === 'pending') {
        fetchedNotifications({type: 'messages', value: 0});
        this.props.navigation.navigate('Chat', {
          providerId: employee_id,
          fcmId: fcm_id,
          currentPosition: currentPostInAllJobs,
          providerName: username,
          providerSurname: surname,
          providerImage: image,
          serviceName: service_name,
          orderId: order_id,
          pageTitle: 'Dashboard',
          isJobAccepted: status === 'Accepted',
        });
      } else if (jobInfo.status.toLowerCase() === 'accepted') {
        this.props.navigation.navigate('MapDirection', {
          currentPos: jobInfo.currentPos,
          titlePage: 'Dashboard',
        });
      }
    }
  };

  showToast = (message, length) => {
    if (length) {
      Toast.show(message, length);
    } else Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  renderPendingJobRequests = (item, index) => {
    const cutButtonText = screenWidth <= 360;
    if (item && typeof item === 'object') {
      const {
        image,
        name,
        order_id,
        surName,
        service_name,
        fcm_id,
        employee_details,
        chat_status,
        imageAvailable,
        status,
      } = item;
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.pendingJobRow,
            {
              paddingVertical: 0,
              shadowColor: black,
              borderWidth: 0.5,
              borderColor: lightGray,
              backgroundColor: themeRed,
              shadowOffset: {width: 0, height: 3},
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            },
          ]}
          onPress={() => {
            this.goToNextPage(chat_status, {
              userType: 'client',
              status,
              onlineStatus: employee_details.online,
              fcm_id,
              order_id,
              image,
              service_name,
              name,
              employee_id: employee_details.providerId || employee_details._id,
              currentPos: index,
            });
          }}>
          <View style={[styles.pendingJobRow]}>
            <Image
              style={{
                height: 30,
                width: 30,
                justifyContent: 'center',
                alignSelf: 'center',
                alignContent: 'center',
                marginLeft: 10,
                borderRadius: 200,
              }}
              source={
                image && imageAvailable
                  ? {uri: image}
                  : require('../../images/generic_avatar.png')
              }
            />
            <View
              style={{
                flex: 3,
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: white,
                  fontSize: 12,
                  marginLeft: 10,
                  fontWeight: 'bold',
                  textAlignVertical: 'center',
                }}>
                {name + ' ' + surName}
              </Text>
              <Text
                style={{
                  color: white,
                  fontSize: 11,
                  marginLeft: 10,
                  textAlignVertical: 'center',
                }}>
                {service_name}
              </Text>
              <Text
                style={{
                  color: white,
                  fontSize: 11,
                  marginLeft: 10,
                  textAlignVertical: 'center',
                  fontWeight: 'bold',
                }}>
                {chat_status === '0'
                  ? 'New job application'
                  : status === 'Pending'
                  ? 'Chat request accepted'
                  : 'Job Accepted'}
              </Text>
            </View>
            <View style={styles.pendingRightSide}>
              {chat_status === '0' && (
                <TouchableOpacity
                  style={styles.cancelRequest}
                  onPress={() => this.jobCancelTaskDash(index)}>
                  <Text style={styles.cancelRequestText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
              <View style={styles.arrowView}>
                <Image
                  style={styles.arrow}
                  source={require('../../icons/arrow_right_animated.gif')}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  render() {
    const {
      jobsInfo: {jobRequests, requestsFetched},
      navigation,
    } = this.props;
    const {isLoading} = this.state;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.header}>
          <Hamburger navigation={navigation} text="kuchapa" />
          <TouchableOpacity
            style={{
              width: '100%',
              justifyContent: 'center',
              alignContent: 'center',
            }}
            onPress={() => navigation.navigate('AddAddress')}>
            <Image
              style={{
                width: 22,
                height: 22,
                tintColor: themeRed,
                alignSelf: 'center',
                marginLeft: 45,
              }}
              source={require('../../icons/maps_location.png')}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{width: screenWidth, height: 1, backgroundColor: '#D95E5E'}}
        />

        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 45,
            backgroundColor: colorPrimary,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 5,
            shadowColor: black,
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.75,
            shadowRadius: 5,
            elevation: 5,
          }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{color: themeRed, fontSize: 20, fontWeight: 'bold'}}>
              Available Services
            </Text>
          </View>
        </View>

        <ScrollView
          style={[
            styles.gridView,
            {flex: 1, marginBottom: jobRequests.length === 0 ? 0 : 45},
          ]}>
          <View style={{height: '100%'}}>
            <FlatList
              keyboardShouldPersistTaps={'handled'}
              numColumns={3}
              data={this.state.dataSource}
              renderItem={this.renderItem}
              keyExtractor={(item, index) => index}
              showsVerticalScrollIndicator={false}
              onRefresh={this.onRefresh}
              refreshing={this.state.isLoading}
              style={{paddingBottom: 20}}
            />
          </View>
        </ScrollView>
        {/** show pending requests */}
        {requestsFetched && jobRequests.length > 0 && (
          <View style={styles.pendingJobsContainer}>
            {jobRequests.map(this.renderPendingJobRequests)}
          </View>
        )}

        <Animated.View
          style={[
            styles.animatedView,
            {transform: [{translateY: this.springValue}]},
          ]}>
          <Text style={styles.exitTitleText}>Press back again to exit app</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>

        <Modal
          transparent={true}
          visible={isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    userInfo: state.userInfo,
    generalInfo: state.generalInfo,
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
      dispatch(startFetchingJobCustomer());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobCustomerInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchCustomerJobInfoError(error));
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
    updateActiveRequest: val => {
      dispatch(updateActiveRequest(val));
    },
    getAllWorkRequestClient: id => {
      dispatch(getAllWorkRequestClient(id));
    },
    updateLatestChats: data => {
      dispatch(updateLatestChats(data));
    },
    getPendingJobRequest: (props, userId, navTo) => {
      dispatch(getPendingJobRequest(props, userId, navTo));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DashboardScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: colorPrimary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  touchableHighlight: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textHeader: {
    height: 50,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlignVertical: 'center',
  },
  text: {
    fontSize: 26,
    color: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textView: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridView: {
    flex: 1,
    backgroundColor: lightGray,
    padding: 5,
  },
  open: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuIcon: {
    width: 22,
    height: 22,
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
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: Platform.OS === 'android' ? 50 : 0,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10000,
  },
  exitTitleText: {
    textAlign: 'center',
    color: black,
    marginRight: 20,
  },
  exitText: {
    color: themeRed,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pendingJobStyle: {
    flex: 1,
    width: screenWidth,
    height: 75,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  pendingJobsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: screenWidth,
    position: 'absolute',
    bottom: 0,
    shadowColor: black,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  pendingJobRow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    height: 55,
  },
  linearGradient: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Gill Sans',
    textAlign: 'center',
    margin: 10,
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  pendingRightSide: {
    flex: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  arrowView: {
    flex: 2,
    height: 55,
    alignContent: 'center',
    justifyContent: 'center',
  },
  cancelRequest: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: white,
    shadowColor: darkGray,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 5,
    margin: 10,
  },
  cancelRequestText: {
    fontWeight: 'bold',
  },
  arrow: {
    width: 20,
    height: 20,
    tintColor: white,
    alignSelf: 'flex-end',
    marginRight: 10,
  },
});
