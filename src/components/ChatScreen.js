import React, { Component } from 'react';
import {View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, FlatList, TextInput, Dimensions, 
    ToastAndroid, ActivityIndicator, BackHandler, ImageBackground, StatusBar, Platform, Alert}  from 'react-native';
import firebase from 'firebase';
import ImagePicker from 'react-native-image-picker';
import firebaseMessaging, { Notification, RemoteMessage } from 'react-native-firebase';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import UserDetails from './UserDetails';
import PendingJobRequest from './PendingJobRequest';

import Config from './Config';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const GET_IMAGE_URL = Config.BASEURL+"thirdpartyapi/chatupload"

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

const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1
};

export default class ChatScreen extends Component {

    constructor(props) {
      super(props)

        this.state ={
        senderId: UserDetails.User.userId,
        senderImage: UserDetails.User.image,
        senderName: UserDetails.User.username,
        inputMessage: '',
        showButton: false,
        dataChatSource: [],
        isLoading: true,
        isUploading: false,
        isJobAccepted: this.props.navigation.state.params.isJobAccepted,

        receiverId: PendingJobRequest.Request.employee_id,
        receiverName: PendingJobRequest.Request.name + " " +PendingJobRequest.Request.surName,
        receiverImage: PendingJobRequest.Request.image,
        serviceName: PendingJobRequest.Request.service_name,
        orderId: PendingJobRequest.Request.order_id,
        titlePage: this.props.navigation.state.params.titlePage,
      }
      this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentWillMount(){

        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

        //Get Chat Message
        firebase.database().ref('chatting').child(UserDetails.User.userId).child(PendingJobRequest.Request.employee_id)
        .on('child_added', (value)=>{
            this.setState((prevState)=>{
                return {
                    dataChatSource: [...prevState.dataChatSource, value.val()],
                    isLoading: false
                }
            })
        });

        //Get Job accept reject status
        firebaseMessaging.notifications().onNotification((notification) => {

            const { title, body, data } = notification;
            console.log('Notification >>> ', notification);
            console.log("Title, body  data >>> " + title + " " + body + " " + data);

            if (title == "Job Accepted") {
                this.setState({
                    isJobAccepted: true,
                });
                //ToastAndroid.show("Your request accepted", ToastAndroid.SHORT);
            }
            else if (title == "Job Rejected") {
                this.setState({
                    isJobAccepted: false,
                });
                //ToastAndroid.show("Your request rejected", ToastAndroid.SHORT);
                this.props.navigation.navigate("ListOfProvider");
            }
        });

        this.setState({
            isLoading: false,
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        if (this.state.titlePage == 'MapDirection')
            this.props.navigation.navigate("MapDirection",{
                titlePage: "Chat"
              });
        else if (this.state.titlePage == 'ProviderDetails')
            this.props.navigation.navigate("ProviderDetails");
        return true;
    }

    selectPhoto = () => {

        console.log('SELECT PHOTO ');

        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else {
              
                let source 
                
                source = { uri: response.uri };
               
                this.setState({
                    imageURI: source,
                    imageDataObject: response,
                });

                this.getImageURL(response)
            }
        });
    }

    convertTime = (time) => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if(c.getDay() !== d.getDay()){
            result = d.getDay() + '/' + d.getMonth()+"/"+d.getFullYear() + ', ' + result; 
        }
        return result;
    }

    showHideButton = (input) => {

        this.setState({
            inputMessage : input,
        })
        if(input == '')
        {
            this.setState({
                showButton: false,
            })
        }
        else
        {
            this.setState({
                showButton: true,
            })
        }
    }

    sendMessageTask = async () => {

        console.log("Sender Id : "+this.state.senderId);
        console.log("Receiver Id : "+this.state.receiverId);

        if(this.state.inputMessage.length > 0)
        {
            let msgId = firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage : this.state.inputMessage,
                imageMessage: '',
                time : firebase.database.ServerValue.TIMESTAMP,
                senderId : this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName,
                receiverId : this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage : this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(),
            }
            let recentMessageReceiver = {
                textMessage : this.state.inputMessage,
                imageMessage: '',
                time : firebase.database.ServerValue.TIMESTAMP,
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(), 
                id: this.state.senderId,
                name: this.state.senderName,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",
            }
            let recentMessageSender = {
                textMessage : this.state.inputMessage,
                imageMessage: '',
                time : firebase.database.ServerValue.TIMESTAMP,
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(),
                id: this.state.receiverId,
                name: this.state.receiverName,
                image: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,  
                type: "text",   
            }
            updates['chatting/' + this.state.senderId + '/' + this.state.receiverId + '/' + msgId] = message;
            updates['chatting/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = message;
            firebase.database().ref().update(updates);

            recentUpdates['recentMessage/' + this.state.senderId + '/' + this.state.receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + this.state.receiverId + '/' + this.state.senderId] = recentMessageReceiver;
            firebase.database().ref().update(recentUpdates)

            this.setState({inputMesage: ''});
        }

        this.setState({
            inputMessage: '',
            showButton: false,
        });
    }

