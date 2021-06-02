import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import {connect} from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import RNExitApp from 'react-native-exit-app';
import Config from '../Config';
import SwipeableButton from '../SwipeableBtn';
import Hamburger from '../Hamburger';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
  updateNotifications,
} from '../../Redux/Actions/notificationActions';
import {
  getAllNotifications,
  deleteNotification,
  readNotification,
} from '../../controllers/notifications';
import {
  lightGray,
  white,
  themeRed,
  colorGray,
  black,
  colorBg,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const NOTIFICATION_URL =
  Config.baseURL + 'notification/get-customer-notification/';
const READ_NOTIFICATION_URL =
  Config.baseURL + 'notification/read-notification/';
const DELETE_NOTIFICATION_URL =
  Config.baseURL + 'notification/delete-notification/';
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

class NotificationsScreen extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
  }

  componentDidMount() {
    const {fetchedNotifications, navigation} = this.props;
    fetchedNotifications({type: 'generic', value: 0});
    this.getAllNotificationsCustomer();
    navigation.addListener('willFocus', async () => {
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
  }

  handleBackButtonClick = () => {
    if (Platform.OS === 'ios')
      this.state.backClickCount === 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount === 1 ? BackHandler.exitApp() : this._spring();
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

  readNotificationCustomer = async userId =>
    await readNotification({
      userId,
      dataSource: this.props.notificationsInfo?.dataSource,
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
      readNotificationURL: READ_NOTIFICATION_URL,
    });

  deleteNotificationCustomer = async userId =>
    await deleteNotification({
      userId,
      dataSource: this.props.notificationsInfo?.dataSource,
      deleteNotificationURL: DELETE_NOTIFICATION_URL,
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
    });

  getAllNotificationsCustomer = async () =>
    await getAllNotifications({
      userId: this.props?.userInfo?.userDetails?.userId,
      userType: 'Customer',
      toggleIsLoading: this.changeWaitingDialogVisibility,
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
        this.setState({
          isLoading: false,
        });
      },
      onError: () => {
        this.setState({
          isLoading: false,
        });
      },
      notificationsURL: NOTIFICATION_URL,
    });

  showToast = message => {
    SimpleToast.show(message);
  };

  //GridView Items
  renderItem = (item, index) => {
    if (item) {
      const {status, _id} = item;
      return (
        <SwipeableButton
          key={index}
          onSwipeableLeftOpen={() => this.readNotificationCustomer(_id)}
          onSwipeableRightOpen={() => this.deleteNotificationCustomer(_id)}>
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (status === '0') this.readNotificationCustomer(_id);
            }}
            style={{
              flexDirection: 'row',
              margin: 5,
              padding: 10,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 3},
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
              backgroundColor: status === '0' ? lightGray : white,
              borderRadius: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View style={{justifyContent: 'center', alignContent: 'center'}}>
              <Image
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 100,
                  alignItems: 'center',
                }}
                source={
                  item.employee_details && item.employee_details.imageAvailable
                    ? {uri: item.employee_details.image}
                    : require('../../images/generic_avatar.png')
                }
              />
            </View>

            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                marginLeft: 10,
              }}>
              <Text
                style={{
                  color: 'black',
                  fontSize: 15,
                  marginTop: 5,
                  fontWeight: 'bold',
                }}>
                {item.title}
              </Text>
              <Text style={{color: 'grey', fontSize: 13, marginTop: 2}}>
                {item.message}
              </Text>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: colorGray,
                  fontSize: 10,
                  marginTop: 2,
                }}>
                {item.createdDate}
              </Text>
            </View>
          </TouchableOpacity>
        </SwipeableButton>
      );
    }
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  render() {
    const {
      notificationsInfo: {dataSource},
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.header}>
          <Hamburger navigation={this.props.navigation} text="Notifications" />
        </View>
        {this.state.isLoading && (
          <View
            style={{
              height: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator size={'large'} color={colorGray} />
          </View>
        )}
        {!this.state.isLoading && (dataSource && dataSource.length > 0) && (
          <ScrollView>
            <View style={styles.listView}>
              {dataSource.map(this.renderItem)}
            </View>
          </ScrollView>
        )}
        {!this.state.isLoading && (!dataSource || dataSource.length === 0) && (
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              backgroundColor: lightGray,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 100,
                backgroundColor: themeRed,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                style={{width: 50, height: 50, tintColor: white}}
                source={require('../../icons/ic_notification.png')}
              />
            </View>
            <Text style={{fontSize: 18, marginTop: 10}}>
              You have no notifications
            </Text>
          </View>
        )}
        <Animated.View
          style={[
            styles.animatedView,
            {transform: [{translateY: this.springValue}]},
          ]}>
          <Text style={styles.exitTitleText}>
            Press back again to exit the app
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => BackHandler.exitApp()}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGray,
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  listView: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: lightGray,
    padding: 5,
  },
  animatedView: {
    width: screenWidth,
    backgroundColor: colorBg,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
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
    updateNotifications: data => {
      dispatch(updateNotifications(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NotificationsScreen);
