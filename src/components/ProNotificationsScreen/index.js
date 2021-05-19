import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  BackHandler,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import Config from '../Config';
import Hamburger from '../ProHamburger';
import SwipeableButton from '../SwipeableBtn';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
  updateNotifications,
} from '../../Redux/Actions/notificationActions';
import {
  lightGray,
  white,
  themeRed,
  colorGray,
  black,
  colorBg,
} from '../../Constants/colors';
import {
  getAllNotifications,
  deleteNotification,
  readNotification,
} from '../../controllers/notifications';

const screenWidth = Dimensions.get('window').width;
const NOTIFICATION_URL =
  Config.baseURL + 'notification/get-employee-notification/';
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

class ProNotificationsScreen extends Component {
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
    this.getAllNotificationsProvider();
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

  handleBackButtonClick = () => this.props.navigation.goBack();

  readNotificationProvider = async userId =>
    await readNotification({
      userId,
      dataSource: this.props?.notificationsInfo?.dataSource,
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
      readNotificationURL: READ_NOTIFICATION_URL,
    });

  deleteNotificationProvider = async userId =>
    await deleteNotification({
      userId,
      dataSource: this.props?.notificationsInfo?.dataSource,
      deleteNotificationURL: DELETE_NOTIFICATION_URL,
      onSuccess: dataSource => {
        this.props.updateNotifications(dataSource);
      },
    });

  getAllNotificationsProvider = async () =>
    await getAllNotifications({
      userId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Provider',
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

  showToast = (message, length) => {
    if (length) SimpleToast.show(message, length);
    else SimpleToast.show(message);
  };

  //GridView Items
  renderItem = (item, index) => {
    if (item) {
      const {status, _id} = item;
      return (
        <SwipeableButton
          key={index}
          onSwipeableLeftOpen={() => this.readNotificationProvider(_id)}
          onSwipeableRightOpen={() => this.deleteNotificationProvider(_id)}>
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (status === '0') this.readNotificationProvider(_id);
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
            <Image
              style={{width: 45, height: 45, borderRadius: 100}}
              source={
                item.customer_details && item.customer_details.imageAvailable
                  ? {uri: item.customer_details.image}
                  : require('../../images/generic_avatar.png')
              }
            />
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                marginLeft: 10,
              }}>
              <Text style={{color: 'black', fontSize: 14, marginTop: 5}}>
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
    shadowOffset: {width: 0, height: 3},
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
)(ProNotificationsScreen);