    getImageURL = async (imageObject) => {
       
        let message = {
            textMessage: 'uploading',
            imageMessage: imageObject,
            time: firebase.database.ServerValue.TIMESTAMP,
            senderId: this.state.senderId,
            senderImage: this.state.senderImage,
            senderName: this.state.senderName,
            receiverId: this.state.receiverId,
            receiverName: this.state.receiverName,
            receiverImage: this.state.receiverImage,
            serviceName: this.state.serviceName,
            orderId: this.state.orderId,
            type: "image",
            date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
        }
        this.setState(prevState => ({
            dataChatSource: [...prevState.dataChatSource, message]
        }))

        this.setState({
            isUploading: true
        })
        
        let imageData = new FormData();
        imageData.append('file', { type: imageObject.type, uri: imageObject.uri, name: imageObject.fileName });
           
        fetch(GET_IMAGE_URL , {
            method: 'POST',
            headers: {
                "Content-Type": "multipart/form-data",
                "otherHeader": "foo",
            },
            body: imageData
         })
         .then((response) => response.json())
         .then((responseJson) => {
            console.log("Response getImageURL >> "+JSON.stringify(responseJson));
            this.setState({
                isLoading: false
            })
            if(responseJson.result)
            {
                this.sendImageTask(responseJson.file);
            }
            else
            {
                Alert.alert(
                    "OOPS !",
                    responseJson.message,
                    [
                        {
                            text: 'Cancel',
                            onPress: () => console.log('Cancel Pressed'),
                        },
                        {
                            text: 'Retry',
                            onPress: () => this.getImageURL(imageObject),
                        },
                    ]
                );
            }
         })
        .catch((error) => {
            Alert.alert(
                "OOPS !",
                error,
                [
                    {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                    },
                    {
                        text: 'Retry',
                        onPress: () => this.getImageURL(imageObject),
                    },
                ]
            );
        });
    }

