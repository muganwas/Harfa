import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {connect} from 'react-redux';
import {DrawerActions} from 'react-navigation-drawer';
import ProDialogLogout from '../ProDialogLogout';
import {imageExists} from '../../misc/helpers';
import {notificationsFetched} from '../../Redux/Actions/notificationActions';
import {black, lightGray, themeRed, white} from '../../Constants/colors';

class CustomMenuLayout extends Component {
  constructor(props) {
    super();
    this.state = {
      imageExists: true,
      isDialogLogoutVisible: false,
    };
  }

  componentDidMount() {
    const {
      userInfo: {providerDetails},
    } = this.props;
    imageExists(providerDetails.imageSource).then(result => {
      this.setState({imageExists: result});
    });
  }

  changeDialogVisibility = bool => {
    this.props.navigation.dispatch(DrawerActions.closeDrawer());
    this.setState({
      isDialogLogoutVisible: bool,
    });
  };

  render() {
    const {
      notificationsInfo,
      fetchedNotifications,
      userInfo: {providerDetails},
    } = this.props;
    const imageSource = providerDetails.imageSource;
    return (
      <TouchableOpacity activeOpacity={1} style={styles.drawerTransparent}>
        <TouchableOpacity activeOpacity={1} style={styles.drawer}>
          <ScrollView>
            <View style={styles.header}>
              <Image
                source={
                  this.state.imageExists
                    ? {uri: imageSource}
                    : require('../../images/generic_avatar.png')
                }
                style={styles.headerImage}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: black,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 5,
                }}>
                Welcome
              </Text>
              <Text style={[styles.textHeader, {color: black}]}>
                {providerDetails.name + ' ' + providerDetails.surname}
              </Text>
            </View>

            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => {
                this.props.navigation.navigate('ProDashboard');
                this.props.navigation.dispatch(DrawerActions.closeDrawer());
              }}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/ic_home_64dp.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Dashboard</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => {
                this.props.navigation.navigate('ProMyProfile');
                this.props.navigation.dispatch(DrawerActions.closeDrawer());
              }}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/ic_user_64dp.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>My Profile</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => {
                this.props.navigation.navigate('ProBooking');
                this.props.navigation.dispatch(DrawerActions.closeDrawer());
              }}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/booking_history.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Bookings</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => {
                fetchedNotifications({type: 'generic', value: 0});
                this.props.navigation.navigate('ProNotifications');
                this.props.navigation.dispatch(DrawerActions.closeDrawer());
              }}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/ic_notification.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Notifications</Text>
                {notificationsInfo.generic > 0 ? (
                  <Text style={styles.menuNotifications}>
                    {notificationsInfo.generic}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => {
                fetchedNotifications({type: 'messages', value: 0});
                this.props.navigation.navigate('ProAllMessage');
                this.props.navigation.dispatch(DrawerActions.closeDrawer());
              }}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/message.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Messages</Text>
                {notificationsInfo.messages > 0 ? (
                  <Text style={styles.menuNotifications}>
                    {notificationsInfo.messages}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => this.props.navigation.navigate('ContactUs')}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/ic_contact_us_64dp.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Contact Us</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              underlayColor={'rgba(0,0,0,0.2)'}
              style={styles.menuButton}
              onPress={() => this.changeDialogVisibility(true)}>
              <View style={styles.row}>
                <Image
                  source={require('../../icons/ic_logout.png')}
                  style={styles.menuImage}
                />
                <Text style={styles.textMenu}>Log out</Text>
              </View>
            </TouchableOpacity>
            <ProDialogLogout
              isDialogLogoutVisible={this.state.isDialogLogoutVisible}
              navigation={this.props.navigation}
              changeDialogVisibility={this.changeDialogVisibility}
            />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  drawerTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawer: {
    flex: 1,
    width: '100%',
    backgroundColor: lightGray,
  },
  menuNotifications: {
    position: 'absolute',
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 12,
    color: themeRed,
    right: 10,
    top: 15,
    height: 24,
    width: 24,
    backgroundColor: white,
  },
  header: {
    width: '100%',
    height: 150,
    backgroundColor: white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: themeRed,
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textHeader: {
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  menuImage: {
    width: 20,
    height: 20,
    alignItems: 'center',
    tintColor: white,
    justifyContent: 'center',
    marginLeft: 5,
  },
  menuButton: {
    backgroundColor: themeRed,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  textMenu: {
    fontSize: 16,
    color: white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingLeft: 10,
  },
  line: {
    width: '90%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: 'gray',
    margin: 15,
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
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CustomMenuLayout);
