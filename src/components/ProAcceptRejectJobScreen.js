import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, TextInput, ScrollView, FlatList, Dimensions, BackHandler, ImageBackground, StatusBar, Platform, Modal
} from 'react-native';
import { withNavigation } from 'react-navigation';
import database from '@react-native-firebase/database';
import WaitingDialog from './WaitingDialog';
import Toast from 'react-native-simple-toast';
import Geolocation from 'react-native-geolocation-service';
import { 
    startFetchingNotification, 
    notificationsFetched, 
    notificationError 
} from '../Redux/Actions/notificationActions';
import { 
    fetchedJobProviderInfo,
    startFetchingJobProvider, 
    fetchProviderJobInfoError, 
    setSelectedJobRequest,
    getAllWorkRequestPro
} from '../Redux/Actions/jobsActions';
import Config from './Config';
import { cloneDeep } from 'lodash';
import { colorPrimary, colorPrimaryDark, colorYellow, colorGray, colorBg, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const options = {
    title: 'Sélectionnez une photo',
    takePhotoButtonTitle: 'Prendre une photo',
    chooseFromLibraryButtonTitle: 'Choisir depuis la galerie',
    quality: 1
};

const StatusBarPlaceHolder = () => {
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

class ProAcceptRejectJobScreen extends Component {

    constructor(props) {
        super()
        const { userInfo: { providerDetails }, jobsInfo: { jobRequestsProviders }, navigation } = props;
        let currRequestPos = navigation.getParam('currentPos', 0);
        this.state = {
            senderId: providerDetails.providerId,
            senderImage: providerDetails.imageSource,
            senderName: providerDetails.name,
            senderSurname: providerDetails.surname,
            inputMessage: '',
            showButton: false,
            isAcceptJob: jobRequestsProviders[currRequestPos].status === "Accepted",
            isRejectJob: false,
            dataChatSource: [],
            isLoading: true,
            isErrorToast: false,
            receiverId: jobRequestsProviders[currRequestPos].user_id,
            receiverName: jobRequestsProviders[currRequestPos].name,
            receiverImage: jobRequestsProviders[currRequestPos].image,
            receiverMobile: jobRequestsProviders[currRequestPos].mobile,
            receiverDob: jobRequestsProviders[currRequestPos].dob,
            receiverAddress: jobRequestsProviders[currRequestPos].address,
            receiverLat: jobRequestsProviders[currRequestPos].lat,
            receiverLang: jobRequestsProviders[currRequestPos].lang,
            receiverFcmId: jobRequestsProviders[currRequestPos].fcm_id,
            orderId: jobRequestsProviders[currRequestPos].order_id,
            serviceName: jobRequestsProviders[currRequestPos].service_name,
            mainId: jobRequestsProviders[currRequestPos].id,
            delivertAddress: jobRequestsProviders[currRequestPos].delivery_address,
            deliveryLat: jobRequestsProviders[currRequestPos].delivery_lat,
            deliveryLang: jobRequestsProviders[currRequestPos].delivery_lang,
            chatStatus: jobRequestsProviders[currRequestPos].chat_status,
            status: jobRequestsProviders[currRequestPos].status,
            userImageExists: jobRequestsProviders[currRequestPos].imageAvailable,
            currRequestPos
        };
    };

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        database().ref('chatting').child(this.state.senderId).child(this.state.receiverId)
            .on('child_added', value => {
                this.setState(prevState => {
                    return {
                        dataChatSource: [...prevState.dataChatSource, value.val()],
                        isLoading: false,
                    }
                })
            });

        this.setState({
            isLoading: false,
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick = () => {
        this.props.navigation.navigate("ProDashboard");
        return true;
    }

    renderMessageItem = ({ item }) => {
        if (item) {
            return (
                this.state.senderId != item.senderId
                    ?
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                            <View style={styles.itemLeftChatContainer}>
                                <View style={styles.itemChatImageView}>
                                    <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                        source={this.state.userImageExists ? { uri: item.senderImage } : require('../images/generic_avatar.png')} />
                                </View>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{ fontSize: 8, color: 'black', textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
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
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
            )
        }

    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
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

    sendMessageTask = () => {
        if (this.state.inputMessage.length > 0) {
            let msgId = database().ref('chatting').child(this.state.senderId).child(this.state.receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                senderId: this.state.senderId,
                senderImage: this.state.senderImage,
                senderName: this.state.senderName + " " + this.state.senderSurname,
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
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: this.state.senderId,
                name: this.state.senderName + " " + this.state.senderSurname,
                image: this.state.senderImage,
                serviceName: this.state.serviceName,
                orderId: this.state.orderId,
                type: "text",

            }
            let recentMessageSender = {
                textMessage: this.state.inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
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
            database().ref().update(updates);

            recentUpdates['recentMessage/' + this.state.senderId + '/' + this.state.receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + this.state.receiverId + '/' + this.state.senderId] = recentMessageReceiver;
            database().ref().update(recentUpdates)

            this.setState({
                inputMessage: '',
                showButton: false,
            });
        }
    }

    acceptJobTask = () => {
        this.setState({
            isLoading: true
        });
        const { userInfo: { providerDetails } } = this.props;
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Accepted',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Accepted",
                "type": "JobAcceptence",
                "Notification_by": "Employee",
                "body": 'Your request has been accepted by ' + providerDetails.name + " " + providerDetails.surname + ' Request Id : ' + this.state.orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    image: providerDetails.imageSource,
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: "1",
                    status: "Accepted",
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }

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
                const { fetchedPendingJobInfo, getAllWorkRequestPro, jobsInfo: { jobRequestsProviders } } = this.props;
                const { currRequestPos } = this.state;
                var newjobRequestsProviders = cloneDeep(jobRequestsProviders);
                if (responseJson.data) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    });
     
                    newjobRequestsProviders[currRequestPos].chat_status = responseJson.data.chat_status;
                    newjobRequestsProviders[currRequestPos].status = responseJson.data.status;
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    getAllWorkRequestPro(providerDetails.providerId);
                    //Send Location to Firebase for tracking
                    Geolocation.getCurrentPosition(
                        (position) => {
                            //console.log("Position : " + JSON.stringify(position));
                            let locationData = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            }

                            let updates = {};
                            updates['tracking/' + this.props.navigation.state.params.orderId] = locationData;
                            database().ref().update(updates);
                        });
                }
                else {
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Something went wrong");
                }
            })
            .catch((error) => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            })
    };

    rejectJobTask = () => {
        this.setState({
            isLoading: true
        });
        const { userInfo: { providerDetails } } = this.props;
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Rejected',
            'notification': {
                "fcm_id": this.state.receiverFcmId,
                "title": "Job Rejected",
                "type": "JobRejection",
                "notification_by": "Employee",
                "body": 'Your request has been rejected by ' + providerDetails.name + ' Request Id : ' + this.state.orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    image: providerDetails.imageSource,
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: "0",
                    status: "Rejected",
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }

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
                const { fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
                const { currRequestPos } = this.state;
                var newjobRequestsProviders = [...jobRequestsProviders];
                if (responseJson.result) {
                    this.setState({
                        isLoading: false,
                        isRejectJob: true
                    });
                    newjobRequestsProviders.splice(currRequestPos, 1);
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    this.props.navigation.replace("ProDashboard");
                }
                else {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Something went wrong")
                }
            })
            .catch(error => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            });
    };

    goToMapDirection = () => {
        const { userInfo: { providerDetails }, fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders } } = this.props;
        const { currRequestPos } = this.state;
        var newjobRequestsProviders = [...jobRequestsProviders];
        var jobData = {
            ProviderId: providerDetails.providerId,
            image: providerDetails.imageSource,
            fcmId: providerDetails.fcmId,
            name: providerDetails.name,
            surname: providerDetails.surname,
            mobile: providerDetails.mobile,
            description: providerDetails.description,
            address: providerDetails.address,
            lat: providerDetails.lat,
            lang: providerDetails.lang,
            serviceName: this.state.serviceName,
            orderId: this.state.orderId,
            mainId: this.state.mainId,
            chat_status: "1",
            status: "Accepted",
            delivery_address: this.state.delivertAddress,
            delivery_lat: this.state.deliveryLat,
            delivery_lang: this.state.deliveryLang,
        }
        newjobRequestsProviders[currRequestPos] = jobData;
        fetchedPendingJobInfo(newjobRequestsProviders);
        this.props.navigation.navigate("ProMapDirection", {
            'pageTitle': "ProAcceptRejectJob",
        });
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { showButton } = this.state;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TouchableOpacity style={{ width: 20, height: 20, alignSelf: 'center' }}
                            onPress={this.handleBackButtonClick}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>

                        <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 20 }}
                            source={this.state.userImageExists ? { uri: this.state.receiverImage } : require('../images/generic_avatar.png')} />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            {this.state.receiverName}
                        </Text>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'column', marginBottom: 110 }}>
                        <ImageBackground style={styles.listView}
                            source={require('../icons/bg_chat.png')}>
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
                        </ImageBackground>

                        {this.state.isAcceptJob && (
                            <TouchableOpacity style={styles.textViewDirection}
                                onPress={this.goToMapDirection}>
                                <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                    source={require('../icons/mobile_gps.png')} />
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                    Direction
                            </Text>
                                <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                    source={require('../icons/right_arrow.png')} />
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    {(!this.state.isAcceptJob && !this.state.isRejectJob) &&
                        <View style={{
                            flex: 1, width: screenWidth, justifyContent: 'center',
                            backgroundColor: 'white', alignItems: 'center'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 10, marginBottom: 10 }}>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.acceptJobTask}>
                                    <Text style={styles.text}>Accepter l'emploi</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.rejectJobTask}>
                                    <Text style={styles.text}>Refuser le travail</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                            placeholder='Tapez un message'
                            value={this.state.inputMessage}
                            multiline={true}
                            onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                        </TextInput>
                        <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                            onPress={this.sendMessageTask}>
                            <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                ENVOYER
                                    </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        flex: 1,
        backgroundColor: colorBg,
    },
    listView: {
        height: screenHeight,
        padding: 5,
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
    buttonContainer: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    text: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
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
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
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
    },
});

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo,
        userInfo: state.userInfo
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
        },
        fetchingPendingJobInfo: () => {
            dispatch(startFetchingJobProvider());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobProviderInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchProviderJobInfoError(error))
        },
        dispatchSelectedJobRequest: job => {
            dispatch(setSelectedJobRequest(job));
        },
        getAllWorkRequestPro: providerId => {
            getAllWorkRequestPro(providerId)
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withNavigation(ProAcceptRejectJobScreen));