    sendImageTask = async (imageURL) => {
       
        console.log("Sender Id : "+this.state.senderId);
        console.log("Receiver Id : "+this.state.receiverId);

        if(imageURL != '' && imageURL != null)
        {
            let msgId = firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage : '',
                imageMessage: imageURL,
                time : firebase.database.ServerValue.TIMESTAMP,
                senderId : this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName,
                receiverId : this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage : this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "image",
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(),
            }
            let recentMessageReceiver= {
                textMessage : '',
                imageMessage: imageURL,
                time : firebase.database.ServerValue.TIMESTAMP,
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(), 
                id: this.state.senderId,
                name: this.state.senderName,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "image",
            }
            let recentMessageSender = {
                textMessage : '',
                imageMessage: imageURL,
                time : firebase.database.ServerValue.TIMESTAMP,
                date : new Date().getDate() +"/"+ (new Date().getMonth()+1)+"/"+new Date().getFullYear(),
                id: this.state.receiverId,
                name: this.state.receiverName,
                image: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,  
                type: "image",   
            }

            //Remove Last item from Array
            var array = [...this.state.dataChatSource]; // make a separate copy of the array
            if (array.length > 0) {
                array.splice(array.length-1, 1);
                this.setState({ dataChatSource: array });
            }

            updates['chatting/' + this.state.senderId + '/' + this.state.receiverId + '/' + msgId] = message;
            updates['chatting/' + this.state.receiverId + '/' + this.state.senderId + '/' + msgId] = message;
            firebase.database().ref().update(updates);

            recentUpdates['recentMessage/' + this.state.senderId + '/' + this.state.receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + this.state.receiverId + '/' + this.state.senderId] = recentMessageReceiver;

            firebase.database().ref().update(recentUpdates)

            this.setState({
                isUploading: false,
            })
        }
    }

    renderMessageItem = ({ item }) => {
        return (
            this.state.senderId != item.senderId
                ?
                item.type == 'text'
                    ?
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={styles.itemLeftChatContainer}>
                            <View style={styles.itemChatImageView}>
                                <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                    source={{ uri: item.senderImage }} />
                            </View>
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                    {item.textMessage}
                                </Text>
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                    {this.convertTime(item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    :
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={{width: 125, height: 140, backgroundColor: 'white',
                            borderRadius: 3, borderWidth: 0, marginRight: 10}}>
                            <Image style={{ width: 115, height: 115, marginHorizontal: 5, marginTop: 5 }}
                                source={{ uri: item.imageMessage }}>
                            </Image>
                            <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right', 
                                 color: 'black', marginRight: 5, marginTop: 2 }}>
                                {this.convertTime(item.time)}
                            </Text>
                        </View>
                    </View>
                :
                item.type == 'text'
                    ?
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={styles.itemRightChatContainer}>
                            <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                    {item.textMessage}
                                </Text>
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', 
                                color: 'white', marginRight: 5, marginTop: 4}}>
                                    {this.convertTime(item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    :
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={{width: 125, height: 140, backgroundColor: 'white',borderRadius: 3, 
                            marginRight: 10,}}>
                            <Image style={{ width: 115, height: 115,marginHorizontal: 5, marginTop: 5 }}
                                source={item.textMessage == "uploading" ? item.imageMessage : {uri: item.imageMessage}}
                                resizeMode='cover'>
                            </Image>
                            <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right', 
                                 color: 'black', marginRight: 5, marginTop: 4 }}>
                                {this.convertTime(item.time)}
                            </Text>

                            {this.state.isUploading && item.textMessage == "uploading" &&(
                            <View style={styles.loaderStyle}>
                                <ActivityIndicator
                                    style={{ height: 40 }}
                                    color="#C00"
                                    size="large" />
                            </View>
                        )}
                        </View>
                    </View>
        )
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

  render() {
    return (

        <View style={styles.container}>

            <StatusBarPlaceHolder />

            <ImageBackground style={styles.container}
                source={require('../icons/bg_chat.png')}>

                <View style={{flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 10, paddingRight: 20, paddingBottom: 5}}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center' }}
                            onPress={() => this.props.navigation.goBack()}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10 }}
                            source={{ uri: this.state.receiverImage }} />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            {this.state.receiverName + " "}{this.state.surname}
                        </Text>
                    </View>
                </View>

                <KeyboardAwareScrollView ref={ref => this.scrollView = ref}
                    contentContainerStyle={{ justifyContent: 'center', alignItems: 'center',
                        alwaysBounceVertical: true}}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'>

                    <View style={{ flexDirection: 'column', marginBottom: 45 }}>
                        <View style={styles.listView}>
                            <FlatList
                                numColumns={1}
                                data={this.state.dataChatSource}
                                renderItem={this.renderMessageItem}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                extraData={this.state}
                                ItemSeparatorComponent={this.renderSeparator}
                                ref={(ref) => { this.myFlatListRef = ref }}
                                onContentSizeChange={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }}
                                onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                <View style={styles.footer}>
                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                    <View style={{ flex: 1, flexDirection: 'row', }}>
                        <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                            placeholder='Tapez un message'
                            value={this.state.inputMessage}
                            multiline={true}
                            onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                        </TextInput>

                        <TouchableOpacity style={{ height: 50, justifyContent: 'center', alignItems: 'center',
                         alignContent: 'center', marginRight: 25}}
                         onPress={this.selectPhoto.bind(this)}>
                            <Image style={{width:20, height:20}}
                                source={require('../icons/camera.png')}/>
                        </TouchableOpacity>

                        {this.state.showButton &&
                            <TouchableOpacity style={{ height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0, }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: colorYellow, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                                </Text>
                            </TouchableOpacity>
                        }
                    </View>
                    {this.state.isJobAccepted && (
                        <View style={{flexDirection: 'column', width: screenWidth, height: 50, backgroundColor: 'white',
                            borderRadius: 2, alignItems: 'center', justifyContent: 'flex-start',}}>
                            <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                            <TouchableOpacity style={styles.textViewDirection}
                                onPress={() => this.props.navigation.navigate("MapDirection",{
                                    "titlePage": "ProviderDetails"})}>
                                <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                    source={require('../icons/mobile_gps.png')} />
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                    Fournisseur de services de suivi
                                </Text>
                                <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                    source={require('../icons/right_arrow.png')} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )}
            </ImageBackground>

        </View>
    );
  }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listView: {
        flex: 1,
        padding: 5,
      },
      footer: {
        width: screenWidth,
        minHeight: 50,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
     }, 
     itemLeftChatContainer: {
        maxWidth: (screenWidth/2)+30,
        flexDirection: 'row',
        backgroundColor: colorGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
    },
    itemChatImageView: {
        width: 20,
        height: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRightChatContainer: {
        maxWidth: screenWidth/2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
    }, 
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
