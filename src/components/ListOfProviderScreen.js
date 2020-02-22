import React, { Component } from 'react';
import {View, StyleSheet, TouchableOpacity, Image, Text,Dimensions, FlatList, 
    ActivityIndicator, BackHandler, StatusBar, Platform, Modal} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import { Rating, AirbnbRating } from 'react-native-ratings';
import Toast, {DURATION} from 'react-native-easy-toast';
import Config from './Config';
import UserDetails from './UserDetails';
import WaitingDialog from './WaitingDialog'; 

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const GET_ALL_PROVIDER_URL = Config.BASEURL+'job/serviceprovider/';

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

export default class ListOfProviderScreen extends Component {

    constructor(props) {
      super(props)
    
      this.state = {
        //From DashboardScreen  
        serviceName: this.props.navigation.state.params.serviceName,
        serviceId: this.props.navigation.state.params.serviceId,
        
        dataSource: [],
        isNoData: false,
        isData: false,
        isLoading: true,
      }
      this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentDidMount() {

        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

        console.log("URL : " + GET_ALL_PROVIDER_URL + this.props.navigation.state.params.serviceId);

        const data = {
            "lat": UserDetails.User.lat,
            "lang": UserDetails.User.lang,
        }
        fetch(GET_ALL_PROVIDER_URL + this.props.navigation.state.params.serviceId, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)})
            .then((response) => response.json())
            .then((responseJson) => {
                console.log("Response : " + JSON.stringify(responseJson))
                if (responseJson.result) {
                    this.setState({
                        dataSource: responseJson.data,  //data is key
                        isLoading: false,
                        isNoData: false,
                        isData: true,
                    })
                }
                else {
                    this.setState({
                        isLoading: false,
                        isNoData: true,
                        isData: false,
                    })
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    isLoading: false,
                })
                this.showToast('Something went wrong, Check your internet connection');
            })
    }
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {

        this.props.navigation.navigate("DashBoard");
        return true;
    }

    showToast = (message) => {
        this.refs.toast.show(message);
    }

    renderItem = ({ item }) => {

    return (
        <TouchableOpacity style={styles.itemMainContainer}
            onPress={() => 
            this.props.navigation.navigate("ProviderDetails", {
                'providerId': item.id, 
                'name': item.username, 
                'surname': item.surname,
                'image': item.image,
                'mobile': item.mobile,
                'distance': item.hash, 
                'address': item.address,
                'description': item.description,
                'status': item.status, 
                'fcmId': item.fcm_id,
                'accountType': item.account_type, 
                'serviceName': this.state.serviceName, 
                'serviceId': this.state.serviceId} )}>
          
            <View style={{ width: screenWidth, flexDirection: 'row', backgroundColor: 'white', 
                alignContent: 'center', padding: 10 }}>

                <View style={{ flexDirection: 'column' , marginLeft: 10}}>
                    
                    <Image style={{ width: 60, height: 60, borderRadius: 100, alignSelf: 'center'  }}
                        source={{ uri: item.image }} />

                    <View style={{ backgroundColor: 'white', marginTop: 5 }}>
                        <AirbnbRating
                            type='custom'
                            ratingCount={5}
                            size={10}
                            ratingBackgroundColor={colorBg}
                            showRating={false}
                            onFinishRating={this.ratingCompleted} />
                    </View>
                </View>    

                <View style={{ flexDirection: 'column', width: screenWidth-130, marginLeft: 10}}>
                    <Text style={{fontWeight: 'bold', color: 'black', fontSize: 16}}>{item.username+" "+item.surname}</Text>   
                    <Text style={{ width: screenWidth-120, color: 'black', fontSize: 12}}>{item.address}</Text>  
                    <Text style={{marginTop: 5,}}>
                        <Text style={{ fontWeight: 'bold', color: 'black', fontSize: 14}}>{item.hash+" Km"}</Text>  
                        <Text style={{ color: 'black', width: screenWidth-120, fontSize: 14}}> loin de vous</Text>    
                    </Text>  
                </View>
            </View>
        </TouchableOpacity>
    )
    }

    changeWaitingDialogVisibility = (boo) => {
        this.setState({
            isLoading: bool
        })
    }
    
  render() {
    return (
      <View style={styles.container}> 

        <StatusBarPlaceHolder/>
                
        <View style={styles.header}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={{ width: 35, height: 35, justifyContent: 'center',marginLeft: 5, }}
                    onPress={() => this.props.navigation.goBack()}>
                    <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                        source={require('../icons/arrow_back.png')} />
                </TouchableOpacity>

                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 5 }}>
                    {this.state.serviceName}
                </Text>
            </View>
        </View>

            {this.state.isData && 
                <View style={styles.listView}>
                    <FlatList
                        numColumns={1}
                        data={this.state.dataSource}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        extraData={this.state} />
                </View>
            }

            {this.state.isNoData && 
                <View style={{flex: 1, flexDirection: 'column', backgroundColor: colorBg, justifyContent: 'center',
                     alignItems: 'center'}}>
                    <View style={{width: 100, height: 100, borderRadius: 100, backgroundColor: colorYellow,
                        justifyContent: 'center', alignItems: 'center'}}>
                        <Image style={{width: 50, height: 50}}
                            source={require('../icons/service_provider_tool.png')}/>
                    </View>
                    <Text style={{fontSize: 18, marginTop: 10}}>Aucun fournisseur trouvé</Text>     
                </View>
            }
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
            <Toast
                ref="toast"
                style={{ backgroundColor: 'green' }}
                position='bottom'
                positionValue={200}
                fadeInDuration={750}
                fadeOutDuration={1000}
                opacity={0.8}
                textStyle={{ color: 'white' }}/>
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
        width: '100%',
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorYellow,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    itemMainContainer: {
        flex: 1, 
        flexDirection: 'row',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
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
        justifyContent: 'center'
    },
})
