import React, { Component } from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Animated,
    Text, ActivityIndicator, ToastAndroid, BackHandler, StatusBar, Platform, Modal,} from 'react-native';
import {createAppContainer,} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import RNExitApp from 'react-native-exit-app';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import AsyncStorage from '@react-native-community/async-storage';
import { DrawerActions } from 'react-navigation-drawer';
import ShakingText from 'react-native-shaking-text';
import ImagePicker from 'react-native-image-picker';
import Toast, { DURATION } from 'react-native-easy-toast';
import Config from './Config';
import ProviderDetails from './ProviderDetails';
import ProServiceSelectScreen from './ProServiceSelectScreen';
import SelectAddressScreen from './SelectAddressScreen';
import WaitingDialog from './WaitingDialog';

const bgColor = '#E8EEE9';
const colorPrimary = '#262425';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';

const screenWidth = Dimensions.get('window').width;

const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1
};

const PRO_GET_PROFILE = Config.BASEURL+"employee/";
const PRO_IMAGE_UPDATE = Config.BASEURL+"employee/upload/";
const PRO_INFO_UPDATE = Config.BASEURL+"employee/";

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

class ProMyProfileScreen extends Component {

    constructor(props) {
      super(props)

      this.state = {
        providerId: ProviderDetails.Provider.providerId,
        imageSource: ProviderDetails.Provider.imageSource,
        email: ProviderDetails.Provider.email,
        name: ProviderDetails.Provider.name,
        surname: ProviderDetails.Provider.surname,
        mobile: ProviderDetails.Provider.mobile,
        services: '',
        description: ProviderDetails.Provider.description,
        address: ProviderDetails.Provider.address,
        error: '',
        invoice: ProviderDetails.Provider.invoice,
        isLoading: true,
        isErrorToast: false,
        galleryCameraImage: '',
        accountType: ProviderDetails.Provider.accountType,
        backClickCount: 0
    }
      this.springValue = new Animated.Value(100);
      this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    selectPhoto = () => {

        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else {
                let source = { uri: response.uri };
                this.setState({
                    imageSource: source,
                    error: '',
                    galleryCameraImage: 'galleryCamera',
                    isLoading : true
                });
                AsyncStorage.getItem('userId')
                .then((providerId) => this.updateImageTask(providerId, response));
            }
        });
    }
    
    componentDidMount = () => {
    
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
       
    // AsyncStorage.getItem('userId')
    // .then((providerId) => this.getProfile(providerId));

        this.setState({
            isLoading: false
        })

        var services = JSON.parse(ProviderDetails.Provider.services);
        var serviceName = '';

        for(i=0; i<services.length; i++){
            serviceName = serviceName+services[i].service_name+", ";
        }

        this.setState({
            services: serviceName
        })

        console.log("ProviderData : "+JSON.stringify(ProviderDetails.Provider));
        console.log("ServicesName : "+serviceName);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
    }

    _spring() {
        this.setState({ backClickCount: 1 }, () => {
            Animated.sequence([
                Animated.spring(
                    this.springValue,
                    {
                        toValue: -.15 * 1,
                        friction: 5,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),
                Animated.timing(
                    this.springValue,
                    {
                        toValue: 100,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),

            ]).start(() => {
                this.setState({ backClickCount: 0 });
            });
        });
    }

    //getProfile no need
    getProfile(providerId){

        if (providerId !== null){
            this.setState({
                isLoading: true
            })
            fetch(PRO_GET_PROFILE+providerId , {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                })
                .then((response) => response.json())
                .then((responseJson) => {
                
                console.log(JSON.stringify(responseJson));
            
                if(responseJson.result)
                {
                    this.setState({
                        providerId: responseJson.data.id,
                        imageSource: responseJson.data.image,
                        name: responseJson.data.username,
                        surname: responseJson.data.surname,
                        mobile: responseJson.data.mobile,
                        services: responseJson.data.services,
                        description: responseJson.data.description,
                        address: responseJson.data.address,
                        lat: responseJson.data.lat,
                        lang: responseJson.data.lang,
                        invoice: responseJson.data.invoice,
                        isLoading: false
                    })
                }
                else
                {
                    ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
                    this.setState({
                        isLoading: false
                    })
                }
            })
            .catch((error) => {
                alert("Error "+error);
                this.setState({
                    isLoading: false
                })
            });
        }
    }

    getDataFromServiceScreen=(data)=> {
        console.log("Data : "+data);

        var data = data.split("/")
        this.setState({
            serviceId: data[0],
            services: data[1],
        })
    } 

    getDataFromAddAddressScreen=(data)=> {
       
        console.log("Data : "+data);

        var data = data.split("/")
        this.setState({
            address: data[0],
            lat: data[1],
            lng: data[2],
        })
    }

    checkValidation = () => {

        this.setState({
            isLoading: true,
        })

        AsyncStorage.getItem('userId')
       .then((providerId) => this.updateInformation(providerId))
    }

    //Information Update
    updateInformation(providerId) {

        const userData = {
            "username": this.state.name,
            "surname": '', 
            "mobile": this.state.mobile,
            "services": this.state.serviceId,
            "description": this.state.description,
            "address": this.state.address,
            "lat": this.state.lat,
            "lang": this.state.lang,
            "invoice": this.state.invoice,
         }
    
        fetch(PRO_INFO_UPDATE+providerId,
            { 
                method: 'POST',
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body : JSON.stringify(userData)
        })
            .then((response) => response.json())       
            .then((response) => { 
                console.log("Response" +JSON.stringify(response)); 
                if(response.result)
                {
                    this.setState({
                        isLoading: false,
                        isErrorToast: false,
                    })
                    //ToastAndroid.show(response.message, ToastAndroid.show);
                    this.showToast(response.message);
                }
                else
                {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    })
                    //ToastAndroid.show(response.message, ToastAndroid.show);
                    this.showToast(response.message);
                }
            })
            .catch((error) => {
                console.log("Error :"+ error);
                this.setState({
                    isLoading: false,
                    isErrorToast: true
                })
                this.showToast("Something went wrong");
            })
            .done()
    }

    //Image Update
    updateImageTask(providerId, imageObject) {
        
        console.log("ImageObjectURI : "+imageObject.uri);

        let imageData = new FormData();
        imageData.append('image', {type:imageObject.type, uri: imageObject.uri, name: imageObject.fileName});

        console.log("ImageData : "+JSON.stringify(imageData));

        fetch(PRO_IMAGE_UPDATE+providerId,
        { 
            method: 'POST',
            headers:{  
                "Content-Type": "multipart/form-data",
                "otherHeader": "foo",
        },
        body : imageData} )
        .then((response) => response.json())       
        .then((response) => { 
            console.log("Response" +JSON.stringify(response)); 
            if(response.result)
            {
                this.setState({
                    isLoading: false,
                    isErrorToast: false
                })
                //ToastAndroid.show("Image Updated Successfully", ToastAndroid.show);
                this.showToast(response.message);
            }
            else
            {
                this.setState({
                    isLoading: false,
                    isErrorToast: true
                })
                //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                this.showToast(response.message);
            }
        })
        .catch((error) => {
            console.log("Error :"+ error);
            this.setState({
                isLoading: false,
                isErrorToast: true
            })
            this.showToast("Something went wrong");
        })
        .done()
    }

    showToast = (message) => {
        this.refs.toast.show(message);
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
            
            <View style={styles.header} >
                <View style={{ flex: 1, flexDirection: 'row',  }}>
                    <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', marginLeft: 5,}}
                        onPress={() => this.props.navigation.dispatch(DrawerActions.openDrawer())}>
                        <Image style={{ width: 25, height: 25, alignSelf: 'center',  }}
                            source={require('../icons/humberger.png')} />
                    </TouchableOpacity>
                    <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 10 }}>
                        Profile
                    </Text>
                </View>
            </View>

            <KeyboardAwareScrollView contentContainerStyle={{
                flexGrow: 1, justifyContent: 'center',
                alignItems: 'center', alwaysBounceVertical: true
            }}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='on-drag'>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                    <View style={{ flex: 0.35, width: screenWidth, backgroundColor: colorYellow, 
                        justifyContent: 'center', alignItems: 'center', }}>
                        <Image
                            style={{ width: 100, height: 100, borderRadius: 100, marginTop: 20 }}
                            source={this.state.galleryCameraImage == '' ? {uri: this.state.imageSource}: this.state.imageSource} />

                        <TouchableOpacity style={{
                            width: 40, height: 40, alignSelf: 'flex-end', alignContent: 'center', justifyContent: 'center', borderRadius: 50, backgroundColor: '#fff',
                            margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,}}
                            onPress={this.selectPhoto.bind(this)}>

                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/camera.png')} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logincontainer}>

                        <ShakingText style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
                            {this.state.error}
                        </ShakingText>

                        <View style={{width: screenWidth - 50, height: 50, justifyContent: 'center',
                            marginBottom: 15, backgroundColor: colorPrimaryDark, alignItems: 'center'}}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 10, marginBottom: 10 }}>
                                <View style={styles.buttonPrimaryDark}>
                                    <Text style={styles.text}>Account Type</Text>
                                </View>
                                <View style={styles.buttonGreen}>
                                    <Text style={styles.text}>{this.state.accountType}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.textInputView}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/ic_user_64dp.png')}></Image>
                            <TextInput style={{width: screenWidth-85, height: 50,  marginLeft: 10 }}
                                placeholder='Name'
                                value={this.state.name}
                                onChangeText={(nameInput) => this.setState({ error: '', name: nameInput })}>
                            </TextInput>
                        </View>

                        <View style={styles.textInputView}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/email.png')}/>
                            <Text style={{ width: screenWidth-85,  marginLeft: 10, textAlignVertical: 'center', alignSelf: 'center'}}>
                                {this.state.email}
                            </Text>
                        </View>

                        <View style={styles.textInputView}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/ic_user_64dp.png')}></Image>
                            <TextInput style={{width: screenWidth-85, height: 50,  marginLeft: 10 }}
                                placeholder='Mobile'
                                value={this.state.mobile}
                                onChangeText={(mobileInput) => this.setState({ error: '', mobile: mobileInput })}>
                            </TextInput>
                        </View>

                        <View style={styles.textView1}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/ic_settings_64dp.png')}/>
                                <Text style={{ width: screenWidth-85, color: 'black', fontSize: 16, textAlignVertical:'center', marginLeft: 10 }}
                                multiline={true}
                                onPress={() => this.props.navigation.navigate('ProServiceSelect', {
                                    onGoBack: this.getDataFromServiceScreen, })}>
                                {this.state.services}
                            </Text>
                        </View>

                        <View style={styles.textView1}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/description.png')}/>
                            <TextInput
                                style={{ width: screenWidth-85, color: 'black', fontSize: 16, marginLeft: 10 }}
                                placeholder='Description'
                                value={this.state.description}
                                multiline={true}
                                onChangeText={(descriptionInput) => this.setState({ error: '', description: descriptionInput })}>
                            </TextInput>
                        </View>

                        <View style={styles.textView1}>
                            <Image style={{ width: 15, height: 15, marginLeft: 5 }}
                                source={require('../icons/maps_location.png')}/>
                            <Text
                                style={{ width: screenWidth-85, color: 'black', fontSize: 16, marginLeft: 10 }}
                                value={this.state.address}
                                multiline={true}
                                onPress={() => this.props.navigation.navigate('SelectAddress', {
                                    onGoBack: this.getDataFromAddAddressScreen, })}>
                                {this.state.address}
                            </Text>
                        </View>

                        <View style={styles.textView}>
                            <Text style={{  color: 'black', fontSize: 16, textAlign: 'center', textAlignVertical:'center', marginTop: 5 }}>
                                Can you provide invoice
                            </Text>
                            {/* <View style={{flex: 1, flexDirection: 'row', marginTop: 10}}>
                                <Text style={[styles.invoice, {backgroundColor: 'grey',  
                                    borderColor: this.state.invoice == '1'  ? colorYellow : 'grey'}]}
                                    onPress={() => this.setState({invoice: '1'})}>Yes</Text>
                                <Text style={[styles.invoice, {marginLeft: 20, backgroundColor: 'grey', 
                                    borderColor: this.state.invoice == '0' ? colorYellow : 'grey'}]}
                                    onPress={() => this.setState({invoice: '0'})}>No</Text>
                            </View> */}
                            <View style={{ flex: 1, flexDirection: 'row', marginTop: 10, justifyContent: "center" }}>
                                <TouchableOpacity style={this.state.invoice == '1' ? styles.invoiceBorder : styles.invoice}
                                    onPress={() => this.setState({ invoice: '1' })}>
                                    <Text style={{ color: 'white', alignSelf: 'center', textAlignVertical: 'center', }}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[this.state.invoice == '0' ? styles.invoiceBorder : styles.invoice, { marginLeft: 20, }]}
                                    onPress={() => this.setState({ invoice: '0' })}>
                                    <Text style={{ color: 'white', alignSelf: 'center', textAlignVertical: 'center', }}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>    

                        <TouchableOpacity style={styles.buttonContainer}
                            onPress={this.checkValidation}>
                            <Text style={styles.text}>
                                Update
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </KeyboardAwareScrollView>

            <Toast
                ref="toast"
                style={{ backgroundColor: this.state.isErrorToast == true ? 'red' : 'green' }}
                position='bottom'
                positionValue={200}
                fadeInDuration={750}
                fadeOutDuration={1000}
                opacity={0.8}
                textStyle={{ color: 'white' }} />


            <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
            </Modal>

            <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                <Text style={styles.exitTitleText}>Press back again to exit the app</Text>
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

