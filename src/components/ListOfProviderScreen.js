import React, {Component} from 'react';
import { connect } from 'react-redux';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
  FlatList,
  BackHandler,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {Rating, AirbnbRating} from 'react-native-ratings';
import Toast from 'react-native-easy-toast';
import firebase from 'react-native-firebase';
import Config from './Config';
import UserDetails from './UserDetails';
import axios from 'axios';
import WaitingDialog from './WaitingDialog';

//const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0';

const screenWidth = Dimensions.get('window').width;
//const screenHeight = Dimensions.get('window').height;

const GET_ALL_PROVIDER_URL = Config.baseURL + 'job/serviceprovider/';
const GET_EMPLOYEE_RATINGS = Config.baseURL + 'jobrequest/employeeReviews/';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
  return Platform.OS === 'ios' ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: colorPrimaryDark,
      }}>
      <StatusBar barStyle="light-content" />
    </View>
  ) : (
    <StatusBar barStyle="light-content" backgroundColor={colorPrimaryDark} />
  );
}

class ListOfProviderScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      //From DashboardScreen
      serviceName: this.props.navigation.state.params.serviceName,
      serviceId: this.props.navigation.state.params.serviceId,

      dataSource: [],
      distInfo: {},
      distCalculated: false,
      isNoData: false,
      isData: false,
      isLoading: true,
      showClasses: false,
      distanceOrder: true,
      reviewOrder: true
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );

    console.log(
      'URL : ' +
        GET_ALL_PROVIDER_URL +
        this.props.navigation.state.params.serviceId,
    );

    const data = {
      lat: UserDetails.User.lat,
      lang: UserDetails.User.lang,
    };
    fetch(GET_ALL_PROVIDER_URL + this.props.navigation.state.params.serviceId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(responseJson => {
        // console.log('Response : ' + JSON.stringify(responseJson));
        // console.log(responseJson)
        if (responseJson.result) {
          this.setState({
            dataSource: responseJson.data, //data is key
            isLoading: false,
            isNoData: false,
            isData: true,
          });
        } else {
          this.setState({
            isLoading: false,
            isNoData: true,
            isData: false,
          });
        }
      })
      .catch(error => {
        console.log(error);
        this.setState({
          isLoading: false,
        });
        this.showToast('Something went wrong, Check your internet connection');
      });
  }

  calculateRating = async id => {
    let avg = 0;
    await axios.get(GET_EMPLOYEE_RATINGS + id).then(res => {
      if (res.data.rating > 0) avg = res.data.rating;
    });
    return(avg)
  }

  componentDidUpdate(){
    const { dataSource, distCalculated } = this.state;
    var distInfo = {};
    var tempDatasource = [...dataSource];
    const { generalInfo: { usersCoordinates } } = this.props;
    if (dataSource.length > 0 && !distCalculated) {
        Object.keys(dataSource).map(key => {
            // console.log(info)
            const { _id, id } = dataSource[key];
            firebase.database().ref(`liveLocation/${_id}`).once('value', result => {
                const { latitude, longitude } = result.val();
                const dist = this.distance(latitude, longitude, usersCoordinates.latitude, usersCoordinates.longitude, 'K');
                distInfo[_id] = parseFloat(dist).toFixed(1);
                tempDatasource[key].hash = parseFloat(dist).toFixed(1);
                this.setState({distInfo});
            }).
            catch(e => {
                console.log(e.message);
            });
        });
        this.setState({distCalculated: true, dataSource: tempDatasource});
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  distance = (lat1, lon1, lat2, lon2, unit) => {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
} 

  handleBackButtonClick() {
    this.props.navigation.navigate('DashBoard');
    return true;
  }

  showToast = message => {
    this.refs.toast.show(message);
  };

  renderItem = ({item}) => {
    const { accountType } = UserDetails.User;
    const { showClasses } = this.state;
    console.log(item)
    if ( accountType === 'Individual' || item.invoice === 1)/** only return providers with invoices for enterprise clients */
        return (
        <TouchableOpacity
            style={styles.itemMainContainer}
            onPress={() => {
                !showClasses ?
                this.props.navigation.navigate('ProviderDetails', {
                    providerId: item.id,
                    name: item.username,
                    surname: item.surname,
                    image: item.image,
                    mobile: item.mobile,
                    avgRating: item.avgRating,
                    distance: item.hash,
                    address: item.address,
                    description: item.description,
                    status: item.status,
                    fcmId: item.fcm_id,
                    accountType: item.account_type,
                    serviceName: this.state.serviceName,
                    serviceId: this.state.serviceId,
                }) :
                null;
            }
            }>
            <View
                style={{
                    width: screenWidth,
                    flexDirection: 'row',
                    backgroundColor: 'white',
                    alignContent: 'center',
                    padding: 10,
                }}
            >
            <View style={{flexDirection: 'column', marginLeft: 10}}>
                <Image
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: 100,
                        alignSelf: 'center',
                    }}
                    source={{uri: item.image}}
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
                }}
            >
                <Text style={{fontWeight: 'bold', color: 'black', fontSize: 16}}>
                {item.username + ' ' + item.surname}
                </Text>
                <Text
                style={{width: screenWidth - 120, color: 'black', fontSize: 12}}>
                {item.address}
                </Text>
                <Text style={{marginTop: 5}}>
                <Text style={{fontWeight: 'bold', color: 'black', fontSize: 14}}>
                    {'Position:' + item.hash + ' Km'}
                </Text>
                <Text
                    style={{
                    color: 'black',
                    width: screenWidth - 120,
                    fontSize: 14,
                    }}>
                    {' '}
                    loin de vous
                </Text>
                </Text>
            </View>
            </View>
        </TouchableOpacity>
        );
    else return null;
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  rerenderList = order => {
      const { dataSource, reviewOrder, distanceOrder } = this.state
      // console.log(dataSource);
      let hashsArr = [];
      let ratingArr = [];
      let newDataSource = [];
      if (order === 'distance') {
        dataSource.map(obj => hashsArr.push([obj._id, obj.hash]));
        distanceOrder ? hashsArr.sort(function(a,b){return a[1]-b[1]}) : hashsArr.sort(function(a,b){return b[1]-a[1]});
        /**rearrange datasource according to distance */
        hashsArr.map(innerArr => {
          dataSource.map(obj => {
            const id = obj._id;
            if (id === innerArr[0]) {
                newDataSource.push(obj);
            }
          });
        });
        //console.log(newDataSource);
        this.setState({dataSource: newDataSource, distanceOrder: !distanceOrder });
      } else {
        dataSource.map(obj => ratingArr.push([obj._id, obj.avgRating]));
        reviewOrder ? ratingArr.sort(function(a,b){return a[1]-b[1]}) : ratingArr.sort(function(a,b){return b[1]-a[1]});
        /**rearrange datasource according to ratings */
        ratingArr.map(innerArr => {
            dataSource.map(obj => {
                const id = obj._id;
                //const rating = obj.avgRating;
                if (id === innerArr[0]) {
                    newDataSource.push(obj);
                }
            }); 
        });
        this.setState({ dataSource: newDataSource, reviewOrder: !reviewOrder});
      }
      
      this.toggleShowClasses();
  }

  toggleShowClasses = () => {
      this.setState({showClasses: !this.state.showClasses});
  }

  render() {
      const { showClasses } = this.state;
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
              onPress={() => this.props.navigation.goBack()}>
              <Image
                style={{width: 20, height: 20, alignSelf: 'center'}}
                source={require('../icons/arrow_back.png')}
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
            <TouchableOpacity onPress={this.toggleShowClasses} style={styles.classedByContainer}>
                <Text style={styles.classedByText}>Classed By</Text>
            </TouchableOpacity>
            <View style={ showClasses ? styles.classList : styles.hidden}>
                <TouchableOpacity onPress={() => this.rerenderList('distance')} style={styles.classTextContainer}>
                    <Text style={styles.classText}> Distance </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.rerenderList('reviews')} style={styles.classTextContainer}>
                    <Text style={styles.classText}> Reviews </Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>

        {this.state.isData && (
          <View style={styles.listView}>
            <FlatList
              numColumns={1}
              data={this.state.dataSource}
              renderItem={this.renderItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              extraData={this.state}
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
                backgroundColor: colorYellow,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                style={{width: 50, height: 50}}
                source={require('../icons/service_provider_tool.png')}
              />
            </View>
            <Text style={{fontSize: 18, marginTop: 10}}>
              Aucun fournisseur trouvé
            </Text>
          </View>
        )}
        {/* {this.state.isLoading && (
                <View style={styles.loaderStyle}>
                    <ActivityIndicator
                        style={{ height: 80 }}
                        color="#C00"
                        size="large" />
                </View>
            )} */}
        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
        <Toast
          ref="toast"
          style={{backgroundColor: 'green'}}
          position="bottom"
          positionValue={200}
          fadeInDuration={750}
          fadeOutDuration={1000}
          opacity={0.8}
          textStyle={{color: 'white'}}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg
  },
  header: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    backgroundColor: colorYellow,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  listView: {
    flex: 1,
    backgroundColor: colorBg,
    padding: 5,
    elevation: Platform.OS === 'android' ? 3 : 0,
    zIndex: 2
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
    justifyContent: 'center'
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
      right: 10
  },
  classedByText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15
  },
  hidden: {
      display: 'none'
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
      zIndex: 4
  },
  classTextContainer: {
      flex: 1,
      display: 'flex',
      alignContent: 'center',
      padding: 5,
      alignItems: 'center',
      elevation: Platform.OS === 'android' ? 10 : 0,
      zIndex: 9
  },
  classText: {
      flex: 1,
      textAlign: 'center'
  }
});

const mapStateToProps = state => {
    return {
        generalInfo: state.generalInfo
    }
}

export default connect(mapStateToProps)(ListOfProviderScreen);