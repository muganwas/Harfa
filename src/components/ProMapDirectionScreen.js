import React, { Component } from 'react';
import {View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, ActivityIndicator, BackHandler, 
  Linking, PermissionsAndroid, Alert, StatusBar, Platform, Modal} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import firebase from 'firebase';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import ProPendingJobRequest from './ProPendingJobRequest';
import ProviderDetails from './ProviderDetails';
import Config from './Config';
import WaitingDialog from './WaitingDialog'

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 

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
        </View>
        :
        <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} /> 
    );
}

export default class ProMapDirectionScreen extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      sourcesourceLocation: ProviderDetails.Provider.lat+","+ProviderDetails.Provider.lang,
      sourceLat: parseFloat(ProviderDetails.Provider.lat),
      sourceLng: parseFloat(ProviderDetails.Provider.lang),
      destinationLocation: ProPendingJobRequest.Request.delivery_lat+','+ProPendingJobRequest.Request.delivery_lang,
      destinationLat: parseFloat(ProPendingJobRequest.Request.delivery_lat),
      destinationLng: parseFloat(ProPendingJobRequest.Request.delivery_lang),
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
      status: ProPendingJobRequest.Request.status
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  };

  async componentDidMount(){
    const { navigation } = this.props;
    navigation.addListener('willFocus', async () => {
        console.log("willFocus runs >>")
        this.onRefresh();
    });

    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  async onRefresh() {
    console.log("OnRefresh >> ");
     //Get latitude & longitude on Location change
     if (Platform.OS == 'ios') {
      await Geolocation.requestAuthorization();

      this.WatchID = Geolocation.watchPosition((lastPosition) => {
        console.log("New Location >> " + JSON.stringify(lastPosition));

        let locationData = {
          latitude: lastPosition.coords.latitude,
          longitude: lastPosition.coords.longitude,
        }

        let updates = {};
        updates['tracking/' + this.state.orderId] = locationData;
        firebase.database().ref().update(updates);

        this.setState({
          sourcesourceLocation: lastPosition.coords.latitude + "," + lastPosition.coords.longitude,
          sourceLat: parseFloat(lastPosition.coords.latitude),
          sourceLng: parseFloat(lastPosition.coords.longitude),
        })

      this.getDirections(lastPosition.coords.latitude + "," + lastPosition.coords.longitude, this.state.destinationLocation);
      
      // Geolocation.getCurrentPosition(
      //   (position) => {
      //       console.log("Position : " + JSON.stringify(position));
      //       let locationData = {
      //             latitude: position.coords.latitude,
      //             longitude: position.coords.longitude,
      //           }
      
      //           let updates = {};
      //           updates['tracking/' + this.state.orderId] = locationData;
      //           firebase.database().ref().update(updates);
      
      //           this.setState({
      //             sourcesourceLocation: position.coords.latitude + "," + position.coords.longitude,
      //             sourceLat: parseFloat(position.coords.latitude),
      //             sourceLng: parseFloat(position.coords.longitude),
      //           })
      //           console.log("Before GetDirection :: ");
      //           this.getDirections(position.coords.latitude + "," + position.coords.longitude, this.state.destinationLocation);
      },
        (error) => alert(JSON.stringify(error)),
        { enableHighAccuracy: true, });
    }
    else {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      console.log("Permission Granted >>> " + JSON.stringify(granted));

      if (granted) {
        console.log("If");

        this.WatchID = Geolocation.watchPosition((lastPosition) => {
          console.log("New Location : " + JSON.stringify(lastPosition));

          let locationData = {
            latitude: lastPosition.coords.latitude,
            longitude: lastPosition.coords.longitude,
          }

          let updates = {};
          updates['tracking/' + this.state.orderId] = locationData;
          firebase.database().ref().update(updates);

          this.setState({
            sourcesourceLocation: lastPosition.coords.latitude + "," + lastPosition.coords.longitude,
            sourceLat: parseFloat(lastPosition.coords.latitude),
            sourceLng: parseFloat(lastPosition.coords.longitude),
          })

          this.getDirections(lastPosition.coords.latitude + "," + lastPosition.coords.longitude, this.state.destinationLocation);
        },
          (error) => alert(JSON.stringify(error)),
          { enableHighAccuracy: true, });
      }
      else {
        console.log("ELSE");
        this.permissionRequest()
      }
    }
  }

  async permissionRequest(){
    try {
      console.log("REQUEST PERMISSION");
      console.log("Platform : " + Platform.OS)
        
      if (Platform.OS == 'ios') {
        await Geolocation.requestAuthorization();

        this.WatchID = Geolocation.watchPosition((lastPosition) => {
          console.log("New Location >> " + JSON.stringify(lastPosition));
  
          let locationData = {
            latitude: lastPosition.coords.latitude,
            longitude: lastPosition.coords.longitude,
          }
  
          let updates = {};
          updates['tracking/' + this.state.orderId] = locationData;
          firebase.database().ref().update(updates);
  
          this.setState({
            sourcesourceLocation: lastPosition.coords.latitude + "," + lastPosition.coords.longitude,
            sourceLat: parseFloat(lastPosition.coords.latitude),
            sourceLng: parseFloat(lastPosition.coords.longitude),
          })
  
        this.getDirections(lastPosition.coords.latitude + "," + lastPosition.coords.longitude, this.state.destinationLocation);

        // Geolocation.getCurrentPosition(
        //     (position) => {
        //         console.log("Position >> " + JSON.stringify(position));

        //         let locationData = {
        //           latitude: position.coords.latitude,
        //           longitude: position.coords.longitude,
        //         }
      
        //         let updates = {};
        //         updates['tracking/' + this.state.orderId] = locationData;
        //         firebase.database().ref().update(updates);
      
        //         this.setState({
        //           sourcesourceLocation: position.coords.latitude + "," + position.coords.longitude,
        //           sourceLat: parseFloat(position.coords.latitude),
        //           sourceLng: parseFloat(position.coords.longitude),
        //         })
        //         console.log("Before GetDirection >> ");
        //         this.getDirections(position.coords.latitude + "," + position.coords.longitude, this.state.destinationLocation);
              }, (error) => {
                console.log("Error: " + error.code, error);
                console.log("Error: " + error.code, error.message);
                this.setState({
                    isLoading: false,  
                })
            },
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
        );
      }
      else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          this.watchID = Geolocation.watchPosition((lastPosition) => {
            console.log("New Location >> " + JSON.stringify(lastPosition));

            let locationData = {
              latitude : lastPosition.coords.latitude,
              longitude : lastPosition.coords.longitude,
            }
    
            let updates = {};
            updates['tracking/' + this.state.orderId] = locationData;
            firebase.database().ref().update(updates);
    
            this.setState({
              sourcesourceLocation: lastPosition.coords.latitude+","+lastPosition.coords.longitude,
              sourceLat: parseFloat(lastPosition.coords.latitude),
              sourceLng: parseFloat(lastPosition.coords.longitude),
            })
    
            this.getDirections(lastPosition.coords.latitude+","+lastPosition.coords.longitude, this.state.destinationLocation);
          },
            (error) => alert(JSON.stringify(error)),
            { enableHighAccuracy: true, });
        } 
        else{
        console.log("location permission denied")
        }
      }
    } 
    catch (err) {
      console.log(err);
    }
  }
 
  handleBackButtonClick() {

    Geolocation.clearWatch(this.WatchID);

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
        let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${ startLoc }&destination=${ destinationLoc }&key=AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030`)
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
            onPress: () => {this.jobCompleteTask()},
          },  
      ]  
    ); 
  }

  jobCompleteTask = () => {

    this.setState({
      isLoading: true
    })

    const data = {
      main_id: ProPendingJobRequest.Request.id,
      chat_status: '1',
      status: 'Completed',
      'notification': {
        "fcm_id": ProPendingJobRequest.Request.fcm_id,
        "title": "Job Completed",
        "body": 'Your job request has been completed by '+' Request Id : ' + ProPendingJobRequest.Request.order_id,
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
                      source={{ uri: ProPendingJobRequest.Request.image }} />
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
    flexDirection: 'column',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    width: 200,
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
})