const AppStackNavigator = createStackNavigator({
    ProMyProfile: {
        screen: ProMyProfileScreen,
        navigationOptions:{
            header : null
        }
    },
    ProServiceSelect: {
        screen: ProServiceSelectScreen,
        navigationOptions: {
            header : null
        }
    },
    SelectAddress:{
        screen: SelectAddressScreen,
        navigationOptions: {
            header : null
        }
    },  
});

const XYZ = createAppContainer(AppStackNavigator);
export default XYZ;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent : 'center',
        alignItems: 'center',  
        backgroundColor: "#E8EEE9" 
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
    buttonGreen: {
        flex: 1,
        height: 40,
        paddingTop: 10,
        backgroundColor: 'green',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 1,
        borderColor: colorPrimaryDark,
        borderWidth: 0,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5
    },
    buttonPrimaryDark: {
        flex: 1,
        height: 40,
        paddingTop: 10,
        backgroundColor: colorPrimaryDark,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 1,
        borderColor: colorPrimaryDark,
        borderWidth: 0,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5
    },
    logincontainer: {
        flex: .65,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingBottom: 25
    },
    textInputView: {
        flexDirection: 'row', 
        width: screenWidth-40, 
        height: 45, 
        justifyContent: 'center',
        alignItems: 'center', 
        borderRadius: 5, 
        backgroundColor: 'white', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 }, 
        shadowOpacity: 0.75, 
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    textView1:{
        flex: 1,
        flexDirection: 'row',
        width: screenWidth-40,
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        paddingTop: 10,
        paddingBottom: 10, 
        paddingLeft: 5, 
        paddingRight: 5
    },
    buttonContainer : {
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
    text: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    textView: {
        flex: 1,
        width: screenWidth-40,
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        paddingTop: 15,
        paddingBottom: 15, 
        paddingLeft: 5, 
        paddingRight: 5
    },
    textInputViewDes: {
        flexDirection: 'row', 
        width: screenWidth - 40, 
        height: 120, 
        justifyContent: 'center',
        alignItems: 'center', 
        borderRadius: 5, 
        backgroundColor: 'white', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 }, 
        shadowOpacity: 0.75, 
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10
    },
    invoice: {
        height: 30,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 2,
        paddingBottom: 2,
        backgroundColor: 'grey',
        borderColor: 'grey',
        borderRadius: 5,
        borderWidth: 2,
        justifyContent: 'center',
        color: 'white'
    },
    invoiceBorder: {
        height: 30,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 2,
        paddingBottom: 2,
        backgroundColor: 'grey',
        borderColor: colorYellow,
        borderRadius: 5,
        borderWidth: 2,
        justifyContent: 'center',
        alignContent: 'center',
        color: 'white',
    },
    animatedView: {
        width: screenWidth,
        backgroundColor: colorPrimaryDark,
        elevation: 2,
        position: "absolute",
        bottom: 0,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    exitTitleText: {
        textAlign: "center",
        color: 'white',
        marginRight: 20,
    },
    exitText: {
        color: 'red',
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 3
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
