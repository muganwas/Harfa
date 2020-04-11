import React, { Component } from 'react';
import {
  View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, ActivityIndicator, Linking,
  BackHandler, Alert, StatusBar, Platform,
} from 'react-native';
import { connect } from 'react-redux';
//import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import firebase from 'react-native-firebase';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import LinearGradient from 'react-native-linear-gradient';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import PendingJobRequest from './PendingJobRequest';
import UserDetails from './UserDetails';
import { MAPS_API_KEY } from 'react-native-dotenv';
import Config from './Config';

//const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const REJECT_ACCEPT_REQUEST = Config.baseURL+"jobrequest/updatejobrequest";

function StatusBarPlaceHolder() {
  return (
    Platform.OS === 'ios' ?
      <View style={{
        width: "100%",
        height: STATUS_BAR_HEIGHT,
        backgroundColor: colorPrimaryDark
      }}>
        <StatusBar
          barStyle="light-content" />
      </View>
      :
      <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
  );
}

class MapDirectionScreen extends Component {

  constructor(props) {
    super(props)
    const { usersCoordinates, othersCoordinates } = this.props.generalInfo;
    this.state = {
      sourceLocation: othersCoordinates.latitude + "," + othersCoordinates.longitude,
      sourceLat: parseFloat(othersCoordinates.latitude),
      sourceLng: parseFloat(othersCoordinates.longitude),
      destinationLocation: usersCoordinates.latitude + ',' + usersCoordinates.longitude,
      destinationLat: parseFloat(usersCoordinates.latitude),
      destinationLng: parseFloat(usersCoordinates.longitude),
      coords: [],
      isLoading: true,

      senderId: UserDetails.User.userId,
      senderImage: UserDetails.User.image,
      senderName: UserDetails.User.username,
      inputMessage: '',
      dataChatSource: [],

      //From DashboardScreen && ProviderDetailsScreen
      id: PendingJobRequest.Request.id,
      orderId: PendingJobRequest.Request.order_id,
      providerId: PendingJobRequest.Request.employee_id,
      providerImage: PendingJobRequest.Request.image,
      providerfcmId: PendingJobRequest.Request.fcm_id,
      providerName: PendingJobRequest.Request.name + " " + PendingJobRequest.Request.surName,
      providerMobile: PendingJobRequest.Request.mobile,
      providerDescription: PendingJobRequest.Request.description,
      providerAddress: PendingJobRequest.Request.address,
      providerLat: PendingJobRequest.Request.lat,
      providerLang: PendingJobRequest.Request.lang,
      serviceName: PendingJobRequest.Request.service_name,
      titlePage: this.props.navigation.state.params.titlePage
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  };

  componentDidMount() {
    const { generalInfo: { othersCoordinates }} = this.props;
    this.getDirections(othersCoordinates.latitude + "," + othersCoordinates.longitude, this.state.destinationLocation);
    var that = this;
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    firebase.notifications().onNotification((notification) => {

      const { title, body, data } = notification;

      console.log('Notification >>> ', notification);
      console.log("Title, body  data >>> " + title + " >>>" + body + " >>> " + JSON.stringify(data));

      if (title == "Chat Request Rejected") {
        that.setState({
          requestStatus: title,
          title: title,
          body: body,
          data: data,
          isJobAccepted: false,
        })
        that.showRejectionAlert("DEMANDE DE CHAT REJETÉE", "Le fournisseur de services a rejeté votre demande. Veuillez réessayer plus tard")
      }
      else if (title == "No Response") {
        that.setState({
          requestStatus: title,
          title: title,
          body: body,
          data: data,
        })
        var jobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address: '',
          delivery_lat: '',
          delivery_lang: '',
        }
        PendingJobRequest.Request = jobData;

        that.showRejectionAlert("Pas de réponse", "Le fournisseur de services n'a pas répondu à votre demande. Veuillez réessayer plus tard")
      }
      else if (title == "Job Accepted") {
        var pendingJobData = {
          id: data.mainId,
          order_id: data.orderId,
          employee_id: data.ProviderId,
          image: data.image,
          fcm_id: data.fcmId,
          name: data.name,
          surName: data.surname,
          mobile: data.mobile,
          description: data.description,
          address: data.address,
          lat: data.lat,
          lang: data.lang,
          service_name: data.serviceName,
          chat_status: data.chat_status,
          status: data.status,
          delivery_address: data.delivery_address,
          delivery_lat: data.delivery_lat,
          delivery_lang: data.delivery_lang,
        }
        PendingJobRequest.Request = pendingJobData;

        console.log('After Job Accepted >>> ', JSON.stringify(PendingJobRequest.Request));

        that.showRejectionAlert("EMPLOI ACCEPTÉ", "Votre travail a été accepté.")
      }
      else if (title == "Job Rejected") {
        that.setState({
          isJobAccepted: false
        })
        var jobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address: '',
          delivery_lat: '',
          delivery_lang: '',
        }
        PendingJobRequest.Request = jobData;
        that.showRejectionAlert("EMPLOI REJETÉ", "Votre travail a été rejeté. Veuillez réessayer plus tard")
      }
      else if (title == "Job Completed") {
        var jobData = {
          id: '',
          order_id: '',
          employee_id: '',
          image: '',
          fcm_id: '',
          name: '',
          surName: '',
          mobile: '',
          description: '',
          address: '',
          lat: '',
          lang: '',
          service_name: '',
          chat_status: '',
          status: '',
          delivery_address: '',
          delivery_lat: '',
          delivery_lang: '',
        }
        PendingJobRequest.Request = jobData;
        that.showRejectionAlert("TRAVAIL TERMINE", "Votre travail est terminé.")
      }
    });
  }

  componentDidUpdate() {
    const { generalInfo: { usersCoordinates, othersCoordinates: { latitude, longitude } }} = this.props;
    const { sourceLat, sourceLng } = this.state;
    if (Math.floor(parseInt(latitude)) !== Math.floor(parseInt(sourceLat)) || Math.floor(parseInt(longitude)) !== Math.floor(parseInt(sourceLng))) {
        this.setState({
            sourceLocation: othersCoordinates.latitude + "," + othersCoordinates.longitude,
            sourceLat: parseFloat(othersCoordinates.latitude),
            sourceLng: parseFloat(othersCoordinates.longitude),
            destinationLocation: usersCoordinates.latitude + ',' + usersCoordinates.longitude,
            destinationLat: parseFloat(usersCoordinates.latitude),
            destinationLng: parseFloat(usersCoordinates.longitude),
        });
        this.getDirections(latitude + "," + longitude, this.state.destinationLocation);
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
  }

  handleBackButtonClick() {
    if (this.state.titlePage == "Dashboard")
      this.props.navigation.navigate("DashBoard");
    else if (this.state.titlePage == "ProviderDetails")
      this.props.navigation.navigate("ProviderDetails");
    else if (this.state.titlePage == "Chat")
      this.props.navigation.navigate("Chat");
    return true;
  }

  async getDirections(startLoc, destinationLoc) {

    console.log("Start Location : " + startLoc);
    console.log("Destination Location : " + destinationLoc);

    try {
      let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${MAPS_API_KEY}`)
      let respJson = await resp.json();

      let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
      let coords = points.map((point, index) => {
        return {
          latitude: point[0],
          longitude: point[1]
        }
      })
      this.setState({
        coords: coords,
        isLoading: false,
      })

      return coords
    } catch (error) {
      alert(error)
      return error
    }
  }

  callPhoneTask = () => {
    Linking.openURL('tel:' + this.state.providerMobile)
  }

  showRejectionAlert = (title, message) => {
    console.log("Alert Show");
    var that = this;
    Alert.alert(
      title,
      message,
      [
        {
          // text: 'Cancel',  
          // onPress: () => console.log('Cancel Pressed'),  
          // style: 'cancel',  
        },
        {
          text: 'OK',
          onPress: () => {
            console.log("OK Press");
            that.props.navigation.navigate("Dashboard")
          },
        },
      ]
    );
  }

  openCompleteConfirmation = () => {
    Alert.alert(  
      "COMPLETED",  
      "Was the job completed successfully?",  
      [  
          {  
              text: 'Cancel',  
              onPress: () => console.log('Cancel Pressed'),  
              style: 'cancel',  
          },  
          {
            text: 'Yes', 
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
      main_id: PendingJobRequest.Request.id,
      chat_status: '1',
      status: 'Completed',
      'notification': {
        "fcm_id": PendingJobRequest.Request.fcm_id,
        "title": "Job Completed",
        "body": 'Your job request has been completed by '+' Request Id : ' + PendingJobRequest.Request.order_id,
        "data": {
          ProviderId: PendingJobRequest.Request.employee_id,
          image: PendingJobRequest.Request.image,
          fcmId: PendingJobRequest.Request.fcm_id,
          name: PendingJobRequest.Request.name,
          surname: PendingJobRequest.Request.surname,
          mobile: PendingJobRequest.Request.mobile,
          description: PendingJobRequest.Request.description,
          address: PendingJobRequest.Request.address,
          lat: PendingJobRequest.Request.lat,
          lang: PendingJobRequest.Request.lang,
          serviceName: PendingJobRequest.Request.service_name,
          orderId: PendingJobRequest.Request.order_id,
          mainId: PendingJobRequest.Request.id,
          chat_status: PendingJobRequest.Request.chat_status,
          status: PendingJobRequest.Request.status,
          delivery_address: PendingJobRequest.Request.delivery_address,
          delivery_lat: PendingJobRequest.Request.delivery_lat,
          delivery_lang: PendingJobRequest.Request.delivery_lang,
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
            id: '' ,
            order_id: '',
            employee_id: '',
            image: '', 
            fcm_id: '',
            name: '',
            surName: '',
            mobile: '',
            description: '',
            address: '',
            lat: 0,
            lang: 0,
            service_name: '',
            chat_status : '',
            status : '',
            delivery_address: '',
            delivery_lat: 0,
            delivery_lang: 0
          }
          PendingJobRequest.Request = jobData;
          this.props.navigation.navigate("DashBoard");
        }
        else {
          Alert.alert("OOPS!", "Something went wrong, try again later");
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

  render() {
    return (
      <View style={styles.container}>

        <StatusBarPlaceHolder />

        <MapView style={styles.map}
          region={{
            latitude: this.state.destinationLat,
            longitude: this.state.destinationLng,
            latitudeDelta: 0.922,
            longitudeDelta: 0.0121,
          }}
          zoomEnabled={true}
          minZoomLevel={16}
          maxZoomLevel={20}>
          {Platform.OS === 'ios' && (
            <View style={styles.header}>
              <View style={{ flex: 1, flexDirection: 'row', margin: 5 }}>
                <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
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
              longitude: this.state.sourceLng,
            }}
            title={UserDetails.User.username}
            description="Vous">
            <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
              source={require('../icons/home_marker.png')} />
          </MapView.Marker>

          <MapView.Marker
            coordinate={{
              latitude: this.state.destinationLat,
              longitude: this.state.destinationLng,
            }}
            title="Fournisseur"
            description={this.state.providerName}>

            <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
              source={require('../icons/car_marker.png')} />
          </MapView.Marker>
          <MapView.Polyline
            coordinates={this.state.coords}
            strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
            strokeColors={[
              '#7F0000',
              '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
              '#B24112',
              '#E5845C',
              '#238C23',
              '#7F0000'
            ]}
            strokeWidth={6} />
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
                    source={{ uri: PendingJobRequest.Request.image }} />
                  <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ marginRight: 200, color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center', }}
                      numberOfLines={1}>
                      {PendingJobRequest.Request.name + " " + PendingJobRequest.Request.surName}
                    </Text>
                    <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                      {PendingJobRequest.Request.service_name}
                    </Text>
                    <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                      {PendingJobRequest.Request.status == "Pending" ? "Demande de chat acceptée" : "Travail accepté"}
                    </Text>
                  </View>

                  <View style={styles.callView}>
                    <TouchableOpacity style={{
                      width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10, marginRight: 15
                    }}
                      onPress={this.callPhoneTask}>
                      <Image style={styles.call}
                        source={require('../icons/call.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity style={{
                      width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10
                    }}
                      onPress={() => this.props.navigation.navigate("Chat", {
                        "providerId": PendingJobRequest.Request.employee_id,
                        "providerName": PendingJobRequest.Request.name,
                        "providerSurname": PendingJobRequest.Request.surName,
                        "providerImage": PendingJobRequest.Request.image,
                        "serviceName": PendingJobRequest.Request.service_name,
                        "OrderId": PendingJobRequest.Request.order_id,
                        'titlePage': "MapDirection"
                      })}>
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
    marginTop: Platform.OS === 'ios' ? 20 : 0,
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
  callView: {
    flex: 1,
    flexDirection: 'row',
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
});

const mapStateToProps = state => {
    return {
        generalInfo: state.generalInfo
    }
}

export default connect(mapStateToProps)(MapDirectionScreen);