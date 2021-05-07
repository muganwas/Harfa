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
import Toast from 'react-native-simple-toast';
import RNExitApp from 'react-native-exit-app';
import {cloneDeep} from 'lodash';
import Config from '../Config';
import SwipeableButton from '../SwipeableBtn';
import {imageExists} from '../../misc/helpers';
import Hamburger from '../Hamburger';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
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
  constructor(props) {
    super();
    this.state = {
      isLoading: true,
      isNoData: false,
      dataSource: [],
      backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
  }

  componentDidMount() {
    const {fetchedNotifications, navigation} = this.props;
    fetchedNotifications({type: 'generic', value: 0});
    this.getAllNotifications();
    navigation.addListener('willFocus', async () => {
      this.getAllNotifications();
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
    if (Platform.OS == 'ios')
      this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
    else
      this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
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

  readNotification = async id => {
    const {dataSource} = this.state;
    let altDataSource = cloneDeep(dataSource);
    try {
      await fetch(READ_NOTIFICATION_URL + id, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson) {
            const {
              data: {_id, status},
            } = responseJson;
            dataSource.map((notification, index) => {
              if (_id === notification._id)
                altDataSource[index].status = status;
            });
            this.setState({dataSource: altDataSource});
          }
        })
        .catch(e => {
          SimpleToast.show(
            "Notification couldn't be read, try again later",
            SimpleToast.SHORT,
          );
        });
    } catch (e) {
      SimpleToast.show(
        "Notification couldn't be read, try again later",
        SimpleToast.SHORT,
      );
    }
  };

  deleteNotification = id => {
    const {dataSource} = this.state;
    let altDataSource = cloneDeep(dataSource);
    try {
      fetch(DELETE_NOTIFICATION_URL + id, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson) {
            const {
              data: {_id},
            } = responseJson;
            dataSource.map((notification, index) => {
              if (_id === notification._id) altDataSource.splice(index, 1);
            });
            this.setState({dataSource: altDataSource});
          }
        })
        .catch(e => {
          SimpleToast.show(
            "Notification couldn't be deleted, try again later",
            SimpleToast.SHORT,
          );
        });
    } catch (e) {
      SimpleToast.show(
        "Notification couldn't be deleted, try again later",
        SimpleToast.SHORT,
      );
    }
  };

  getAllNotifications = () => {
    this.setState({
      isLoading: true,
    });
    const {
      userInfo: {userDetails},
    } = this.props;
    try {
      fetch(NOTIFICATION_URL + userDetails.userId)
        .then(response => response.json())
        .then(responseJson => {
          //console.log('notification', responseJson)

          if (responseJson.result) {
            let dataSource = cloneDeep(responseJson.data);
            dataSource?.map((item, i) => {
              imageExists(item.employee_details.image).then(res => {
                dataSource[i].employee_details.imageAvailable = res;
              });
            });
            this.setState({
              dataSource,
              isLoading: false,
              isNoData: !dataSource || dataSource.length === 0,
            });
          } else {
            this.setState({
              isLoading: false,
              isNoData: true,
            });
          }
        })
        .catch(error => {
          console.log(error);
          this.setState({
            isLoading: false,
            isNoData: true,
          });
          this.showToast(
            'An error has occurred, check your internet connection',
          );
        });
    } catch (e) {
      console.log(e);
      this.setState({
        isLoading: false,
        isNoData: true,
      });
      this.showToast('An error has occurred, try again later');
    }
  };

  showToast = message => {
    Toast.show(message);
  };

  //GridView Items
  renderItem = (item, index) => {
    if (item) {
      const {status, _id} = item;
      return (
        <SwipeableButton
          key={index}
          onSwipeableLeftOpen={() => this.readNotification(_id)}
          onSwipeableRightOpen={() => this.deleteNotification(_id)}>
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (status === '0') this.readNotification(_id);
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
    this.setState({
      isLoading: bool,
    });
  };

  render() {
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
        {!this.state.isLoading && !this.state.isNoData && (
          <ScrollView>
            <View style={styles.listView}>
              {this.state.dataSource.map(this.renderItem)}
            </View>
          </ScrollView>
        )}
        {!this.state.isLoading &&
          (this.state.isNoData ||
            (this.state.dataSource && this.state.dataSource.length === 0)) && (
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
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NotificationsScreen);
