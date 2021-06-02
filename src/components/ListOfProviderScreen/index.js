import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  Dimensions,
  FlatList,
  BackHandler,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import {AirbnbRating} from 'react-native-ratings';
import Toast from 'react-native-simple-toast';
import WaitingDialog from '../WaitingDialog';
import images from '../../Constants/images';
import {colorBg, white, themeRed} from '../../Constants/colors';
import {calculateDistance, getAllProviders} from '../../controllers/users';

const screenWidth = Dimensions.get('window').width;

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

class ListOfProviderScreen extends Component {
  constructor() {
    super();
    this.state = {
      serviceName: null,
      serviceId: null,
      dataSource: [],
      distInfo: {},
      distCalculated: false,
      isNoData: false,
      isData: false,
      isLoading: true,
      showClasses: false,
      distanceOrder: true,
      reviewOrder: true,
      refreshing: false,
    };
  }

  componentDidMount() {
    const {navigation} = this.props;
    this.initialize();
    navigation.addListener('willFocus', async () => {
      /**
       * app has tocheck for new providers everytime this view is opened
       */
      this.initialize();
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

  initialize = async () => {
    const {navigation} = this.props;
    this.setState({
      serviceName: navigation.state.params.serviceName,
      serviceId: navigation.state.params.serviceId,
      dataSource: [],
      distInfo: {},
      distCalculated: false,
      isNoData: false,
      isData: false,
      isLoading: true,
      showClasses: false,
      distanceOrder: true,
      reviewOrder: true,
    });
    await this.getAllProvidersLocal();
  };

  getAllProvidersLocal = async () =>
    getAllProviders({
      userDetails: this.props?.userInfo?.userDetails,
      serviceId: this.props.navigation.getParam('serviceId'),
      toggleIsLoading: this.changeWaitingDialogVisibility,
      usersCoordinates: this.props?.generalInfo?.usersCoordinates,
      setDistInfo: distInfo => this.setState({distInfo}),
      setDistDataSource: dataSource => {
        this.setState({
          distCalculated: true,
          dataSource,
          refreshing: false,
        });
      },
      onSuccess: () =>
        this.setState({
          isLoading: false,
          isNoData: false,
          isData: true,
        }),
      onError: () =>
        this.setState({
          isLoading: false,
          isNoData: true,
          isData: false,
        }),
    });

  calculateDistanceLocal = async dataSource =>
    calculateDistance({
      usersCoordinates: this.props?.generalInfo?.usersCoordinates,
      dataSource,
      setDistInfo: distInfo => this.setState({distInfo}),
      toggleIsRefreshing: this.toggleRefreshing,
      onSuccess: dataSource =>
        this.setState({
          distCalculated: true,
          dataSource,
          refreshing: false,
        }),
    });

  handleBackButtonClick = () => {
    this.props.navigation.navigate('Dashboard');
    return true;
  };

  showToast = (message, length) => {
    if (length) Toast.show(message, length);
    else Toast.show(message);
  };

  renderItem = ({item}) => {
    const {
      userInfo: {userDetails},
      navigation,
    } = this.props;
    const {accountType} = userDetails;
    const {showClasses} = this.state;
    if (accountType === 'Individual' || item.invoice === 1)
      /** only return providers with invoices for enterprise clients */
      return (
        <TouchableOpacity
          style={styles.itemMainContainer}
          onPress={() => {
            !showClasses
              ? navigation.navigate('ProviderDetails', {
                  providerId: item.id,
                  name: item.username,
                  surname: item.surname,
                  image: item.image,
                  imageAvailable: item.imageAvailable,
                  mobile: item.mobile,
                  avgRating: item.avgRating,
                  distance: item.hash,
                  address: item.currentAddress || item.address,
                  description: item.description,
                  status: item.status,
                  fcmId: item.fcm_id,
                  accountType: item.account_type,
                  serviceName: this.state.serviceName,
                  serviceId: this.state.serviceId,
                  serviceImage: navigation.getParam('serviceImage'),
                  onGoBack: () =>
                    navigation.navigate('ListOfProviders', {
                      serviceName: this.state.serviceName,
                      serviceId: this.state.serviceId,
                      serviceImage: navigation.getParam('serviceImage'),
                    }),
                })
              : null;
          }}>
          <View
            style={{
              width: screenWidth,
              flexDirection: 'row',
              backgroundColor: 'white',
              alignContent: 'center',
              padding: 10,
            }}>
            <View style={{flexDirection: 'column', marginLeft: 10}}>
              <Image
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 100,
                  alignSelf: 'center',
                }}
                source={
                  item.imageAvailable
                    ? {uri: item.image}
                    : require('../../images/generic_avatar.png')
                }
              />
              <View style={{backgroundColor: 'white', marginTop: 5}}>
                <AirbnbRating
                  type="custom"
                  ratingCount={5}
                  defaultRating={item.avgRating}
                  size={10}
                  ratingBackgroundColor={colorBg}
                  showRating={false}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: 'column',
                width: screenWidth - 130,
                marginLeft: 10,
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: 'black',
                  fontSize: 16,
                }}>
                {item.username + ' ' + item.surname}
              </Text>
              <Text>
                <Text style={{fontWeight: 'bold'}}>Current Location: </Text>
                <Text
                  style={{
                    width: screenWidth - 120,
                    color: 'black',
                    fontSize: 12,
                  }}>
                  {item.currentAddress || item.address}
                </Text>
              </Text>

              <View style={{marginTop: 5, flexDirection: 'row'}}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: 'black',
                    fontSize: 14,
                  }}>
                  Distance from you:{' '}
                </Text>
                {item.hash && item.hash !== 'NaN' ? (
                  <Text
                    style={{
                      color: 'black',
                      width: screenWidth - 120,
                      fontSize: 14,
                    }}>
                    {`${item.hash} Km`}
                  </Text>
                ) : (
                  <ActivityIndicator
                    style={styles.smActivityIndicator}
                    color="#C00"
                    size="small"
                  />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    else return null;
  };

  changeWaitingDialogVisibility = bool => {
    this.setState(prevState => ({
      isLoading: typeof bool === 'boolean' ? bool : !prevState.isLoading,
    }));
  };

  toggleRefreshing = bool => {
    this.setState(prevState => ({
      refreshing: typeof bool === 'boolean' ? bool : !prevState.refreshing,
    }));
  };

  rerenderList = order => {
    const {dataSource, reviewOrder, distanceOrder} = this.state;
    let hashsArr = [];
    let ratingArr = [];
    let newDataSource = [];
    if (order === 'distance') {
      dataSource.map(obj => hashsArr.push([obj._id, obj.hash]));
      distanceOrder
        ? hashsArr.sort(function(a, b) {
            return a[1] - b[1];
          })
        : hashsArr.sort(function(a, b) {
            return b[1] - a[1];
          });
      /**
       * rearrange datasource according to distance
       */
      hashsArr.map(innerArr => {
        dataSource.map(obj => {
          const id = obj._id;
          if (id === innerArr[0]) {
            newDataSource.push(obj);
          }
        });
      });
      this.setState({dataSource: newDataSource, distanceOrder: !distanceOrder});
    } else {
      dataSource.map(obj => ratingArr.push([obj._id, obj.avgRating]));
      reviewOrder
        ? ratingArr.sort(function(a, b) {
            return a[1] - b[1];
          })
        : ratingArr.sort(function(a, b) {
            return b[1] - a[1];
          });
      /**
       * rearrange datasource according to ratings
       */
      ratingArr.map(innerArr => {
        dataSource.map(obj => {
          const id = obj._id;
          //const rating = obj.avgRating;
          if (id === innerArr[0]) {
            newDataSource.push(obj);
          }
        });
      });
      this.setState({dataSource: newDataSource, reviewOrder: !reviewOrder});
    }
    this.toggleShowClasses();
  };

  toggleShowClasses = () => {
    this.setState({showClasses: !this.state.showClasses});
  };

  render() {
    const {showClasses, dataSource} = this.state;
    const categoryImage = this.props.navigation.getParam('serviceImage', null);
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.header}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                justifyContent: 'center',
                marginLeft: 5,
              }}
              onPress={() => this.handleBackButtonClick()}>
              <Image
                style={{width: 20, height: 20, alignSelf: 'center'}}
                source={require('../../icons/arrow_back.png')}
              />
            </TouchableOpacity>

            <Text
              style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginLeft: 5,
              }}>
              {this.state.serviceName}
            </Text>
            <TouchableOpacity
              onPress={this.toggleShowClasses}
              style={styles.classedByContainer}>
              <Text style={styles.classedByText}>Classed By</Text>
            </TouchableOpacity>
            <View style={showClasses ? styles.classList : styles.hidden}>
              <TouchableOpacity
                onPress={() => this.rerenderList('distance')}
                style={styles.classTextContainer}>
                <Text style={styles.classText}> Distance </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.rerenderList('reviews')}
                style={styles.classTextContainer}>
                <Text style={styles.classText}> Reviews </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {dataSource && dataSource.length > 0 && (
          <View style={styles.listView}>
            <FlatList
              numColumns={1}
              data={this.state.dataSource}
              renderItem={this.renderItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              extraData={this.state}
              refreshing={this.state.refreshing}
              onRefresh={this.calculateDistanceLocal}
            />
          </View>
        )}

        {this.state.isNoData && (
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              backgroundColor: colorBg,
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
              {categoryImage ? (
                <Image
                  style={{width: 50, height: 50, tintColor: white}}
                  source={images[categoryImage]}
                />
              ) : (
                <Image
                  style={{width: 50, height: 50}}
                  source={require('../../icons/service_provider_tool.png')}
                />
              )}
            </View>
            <Text style={{fontSize: 18, marginTop: 10}}>No provider found</Text>
          </View>
        )}
        <Modal
          transparent={true}
          visible={this.state.isLoading}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    position: 'relative',
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: themeRed,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 8,
  },
  listView: {
    flex: 1,
    position: 'relative',
    backgroundColor: colorBg,
    padding: 5,
    elevation: Platform.OS === 'android' ? 3 : 0,
    zIndex: 2,
  },
  smActivityIndicator: {
    height: 20,
  },
  itemMainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    padding: 5,
    justifyContent: 'center',
  },
  itemImageView: {
    alignItems: 'flex-start',
    justifyContent: 'center',
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
  classedByContainer: {
    position: 'absolute',
    right: 10,
  },
  classedByText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  hidden: {
    display: 'none',
  },
  classList: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    alignContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    width: 100,
    right: 2,
    top: 3,
    elevation: Platform.OS === 'android' ? 10 : 0,
    zIndex: 10,
  },
  classTextContainer: {
    flex: 1,
    display: 'flex',
    alignContent: 'center',
    padding: 5,
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 10 : 0,
    zIndex: 9,
  },
  classText: {
    flex: 1,
    textAlign: 'center',
  },
});

const mapStateToProps = state => {
  return {
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ListOfProviderScreen);
