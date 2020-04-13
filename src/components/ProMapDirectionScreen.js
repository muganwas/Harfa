import React, { Component } from 'react';
import { connect } from 'react-redux';
import {View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, ActivityIndicator, BackHandler, 
  Linking, PermissionsAndroid, Alert, StatusBar, Platform, Modal} from 'react-native';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import firebase from 'react-native-firebase';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import ProPendingJobRequest from './ProPendingJobRequest';
import ProviderDetails from './ProviderDetails';
import Config from './Config';
import WaitingDialog from './WaitingDialog';
import {MAPS_API_KEY} from 'react-native-dotenv';
import {imageExists} from '../misc/helpers';

//const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0' 

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL+"jobrequest/updatejobrequest";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

function StatusBarPlaceHolder() {
    return (
        Platform.OS === 'ios' ?
        <View style={{
            width: "100%",
            height: STATUS_BAR_HEIGHT,
            backgroundColor: colorPrimaryDark}}>
            <StatusBar
                barStyle="light-content"/>
        </View> :
        <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} /> 
    );
}

class ProMapDirectionScreen extends Component {

  constructor(props) {
    super(props)
    const { usersCoordinates, othersCoordinates } = this.props.generalInfo;
    this.state = {
      sourcesourceLocation: usersCoordinates.latitude+","+usersCoordinates.longitude,
      sourceLat: parseFloat(usersCoordinates.latitude),
      sourceLng: parseFloat(usersCoordinates.longitude),
      destinationLocation: othersCoordinates.latitude+','+othersCoordinates.longitude,
      destinationLat: parseFloat(othersCoordinates.latitude),
      destinationLng: parseFloat(othersCoordinates.longitude),
      routeCoordinates: [],
      isLoading: true,
      pageTitle: this.props.navigation.state.params.pageTitle,

      //From ProAcceptRejectJobScreen & ProDashboardScreen
      userId: ProPendingJobRequest.Request.user_id,
      userName: ProPendingJobRequest.Request.name,
      userImage: ProPendingJobRequest.Request.image,
      userMobile: ProPendingJobRequest.Request.mobile,
      userDob: ProPendingJobRequest.Request.dob,
      userAddress: ProPendingJobRequest.Request.address,
      userLat: ProPendingJobRequest.Request.lat,
      userLang: ProPendingJobRequest.Request.lang,
      userFcmId: ProPendingJobRequest.Request.fcm_id,
      orderId: ProPendingJobRequest.Request.order_id,
      serviceName: ProPendingJobRequest.Request.service_name,
      mainId: ProPendingJobRequest.Request.id,
      delivertAddress: ProPendingJobRequest.Request.delivery_address,
      deliveryLat: ProPendingJobRequest.Request.delivery_lat,
      deliveryLang: ProPendingJobRequest.Request.delivery_lang,
      chatStatus: ProPendingJobRequest.Request.chat_status,
      status: ProPendingJobRequest.Request.status,
      proImageAvailable: null
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  };

  async componentDidMount(){
    console.log(this.props.generalInfo)
    const { navigation } = this.props;
    navigation.addListener('willFocus', async () => {
        console.log("willFocus runs >>")
        this.onRefresh();
    });
    imageExists(ProPendingJobRequest.Request.image).then(proImageAvailable => {
        this.setState({proImageAvailable});
    });
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  componentDidUpdate() {
      const { generalInfo: { usersCoordinates: { latitude, longitude} } } = this.props;
      const { sourceLat, sourceLng } = this.state;
      if (Math.floor(parseInt(latitude)) !== Math.floor(parseInt(sourceLat)) || Math.floor(parseInt(longitude)) !== Math.floor(parseInt(sourceLng))) 
        this.onRefresh();
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  async onRefresh() {
    const { generalInfo: { usersCoordinates, othersCoordinates } } = this.props;
     //Get latitude & longitude on Location change
     if (Platform.OS == 'ios') {
        let locationData = {
          latitude: usersCoordinates.latitude,
          longitude: usersCoordinates.longitude,
        }

        let updates = {};
        updates['tracking/' + this.state.orderId] = locationData;
        firebase.database().ref().update(updates);

        this.setState({
          sourcesourceLocation: usersCoordinates.latitude + "," + usersCoordinates.longitude,
          sourceLat: parseFloat(usersCoordinates.latitude),
          sourceLng: parseFloat(usersCoordinates.longitude),
          destinationLocation: othersCoordinates.latitude+ ','+othersCoordinates.longitude,
          destinationLat: parseFloat(othersCoordinates.latitude),
          destinationLng: parseFloat(othersCoordinates.longitude)
        })

      this.getDirections(usersCoordinates.latitude + "," + usersCoordinates.longitude, this.state.destinationLocation);
    
    }
    else {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

      if (granted) {

          let locationData = {
            latitude: usersCoordinates.latitude,
            longitude: usersCoordinates.longitude,
          }

          let updates = {};
          updates['tracking/' + this.state.orderId] = locationData;
          firebase.database().ref().update(updates);

          this.setState({
            sourcesourceLocation: usersCoordinates.latitude + "," + usersCoordinates.longitude,
            sourceLat: parseFloat(usersCoordinates.latitude),
            sourceLng: parseFloat(usersCoordinates.longitude),
          })

          this.getDirections(usersCoordinates.latitude + "," + usersCoordinates.longitude, this.state.destinationLocation);
      }
      else {
        console.log("ELSE");
        this.permissionRequest()
      }
    }
  }

  async permissionRequest(){
    try {
      if (Platform.OS == 'ios') Geolocation.requestAuthorization();
      else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            this.onRefresh();
        } 
        else{
        console.log("location permission denied");
        }
      }
    } 
    catch (err) {
      console.log(err);
    }
  }
 
  handleBackButtonClick() {
    if (this.state.pageTitle == "ProDashboard")
      this.props.navigation.navigate("ProDashBoard");
    else if (this.state.pageTitle == "ProAcceptRejectJob")
      this.props.navigation.navigate("ProAcceptRejectJob");

    return true;
  }

  callPhoneTask = () => {
    Linking.openURL('tel:'+this.state.userMobile)
  }

  async getDirections(startLoc, destinationLoc) {

    console.log("Start Location : "+startLoc);
    console.log("Destination Location : "+destinationLoc);

    //console.log("Destination Location : "+parseFloat(ProPendingJobRequest.Request.delivery_lat));

    try {
        let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${MAPS_API_KEY}`)
        let respJson = await resp.json();

        let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
        let routeCoordinates = points.map((point, index) => {
          return  {
            latitude : point[0],
            longitude : point[1]
          }
        })
        //If Delay some second, works fine..Reason don't know
        setTimeout(() => {
          this.setState({
            routeCoordinates: routeCoordinates,
            isLoading: false,
          })
          console.log("Route >> "+JSON.stringify(this.state.routeCoordinates));
          return this.state.routeCoordinates;
        }, 1500);
    } 
    catch(error) {
      this.setState({
        isLoading: false,
      })
        alert(error)
        return error
    }
  }

  openCompleteConfirmation = () => {
    Alert.alert(  
      "COMPLETED",  
      "Are you sure to complete request ?",  
      [  
          {  
              text: 'Cancel',  
              onPress: () => console.log('Cancel Pressed'),  
              style: 'cancel',  
          },  
          {
            text: 'OK', 
            onPress: this.jobCompleteTask,
          },  
      ]  
    ); 
  }

  openCancelConfirmation = () => {
    Alert.alert(  
      "CANCEL JOB REQUEST",  
      "Are you sure you want to cancel the job request?",  
      [  
          {  
              text: 'No',  
              onPress: () => console.log('Cancel Pressed'),  
              style: 'cancel',  
          },  
          {
            text: 'Yes', 
            onPress: this.jobCancelTask,
          },  
      ]  
    ); 
  }

  jobCompleteTask = () => {

    this.setState({
      isLoading: true
    });

    const data = {
      main_id: ProPendingJobRequest.Request.id,
      chat_status: '1',
      status: 'Completed',
      'notification': {
        "fcm_id": ProPendingJobRequest.Request.fcm_id,
        "title": "Job Completed",
        "body": 'Your job request has been completed by the service provder : ' + ProviderDetails.Provider.providerId,
        "data": {
          ProviderId: ProviderDetails.Provider.providerId,
          image: ProviderDetails.Provider.imageSource,
          fcmId: ProviderDetails.Provider.fcmId,
          name: ProviderDetails.Provider.name,
          surname: ProviderDetails.Provider.surname,
          mobile: ProviderDetails.Provider.mobile,
          description: ProviderDetails.Provider.description,
          address: ProviderDetails.Provider.address,
          lat: ProviderDetails.Provider.lat,
          lang: ProviderDetails.Provider.lang,
          serviceName: this.state.serviceName,
          orderId: ProPendingJobRequest.Request.order_id,
          mainId: ProPendingJobRequest.Request.id,
          chat_status: ProPendingJobRequest.Request.chat_status,
          status: ProPendingJobRequest.Request.status,
          delivery_address: ProPendingJobRequest.Request.delivery_address,
          delivery_lat: ProPendingJobRequest.Request.delivery_lat,
          delivery_lang: ProPendingJobRequest.Request.delivery_lang,
        },
      }
    }

    console.log("Complete Job >> " + JSON.stringify(data));

    fetch(REJECT_ACCEPT_REQUEST, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("Response : " + JSON.stringify(responseJson))
        if (responseJson.result) {
          this.setState({
            isLoading: false,
            isAcceptJob: true,
          })

          var jobData = {
            id: "",
            order_id: "",
            user_id: "",
            image: "",
            fcm_id: "",
            name: "",
            mobile: "",
            dob: "",
            address: "",
            lat: "",
            lang: "",
            service_name: "",
            chat_status: "",
            status: "",
            delivery_address: "",
            delivery_lat: "",
            delivery_lang: "",
          }
          ProPendingJobRequest.Request = jobData;
          this.props.navigation.navigate("ProDashBoard");
        }
        else {
          ToastAndroid.show("Something went wrong", ToastAndroid.show);
          this.setState({
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.log("Error >>> " + error);
        this.setState({
          isLoading: false,
        });
      })
  }

  jobCancelTask = () => {

    this.setState({
      isLoading: true
    });

    const data = {
      main_id: ProPendingJobRequest.Request.id,
      chat_status: '1',
      status: 'Canceled',
      'notification': {
        "fcm_id": ProPendingJobRequest.Request.fcm_id,
        "title": "Job Canceled",
        "body": 'Your job request has been canceled by the service provder : ' + ProviderDetails.Provider.providerId,
        "data": {
          ProviderId: ProviderDetails.Provider.providerId,
          image: ProviderDetails.Provider.imageSource,
          fcmId: ProviderDetails.Provider.fcmId,
          name: ProviderDetails.Provider.name,
          surname: ProviderDetails.Provider.surname,
          mobile: ProviderDetails.Provider.mobile,
          description: ProviderDetails.Provider.description,
          address: ProviderDetails.Provider.address,
          lat: ProviderDetails.Provider.lat,
          lang: ProviderDetails.Provider.lang,
          serviceName: this.state.serviceName,
          orderId: ProPendingJobRequest.Request.order_id,
          mainId: ProPendingJobRequest.Request.id,
          chat_status: ProPendingJobRequest.Request.chat_status,
          status: 'Canceled',
          delivery_address: ProPendingJobRequest.Request.delivery_address,
          delivery_lat: ProPendingJobRequest.Request.delivery_lat,
          delivery_lang: ProPendingJobRequest.Request.delivery_lang,
        },
      }
    }

    console.log("Complete Job >> " + JSON.stringify(data));

    fetch(REJECT_ACCEPT_REQUEST, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("Response : " + JSON.stringify(responseJson))
        if (responseJson.result) {
          this.setState({
            isLoading: false,
            isAcceptJob: true,
          })

          var jobData = {
            id: "",
            order_id: "",
            user_id: "",
            image: "",
            fcm_id: "",
            name: "",
            mobile: "",
            dob: "",
            address: "",
            lat: "",
            lang: "",
            service_name: "",
            chat_status: "",
            status: "",
            delivery_address: "",
            delivery_lat: "",
            delivery_lang: "",
          }
          ProPendingJobRequest.Request = jobData;
          this.props.navigation.navigate("ProDashBoard");
        }
        else {
          ToastAndroid.show("Something went wrong", ToastAndroid.show);
          this.setState({
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.log("Error >>> " + error);
        this.setState({
          isLoading: false,
        });
      })
  }

  changeWaitingDialogVisibility = (bool) => {
    this.setState({
        isLoading: bool
    })
  }

  render() {
    return (
      <View style={styles.container}>

        <StatusBarPlaceHolder/>

        <MapView style={styles.map}
          region={{
              latitude: this.state.sourceLat,
              longitude: this.state.sourceLng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0121,
          }}
          minZoomLevel={16}  
          maxZoomLevel={20}>
          {Platform.OS === 'ios' && (
            <View style={styles.header}>
              <View style={{ flex: 1, flexDirection: 'row',margin: 5}}>
                <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center',}}
                  onPress={() => this.props.navigation.goBack()}>
                  <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                    source={require('../icons/back_arrow_double.png')} />
                </TouchableOpacity>
              </View>
            </View>
          )}
         <MapView.Marker
            coordinate={{
              latitude: this.state.sourceLat,
              longitude: this.state.sourceLng,}}
            title="You"
            description={""}>
              <Image style={{width: 35, height: 35, backgroundColor:'transparent'}}
                source={require('../icons/car_marker.png')}/>
          </MapView.Marker>
          <MapView.Marker
            coordinate={{
              latitude: this.state.destinationLat,
              longitude: this.state.destinationLng,
            }}
            title="Destination"
            description={this.state.userName}>
              <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
                source={require('../icons/home_marker.png')} />
          </MapView.Marker> 
          <MapView.Polyline
              coordinates={this.state.routeCoordinates}
              strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
              strokeColors={[
                '#7F0000',
                '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
                '#B24112',
                '#E5845C',
                '#238C23',
                '#7F0000' 
              ]}
              strokeWidth={6}/>
          </MapView> 

          <SlidingPanel
            headerLayoutHeight={140}
            headerLayout={() =>
              <LinearGradient style={styles.headerLayoutStyle}
                colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                <View style={{ flex: 1, flexDirection: 'column', width: screenWidth }}>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 5 }}>
                    <Image style={{ width: 20, height: 20, }}
                      source={require('../icons/up_arrow.gif')}>
                    </Image>
                  </View>

                  <View style={{ flexDirection: 'row', flex: 1 }}>

                    <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'flex-start', marginLeft: 10, borderRadius: 200, }}
                      source={ this.state.proImageAvailable ? { uri: ProPendingJobRequest.Request.image } : require('../images/generic_avatar.png')} />
                    <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                      <Text style={{ marginRight: 200, color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center', }}
                        numberOfLines={1}>
                        {ProPendingJobRequest.Request.name}
                      </Text>
                      <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                        {ProPendingJobRequest.Request.service_name}
                      </Text>
                      <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                        {ProPendingJobRequest.Request.status == "Pending" ? "Chat Request Accepted" : "Job Accepted"}
                      </Text>
                    </View>

                    <View style={styles.callView}>
                      <TouchableOpacity style={{
                        width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10, marginRight: 15}}
                        onPress={this.callPhoneTask}>
                        <Image style={styles.call}
                          source={require('../icons/call.png')} />
                      </TouchableOpacity>

                      <TouchableOpacity style={{
                        width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10}}
                        onPress={() => this.props.navigation.navigate("ProChat",{
                          "pageTitle": "ProMapDirection"})}>
                        <Image style={styles.call}
                          source={require('../icons/chat.png')} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            }
            slidingPanelLayout={() =>
              <View style={styles.slidingPanelLayoutStyle}>
                <View style={styles.containerSlide}>

                  <TouchableOpacity style={styles.buttonContainer}
                    onPress={this.openCompleteConfirmation}>
                    <Text style={styles.text}>
                      Completed
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.buttonContainer}
                    onPress={this.openCancelConfirmation}>
                    <Text style={styles.text}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            }>
          </SlidingPanel>

        {/* {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator
              style={{ height: 80 }}
              color="#C00"
              size="large" />
          </View>
        )} */}
        <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth,
    height: screenHeight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    marginBottom: 140,
    marginTop:  Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
 },
  footerView: {
    alignContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    borderRadius: 10
  },
  footer: {
    width: screenWidth/1.5,
    flexDirection: 'column',
    backgroundColor: '#191970',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    padding: 15,
    borderRadius: 2,
    position: 'absolute', //Footer
    bottom: 0, //Footer
    marginBottom: 10,
  }, 
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerLayoutStyle: {
    width: screenWidth,
    height: 140,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.75,
    shadowRadius: 5, 
    elevation: 5,
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  containerSlide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: colorBg,
  },
  slidingPanelLayoutStyle: {
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: colorYellow, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  callView: {
    flex: 1,
    flexDirection:'row',
    height: 115,
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    end: 0,
    paddingRight: 15,
  },
  call: {
    width: 20,
    height: 20,
  }, 
  buttonContainer: {
    flex: 1,
    //width: 200,
    paddingTop: 10,
    backgroundColor: '#000000',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: colorYellow,
    borderWidth: 2,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {fontSize: 16,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
});

const mapStateToProps = state => {
    return {
        generalInfo: state.generalInfo
    }
}

export default connect(mapStateToProps)(ProMapDirectionScreen);