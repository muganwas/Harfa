import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, ScrollView, FlatList, TextInput, Dimensions,
    BackHandler, ImageBackground, StatusBar, Platform, Alert, ActivityIndicator,
    KeyboardAvoidingView
} from 'react-native';
//import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import ProviderDetails from './ProviderDetails';
import ImagePicker from 'react-native-image-picker';
import firebase from 'react-native-firebase';
import Config from './Config';
import { colorPrimary, colorPrimaryDark, colorYellow, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
//const screenHeight = Dimensions.get('window').height;

const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1
};

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const GET_IMAGE_URL = Config.baseURL+"thirdpartyapi/chatupload";

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

class ProChatAfterBookingDetailsScreen extends Component {

    constructor(props) {
        super(props)
        console.log('chat after booking')
        this.state = {
            showButton: false,
            senderId: ProviderDetails.Provider.providerId,
            senderName: ProviderDetails.Provider.name + " " + ProviderDetails.Provider.surname,
            senderImage: ProviderDetails.Provider.imageSource,
            inputMessage: '',
            showButton: false,
            dataChatSource: [],
            isLoading: true,
            isUploading: false,

            receiverId: this.props.navigation.state.params.receiverId,
            receiverName: this.props.navigation.state.params.receiverName,
            receiverImage: this.props.navigation.state.params.receiverImage,
            orderId: this.props.navigation.state.params.orderId,
            serviceName: this.props.navigation.state.params.serviceName,
            pageTitle: this.props.navigation.state.params.pageTitle,
        };

        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentDidMount() {
        const { fetchedNotifications } = this.props;
        fetchedNotifications({type: 'messages', value: 0});
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

        console.log("Sender Id: "+this.state.senderId);
        console.log("Receiver Id: "+this.state.receiverId);

        firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId)
            .on('child_added',value => {
                this.setState((prevState) => {
                    return {
                        dataChatSource: [...prevState.dataChatSource, value.val()],
                        isLoading: false,
                    }
                })
            })

        this.setState({
            isLoading: false
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        this.props.navigation.goBack();
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

    convertTime = (time) => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (c.getDay() !== d.getDay()) {
            result = d.getDay() + '/' + d.getMonth() + "/" + d.getFullYear() + ', ' + result;
        }
        return result;
    }

    showHideButton = (input) => {

        this.setState({
            inputMessage: input,
        })
        if (input == '') {
            this.setState({
                showButton: false,
            })
        }
        else {
            this.setState({
                showButton: true,
            })
        }
    }

    sendMessageTask = async () => {

        console.log("Sender Id : " + this.state.senderId);
        console.log("Receiver Id : " + this.state.receiverId);

        if (this.state.inputMessage.length > 0) {
            let msgId = firebase.database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                senderId: this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName,
                receiverId: this.state.receiverId,
                receiverName: this.state.receiverName,
                receiverImage: this.state.receiverImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
            }
            let recentMessageReceiver = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.senderId,
                name: this.state.senderName,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",
            }
            let recentMessageSender = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: firebase.database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
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
            firebase.database().ref().update(recentUpdates);

            this.setState({ inputMesage: '' });
        }

        this.setState({
            inputMessage: '',
            showButton: false,
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
        const senderImage = item.senderImage;
        return (
            this.state.senderId != item.senderId
                ?
                item.type == 'text'
                    ?
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                        <View style={styles.itemLeftChatContainer}>
                            <View style={styles.itemChatImageView}>
                                <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                    source={senderImage ? { uri: senderImage } : require('../images/generic_avatar.png')} />
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
                        <View style={{width: 125, height: 135, backgroundColor: 'white',
                              borderRadius: 3, marginRight: 10}}>
                            <Image style={{ width: 110, height: 110, marginHorizontal: 7.5, marginTop: 7.5}}
                                source={{ uri: item.imageMessage }}>
                            </Image>
                            <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right', 
                                 color: 'black', marginRight: 7.5, marginTop: 2 }}>
                                {this.convertTime(item.time)}
                            </Text>
                        </View>
                        {this.state.isUploading && item.textMessage == "uploading" &&(
                            <View style={styles.loaderStyle}>
                                <ActivityIndicator
                                    style={{ height: 40 }}
                                    color="#C00"
                                    size="large" />
                            </View>
                        )}
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
                                <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'white', marginLeft: 5 }}>
                                    {this.convertTime(item.time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    :
                    <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                        <View style={{width: 125, height: 135, backgroundColor: 'white',borderRadius: 3, 
                            marginRight: 10}}>
                            <Image style={{ width: 115, height: 115, marginHorizontal: 5, marginTop: 5}}
                                source={item.textMessage == "uploading" ? item.imageMessage : {uri: item.imageMessage}}
                                resizeMode='cover'>
                            </Image>
                            <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', textAlign: 'right', 
                                 color: 'black', marginRight: 7.5, marginTop: 2 }}>
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
        const receiverImage = this.props.navigation.state.params.receiverImage;
        let { showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior='padding'>
                <StatusBarPlaceHolder/>
                <ImageBackground style={styles.container}
                    source={require('../icons/bg_chat.png')}>

                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center',}}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10, }}
                                source={receiverImage ? { uri: receiverImage } : require('../images/generic_avatar.png')} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 10 }}>
                                {this.state.receiverName}
                            </Text>
                        </View>
                    </View>

                    <ScrollView ref={ref => this.scrollView = ref}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            this.scrollView.scrollToEnd({ animated: true })
                        }}
                        contentContainerStyle={{ overflow: 'hidden', }}>

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
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Type a message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>

                            <TouchableOpacity style={{ height: 50, justifyContent: 'center', alignItems: 'center',
                             alignContent: 'center', marginRight: 25 }}
                             onPress={this.selectPhoto.bind(this)}>
                                <Image style={{ width: 20, height: 20 }}
                                    source={require('../icons/camera.png')} />
                            </TouchableOpacity>
                            <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                                    onPress={this.sendMessageTask}>
                                    <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                        ENVOYER
                                    </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
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
        maxWidth: (screenWidth / 2) + 30,
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
        maxWidth: screenWidth / 2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
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
        messagesInfo: state.messagesInfo
    }
}

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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProChatAfterBookingDetailsScreen);