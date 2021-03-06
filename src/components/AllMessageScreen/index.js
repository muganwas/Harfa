import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import _ from 'lodash';
import {
  startFetchingNotification,
  notificationsFetched,
  notificationError,
} from '../../Redux/Actions/notificationActions';
import {setSelectedJobRequest} from '../../Redux/Actions/jobsActions';
import database from '@react-native-firebase/database';
import Hamburger from '../Hamburger';
import {imageExists} from '../../misc/helpers';
import {
  lightGray,
  colorPrimaryDark,
  colorPrimary,
  white,
  themeRed,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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

class AllMessageScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      isLoading: true,
      dataSource: [],
      isRecentMessage: false,
      query: '',
      fullData: [],
      isDataMatch: true,
      backClickCount: 0,
    };

    this.springValue = new Animated.Value(100);
  }

  async componentDidMount() {
    const {
      userInfo: {userDetails},
      navigation,
    } = this.props;
    let dbRef = database()
      .ref('recentMessage')
      .child(userDetails.userId);
    await dbRef.once('value', async snapshot => {
      //let key = snapshot.key;
      let message = snapshot.val();
      let messageArray = [];
      if (message) {
        messageArray = Object.values(message);
        messageArray.map(async (inf, index) => {
          let newMessage = _.cloneDeep(inf);
          const {image} = newMessage;
          await imageExists(image).then(res => {
            newMessage.exists = res;
          });
          messageArray[index] = newMessage;
        });
      }
      this.setState({
        dataSource: messageArray,
        fullData: messageArray,
        isLoading: false,
        isRecentMessage: true,
      });
    });
    navigation.addListener('willFocus', async () => {
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
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
  };

  renderRecentMessageItem = (item, index) => {
    console.log('item', item);
    const {dispatchSelectedJobRequest} = this.props;
    return (
      <TouchableOpacity
        key={index}
        style={styles.itemMainContainer}
        onPress={() => {
          dispatchSelectedJobRequest({employee_id: item.id});
          this.props.navigation.navigate('ChatAfterBookingDetails', {
            providerId: item.id,
            providerName: item.name,
            providerSurname: '',
            providerImage: item.image,
            orderId: item.orderId,
            serviceName: item.serviceName,
            pageTitle: 'AllMessage',
          });
        }}>
        <View style={styles.itemImageView}>
          <Image
            style={{width: 40, height: 40, borderRadius: 100}}
            source={
              item.image && item.exists
                ? {uri: item.image}
                : require('../../images/generic_avatar.png')
            }
          />
        </View>
        <View style={{flexDirection: 'column', justifyContent: 'center'}}>
          <Text
            style={{fontSize: 14, color: 'black', textAlignVertical: 'center'}}>
            {item.name}
          </Text>
          <Text
            style={{
              width: screenWidth - 150,
              fontSize: 10,
              color: 'black',
              textAlignVertical: 'center',
              color: 'gray',
              marginTop: 3,
            }}
            numberOfLines={2}>
            {item.textMessage}
          </Text>
        </View>

        <View
          style={{flex: 1, justifyContent: 'center', alignContent: 'center'}}>
          <Text style={{alignSelf: 'flex-end', marginRight: 20, fontSize: 8}}>
            {item.date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  searchTask = textInput => {
    let text = textInput.toLowerCase();
    let tracks = this.state.fullData;
    let filterTracks = tracks.filter(item => {
      if (item.name.toLowerCase().match(text)) {
        this.setState({
          isDataMatch: true,
        });
        return item;
      } else {
        // this.setState({
        //     isDataMatch: false,
        // })
      }
    });
    this.setState({dataSource: filterTracks});
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />

        <View style={styles.header}>
          <Hamburger navigation={this.props.navigation} text="Your Messages" />
        </View>

        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 55,
            backgroundColor: themeRed,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 5,
          }}>
          <View
            style={{
              flexDirection: 'row',
              width: screenWidth - 40,
              height: 45,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 5,
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 0},
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            }}>
            <Image
              style={{width: 15, height: 15, marginLeft: 20}}
              source={require('../../icons/search.png')}
            />
            <TextInput
              style={{
                width: screenWidth - 60,
                height: 45,
                fontWeight: 'bold',
                marginLeft: 10,
              }}
              placeholder="search..."
              onChangeText={inputText => this.searchTask(inputText)}
            />
          </View>
        </View>

        {this.state.dataSource.length != 0 && (
          <ScrollView>
            <View style={styles.listView}>
              {this.state.dataSource.map(this.renderRecentMessageItem)}
            </View>
          </ScrollView>
        )}

        {this.state.dataSource.length == 0 && !this.state.isLoading && (
          <View style={styles.noDataStyle}>
            <Text style={{color: 'black', fontSize: 20}}>
              You have no messages!
            </Text>
          </View>
        )}

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator style={{height: 80}} color="#C00" size="large" />
          </View>
        )}
      </View>
    );
  }
}

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
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    },
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AllMessageScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGray,
  },
  listView: {
    flex: 1,
    width: screenWidth,
    backgroundColor: lightGray,
    padding: 5,
  },
  itemMainContainer: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    marginVertical: 2,
    shadowRadius: 5,
    borderRadius: 5,
    elevation: 5,
    padding: 5,
  },
  itemImageView: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 5,
  },
  noDataStyle: {
    height: screenHeight - 105,
    backgroundColor: lightGray,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  animatedView: {
    width: screenWidth,
    backgroundColor: colorPrimaryDark,
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
    color: 'white',
    marginRight: 20,
  },
  exitText: {
    color: 'red',
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
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: colorPrimary,
    paddingLeft: 10,
    paddingRight: 20,
    paddingBottom: 5,
  },
});
