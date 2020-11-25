import React, { Component } from 'react';
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Dimensions,
    BackHandler, StatusBar, Platform, Modal, ScrollView
} from 'react-native';
import { connect } from 'react-redux';
import database from '@react-native-firebase/database';
import WaitingDialog from './WaitingDialog';
import Toast from 'react-native-simple-toast';
import Config from './Config';
import { getDistance } from '../misc/helpers';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingJobProvider, fetchedJobProviderInfo, fetchProviderJobInfoError, setSelectedJobRequest } from '../Redux/Actions/jobsActions';
import { colorPrimary, black, colorBg, colorYellow, white, themeRed } from '../Constants/colors';
//import SoundPlayer from 'react-native-sound';
import { cloneDeep } from 'lodash';

const screenWidth = Dimensions.get('window').width;

const USER_GET_PROFILE = Config.baseURL + "users/"
const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: white
            }}>
                <StatusBar
                    barStyle="dark-content" />
            </View>
            :
            <StatusBar barStyle='dark-content' backgroundColor={white} />
    );
}

class ProChatAcceptScreen extends Component {

    constructor(props) {
        super();
        const { navigation } = props;
        this.state = {
            userId: '',
            userName: '',
            userImage: '',
            userMobile: '',
            userDob: '',
            userAddress: '',
            userLat: '',
            userLang: '',
            userFcmId: '',
            distance: 'unavailable',
            isLoading: true,
            isErrorToast: false,
            timer: null,
            serviceName: navigation.state.params.serviceName,
            orderId: navigation.state.params.orderId,
            mainId: navigation.state.params.mainId,
            delivery_address: navigation.state.params.delivery_address,
            delivery_lat: navigation.state.params.delivery_lat,
            delivery_lang: navigation.state.params.delivery_lang,
            secondTimeLoader: ''
        }
    };

    //get UserData
    componentDidMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        const userId = navigation.state.params.userId;
        fetch(USER_GET_PROFILE + userId, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.result) {
                    const id = responseJson.data.id;
                    this.setState({
                        userId: responseJson.data.id,
                        userName: responseJson.data.username,
                        userImage: responseJson.data.image,
                        userMobile: responseJson.data.mobile,
                        userDob: responseJson.data.dob,
                        userAddress: responseJson.data.address,
                        userLat: responseJson.data.lat,
                        userLang: responseJson.data.lang,
                        userFcmId: responseJson.data.fcm_id,
                        isLoading: false,
                        secondTimeLoader: "1"
                    });
                    database().ref(`liveLocation/${responseJson.data.id}`).once('value', result => {
                        const { latitude, longitude } = result.val();
                        const fullDist = getDistance(latitude, longitude, responseJson.data.lat, responseJson.data.lang, 'K');
                        const distance = parseFloat(fullDist).toFixed(1);
                        this.setState({ distance });
                    }).
                        catch(e => {
                            console.log(e.message);
                        });
                }
                else {
                    this.setState({
                        isErrorToast: true,
                    });
                    this.showToast("Quelque chose a mal tourné")
                }
            })
            .catch((error) => {
                this.setState({
                    isLoading: false
                })
                alert("Error " + error);
                console.log(JSON.stringify(responseJson));
            });
    }

    handleBackButtonClick = () => {
        this.props.navigation.navigate("ProDashboard");
        return true;
    }

    acceptJob = () => {
        const { userInfo: { providerDetails } } = this.props;
        const { userId, orderId } = this.state;
        this.setState({
            isLoading: true,
        });

        const data = {
            main_id: this.props.navigation.state.params.mainId,
            chat_status: '1',
            status: 'Pending',
            'notification': {
                "fcm_id": this.state.userFcmId,
                "title": "Chat Request Accepted",
                "type": "ChatAcceptance",
                "notification_by": "Employee",
                "save_notification": true,
                "user_id": userId,
                "employee_id": providerDetails.providerId,
                "order_id": orderId,
                "body": 'Chat request has been accepted by ' + providerDetails.name + ' Request Id : ' + orderId,
                "data": {
                    user_id: '',
                    providerId: providerDetails.providerId,
                    ProviderData: providerDetails,
                    serviceName: this.state.serviceName,
                    orderId: this.props.navigation.state.params.orderId,
                    mainId: this.props.navigation.state.params.mainId,
                    chat_status: '1',
                    status: 'Pending',
                    delivery_address: this.props.navigation.state.params.delivery_address,
                    delivery_lat: this.props.navigation.state.params.delivery_lat,
                    delivery_lang: this.props.navigation.state.params.delivery_lang,
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
            .then(response => response.json())
            .then(responseJson => {
                const { jobsInfo: { jobRequestsProviders }, fetchedPendingJobInfo, dispatchSelectedJobRequest, navigation } = this.props;
                let newProJobsInfo = cloneDeep(jobRequestsProviders);
                let newJobsInfoLength = newProJobsInfo.length;
                if (responseJson.result) {
                    this.setState({
                        isLoading: false
                    })
                    var jobData = {
                        id: responseJson.data.id,
                        order_id: this.state.orderId,
                        user_id: this.state.userId,
                        image: this.state.userImage,
                        fcm_id: this.state.userFcmId,
                        name: this.state.userName,
                        mobile: this.state.userMobile,
                        dob: this.state.userDob,
                        address: this.state.userAddress,
                        lat: this.state.userLat,
                        lang: this.state.userLang,
                        service_name: this.state.serviceName,
                        chat_status: "1",
                        status: "Pending",
                        delivery_address: this.state.delivery_address,
                        delivery_lat: this.state.delivery_lat,
                        delivery_lang: this.state.delivery_lang,
                    }

                    newProJobsInfo.push(jobData)
                    dispatchSelectedJobRequest(jobData);
                    fetchedPendingJobInfo(newProJobsInfo);
                    //used + 1 before and it didnt work
                    navigation.navigate("ProAcceptRejectJob", {currentPos: newJobsInfoLength });
                }
                else {
                    this.setState({
                        timer: null,
                        requestStatus: 'No Response',
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Quelque chose a mal tourné")

                }
            })
            .catch((error) => {
                console.log("accept job error " + error);
                this.setState({
                    timer: null,
                    requestStatus: 'No Response',
                    isLoading: false,
                });
            })
    }

    rejectJob = () => {
        const { userInfo: { providerDetails } } = this.props;
        const { orderId, userId } = this.state;
        const data = {
            main_id: this.props.navigation.state.params.mainId,
            chat_status: '0',
            status: 'Rejected',
            'notification': {
                "fcm_id": this.state.userFcmId,
                "title": "Chat Request Rejected",
                "type": "JobRejection",
                "notification_by": "Employee",
                "save_notification": true,
                "user_id": userId,
                "employee_id": providerDetails.providerId,
                "order_id": orderId,
                "body": 'Your request has been rejected by ' + providerDetails.name + ' Request Id : ' + this.props.navigation.state.params.orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    serviceName: this.state.serviceName,
                    orderId: this.props.navigation.state.params.orderId,
                    mainId: this.props.navigation.state.params.mainId,
                },
            }
        }

        this.setState({
            isLoading: true,
        });

        fetch(REJECT_ACCEPT_REQUEST, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.result) {
                    this.setState({
                        isLoading: false
                    })
                }
                else {
                    this.setState({
                        timer: null,
                        requestStatus: 'No Response',
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Quelque chose a mal tourné")
                }
                this.getBackFromProAcceptRejectJob()
            })
            .catch(error => {
                console.log('reject error', error)
                this.setState({
                    timer: null,
                    requestStatus: 'No Response',
                    isLoading: false,
                });
            });
    }

    rejectedAfterNoResponse = () => {
        const { userInfo: { providerDetails } } = this.props;
        const { userId, orderId } = this.state;
        const data = {
            main_id: this.props.navigation.state.params.mainId,
            chat_status: '0',
            status: 'No Response',
            'notification': {
                "fcm_id": this.state.userFcmId,
                "title": "No Response",
                "save_notification": true,
                "user_id": userId,
                "employee_id": providerDetails.providerId,
                "order_id": orderId,
                "notification_by": 'Employee',
                "body": providerDetails.name + " is not responding to your request" + ' Request Id : ' + orderId,
                "data": {
                    ProviderId: providerDetails.providerId,
                    serviceName: this.state.serviceName,
                    orderId: this.props.navigation.state.params.orderId,
                    mainId: this.props.navigation.state.params.mainId,
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
                if (responseJson.result) {
                    this.setState({
                        isLoading: false
                    })
                }
                else {
                    this.setState({
                        timer: null,
                        requestStatus: 'No Response',
                        isLoading: false,
                        isErrorToast: true
                    });
                    this.showToast("Quelque chose a mal tourné")
                }
                this.getBackFromProAcceptRejectJob();
            })
            .catch((error) => {
                console.log("Error >>> " + error);
                this.setState({
                    timer: null,
                    requestStatus: 'No Response',
                    isLoading: false,
                });
            });
    }

    getBackFromProAcceptRejectJob = () => {
        this.props.navigation.goBack();
    }

    showToast = message => {
        Toast.show(message, Toast.LONG);
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { userInfo: { providerDetails } } = this.props;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        backgroundColor: colorPrimary,
                        paddingLeft: 10,
                        paddingRight: 20,
                        alignItems: 'center',
                        paddingVertical: 10
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={{ width: 35, justifyContent: 'center' }}
                                onPress={this.handleBackButtonClick}>
                                <Image style={{ width: 20, height: 20, tintColor: black }}
                                    resizeMode={'contain'}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>
                            <Text style={{ color: black, fontSize: 20, fontWeight: 'bold', marginLeft: 10 }}>
                                Request
                        </Text>
                        </View>
                    </View>
                <ScrollView>
                    {!this.state.isLoading && this.state.secondTimeLoader != "" &&
                        <View style={styles.headerLayoutStyle}>
                            <View style={styles.mainContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 20, }}>
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>Hello,</Text>
                                    <Text style={{ color: 'black', fontSize: 16, marginLeft: 5 }}>{providerDetails.name + " " + providerDetails.surname}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 15 }}>
                                    <Image style={{ width: 80, height: 80, borderRadius: 100, }}
                                        source={{ uri: this.state.userImage }}>
                                    </Image>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 15, }}>
                                    <Text style={{ color: 'black', fontSize: 16, marginLeft: 5 }} numberOfLines={2}>
                                        {this.state.userName + " is looking for a " + this.state.serviceName}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 50 }}>

                                    <TouchableOpacity style={styles.buttonContainer}
                                        onPress={this.rejectJob}>
                                        <Text style={styles.text}>Busy</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.buttonContainer}
                                        onPress={this.acceptJob}>
                                        <Text style={styles.text}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.slidingPanelLayoutStyle}>
                                <View style={styles.containerSlide}>
                                    <View style={styles.mainContainerSlide}>

                                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 15, color: white }}>{this.state.userName}</Text>

                                        <Text style={{ fontSize: 14, alignItems: 'center', textAlign: 'center', marginTop: 5, color: white }}>{this.state.userAddress}</Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                            <Image style={{ width: 15, height: 15, tintColor: white }}
                                                source={require('../icons/mobile.png')} />
                                            <Text style={{ fontSize: 14, marginLeft: 10, color:white }}>{this.state.userMobile}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                                            <Image style={{ width: 15, height: 15, tintColor: white }}
                                                source={require('../icons/maps_location.png')} />
                                            <Text style={{ fontSize: 14, marginLeft: 10, color: white }}>{`${this.state.distance} Kms from you`}</Text>
                                        </View>

                                    </View>

                                </View>
                            </View>
                        </View>
                    }

                    {false && <View style={styles.mainContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 20 }}>
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 25 }}>{this.state.timer}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 20 }}>
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 18 }}>Hi,</Text>
                            <Text style={{ color: 'black', fontSize: 16, marginLeft: 5 }}>{providerDetails.name + " " + providerDetails.surname}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 15 }}>
                            <Image style={{ width: 80, height: 80, borderRadius: 100, }}
                                source={{ uri: this.state.userImage }}>
                            </Image>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 15 }}>
                            <Text style={{ color: 'black', fontSize: 16, marginLeft: 5 }} numberOfLines={2}>
                                {this.state.userName + " veux te parler!"}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 50 }}>

                            <TouchableOpacity style={styles.buttonContainer}
                                onPress={this.acceptJob}>
                                <Text style={styles.text}>Accepter le chat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    }

                    <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                        onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                        <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                    </Modal>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    mainContainer: {
        width: screenWidth,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
    },
    buttonContainer: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: themeRed,
        borderWidth: 2,
        marginBottom: 25,
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
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    timerView: {
        flex: 1,
        width: '100%',
        height: 65,
        textAlignVertical: 'center',
        color: 'white',
        alignContent: 'center',
        justifyContent: 'center',
    },
    timerText: {
        width: 40,
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'center',
        fontWeight: 'bold',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 8,
        paddingBottom: 8,
        color: 'black',
        borderRadius: 100,
        marginRight: 20,
    },
    headerLayoutStyle: {
        width: screenWidth,
        backgroundColor: 'orange',
        justifyContent: 'center',
        alignItems: 'center',
    },
    slidingPanelLayoutStyle: {
        width: screenWidth,
        height: 400,
        backgroundColor: colorYellow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commonTextStyle: {
        color: 'white',
        fontSize: 18,
    },
    containerSlide: {
        flex: 1,
        width: screenWidth,
        height: 400,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: colorBg,
    },
    mainContainerSlide: {
        width: screenWidth,
        height: 400,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: themeRed,
        borderRadius: 2,

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
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProChatAcceptScreen);