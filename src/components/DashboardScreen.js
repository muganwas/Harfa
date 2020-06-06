
import React, { Component } from 'react';
import {
    Text, StyleSheet, View, Image, FlatList,
    TouchableOpacity, StatusBar, Dimensions,
    Animated, BackHandler, Alert, Modal, Platform
} from 'react-native';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { createAppContainer, } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
//import { DrawerActions } from 'react-navigation-drawer';
import RNExitApp from 'react-native-exit-app';
import firebase from 'react-native-firebase';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import WaitingDialog from './WaitingDialog';

import Config from './Config';
import UserDetails from './UserDetails';
import OnlineUsers from './OnlineUsers';
import NetInfo from "@react-native-community/netinfo";
import ListOfProviderScreen from './ListOfProviderScreen';
import ProviderDetailsScreen from './ProviderDetailsScreen';
import ChatScreen from './ChatScreen';
import MapDirectionScreen from './MapDirectionScreen';
import AddAddressScreen from './AddAddressScreen';
import SelectAddressScreen from './SelectAddressScreen';
import PendingJobRequest from './PendingJobRequest';
import Hamburger from './Hamburger';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError, setSelectedJobRequest, updateActiveRequest } from '../Redux/Actions/jobsActions';
import { imageExists } from '../misc/helpers';
//import {Notifications} from 'react-native-notifications';

const socket = Config.socket;

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
//const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';

const screenWidth = Dimensions.get('window').width;
const SERVICES_URL = Config.baseURL + 'service/getall'

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

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

class DashBoardScreen extends Component {

    constructor() {
        super()

        this.state = {
            dataSource: [],
            isLoading: true,
            backClickCount: 0,
            isToastShow: false,
            online: false,
            connectivityAvailable: false,
            availabilityChecked: false,
            availabilityObj: {}
        }
        this.springValue = new Animated.Value(100);
    }

    buttonType = buttonType1 => {
        this.setState({ buttonType: buttonType1 });
    }

    //Get All Services
    componentDidMount() {
        NetInfo.addEventListener(status => {
            if (!status.isConnected) this.setState({ connectivityAvailable: false });
            else this.setState({ connectivityAvailable: true });
        });
        NetInfo.fetch().then(status => {
            if (!status.isConnected) this.setState({ connectivityAvailable: false });
            else this.setState({ connectivityAvailable: true });
        });
        socket.on('connect', () => {
            const userId = UserDetails.User.userId;
            if (userId) {
                socket.emit('connected', userId);
                this.setState({ online: true });
            }
        });
        socket.on('user-disconnected', users => {
            OnlineUsers.Users = users;
        })
        socket.on('user-joined', users => {
            OnlineUsers.Users = users;
        })
        socket.on('disconnect', info => {
            this.setState({ online: false });
            if (!this.state.online && this.state.connectivityAvailable) socket.open();
        });
        socket.open();
        this.onRefresh();
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton.bind(this));
    }

    async componentWillMount() {
        firebase.notifications().onNotification(notification => {
            const { fetchedNotifications, notificationsInfo, fetchedPendingJobInfo, jobsInfo: { jobRequests } } = this.props;
            const currentGenericCount = notificationsInfo.generic;
            const newGenericCount = currentGenericCount + 1;
            let newJobRequests = [...jobRequests];

            fetchedNotifications({ type: 'generic', value: newGenericCount });
            const { title, body, data } = notification;

            const orderId = data.orderId;
            let pos = 0;

            Object.keys(jobRequests).map(key => {
                const currOrderId = jobRequests[key].order_Id;
                if (orderId === currOrderId) pos = key;
            });

            if (title == "Chat Request Accepted" && pos != null) {
                this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                    isToastShow: true,
                })
                var providerData = JSON.parse(data.ProviderData);

                var pendingJobData = {
                    id: data.mainId,
                    order_id: data.orderId,
                    employee_id: providerData.ProviderId,
                    image: providerData.imageSource,
                    fcm_id: providerData.fcmId,
                    name: providerData.name,
                    surName: providerData.surname,
                    mobile: providerData.mobile,
                    description: providerData.description,
                    address: providerData.address,
                    lat: providerData.lat,
                    lang: providerData.lang,
                    service_name: data.serviceName,
                    chat_status: data.chat_status,
                    status: data.status,
                    delivery_address: data.delivery_address,
                    delivery_lat: data.delivery_lat,
                    delivery_lang: data.delivery_lang,
                }
                imageExists(providerData.imageSource).then(res => {
                    pendingJobData.imageAvailable = res;
                });
                newJobRequests[pos] = pendingJobData;
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Demande de chat acceptée");
                this.props.updateActiveRequest(false);
                this.props.navigation.goBack();
            }
            else if (title == "Chat Request Rejected") {
                this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                    isJobAccepted: false,
                })
                this.showRejectionAlert("DEMANDE DE CHAT REJETÉE", "Le fournisseur de services a rejeté votre demande. Veuillez réessayer plus tard")
            }
            else if ((title == "No Response" || title == "Canceled") && pos != null) {
                this.setState({
                    requestStatus: title,
                    title: title,
                    body: body,
                    data: data,
                })
                delete newJobRequests[pos];
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("Pas de réponse", "Le fournisseur de services n'a pas répondu à votre demande. Veuillez réessayer plus tard")
            }
            else if (title == "Job Accepted" && pos != null) {
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
                newJobRequests[pos] = pendingJobData;
                fetchedPendingJobInfo(newJobRequests);

                this.showRejectionAlert("EMPLOI ACCEPTÉ", "Votre travail a été accepté.")
            }
            else if (title == "Job Rejected" && pos != null) {
                this.setState({
                    isJobAccepted: false
                })
                delete newJobRequests[pos];
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("EMPLOI REJETÉ", "Votre travail a été rejeté. Veuillez réessayer plus tard")
            }
            else if (title == "Job Completed" && pos != null) {
                delete newJobRequests[pos];
                fetchedPendingJobInfo(newJobRequests);
                this.showRejectionAlert("TRAVAIL TERMINE", "Votre travail est terminé.")
            }
        });
    }

    componentWillUnmount() {
        Config.socket.close();
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton.bind(this));
        firebase.database().ref('chatting').child(senderId).child(receiverId)
            .off('child_changed');
        firebase.database().ref('adminChatting').child(senderId).child(receiverId)
            .off('child_changed');
    }

    showRejectionAlert(title, message) {
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
                    text: "D'accord",
                    onPress: () => {
                        this.props.updateActiveRequest(false);
                        this.onRefresh()
                    }
                },
            ]
        );
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

    handleBackButton = () => {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
        return true
    };

    //GridView Items
    renderItem = ({ item }) => {
        if (item)
            return (
                <TouchableOpacity style={{
                    flex: 1, flexDirection: 'column', margin: 5, padding: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.75,
                    shadowRadius: 5,
                    elevation: 5,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                    onPress={() => {
                        this.props.navigation.navigate("ListOfProvider", {
                            'serviceName': item.service_name,
                            'serviceId': item.id
                        })
                    }}>
                    <Image style={{ width: 30, height: 30, margin: 10, zIndex: 1000 }}
                        source={{ uri: item.image }} />
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 5, alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', color: 'black', fontSize: 12, marginTop: 5, alignSelf: 'center' }}>
                            {item.service_name}
                        </Text>
                    </View>
                </TouchableOpacity>
            )
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 1, width: '100%', backgroundColor: 'black' }}>
            </View>
        );
    }

    onRefresh() {
        fetch(SERVICES_URL).
            then((response) => response.json()).
            then(responseJson => {
                this.setState({
                    dataSource: responseJson.data,  //data is key
                    isLoading: false
                })
            }).
            catch(error => {
                console.log(error);
                this.setState({
                    isLoading: false
                })
                this.showToast("Une erreur s'est produite, vérifiez votre connexion Internet");
            });
        return true;
    }

    goToNextPage = (chat_status, jobInfo) => {
        const { dispatchSelectedJobRequest } = this.props;
        if (chat_status == '0') {
            //ToastAndroid.show("Your chat request not accepted. Please wait...", ToastAndroid.LONG);
            this.showToast("Votre demande de chat n'est pas acceptée. S'il vous plaît, attendez...")
        }
        else {
            dispatchSelectedJobRequest(jobInfo);
            this.props.navigation.navigate("MapDirection", {
                titlePage: "Dashboard"
            });
        }
    }

    showToast = message => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    renderPendingJobRequests = ({ item }) => {
        if (item) {
            const { image, name, employee_id, imageAvailable, surName, service_name, chat_status, status } = item;
            return (
                <TouchableOpacity style={styles.pendingJobRow}
                    onPress={() => this.goToNextPage(chat_status, { userType: 'client', employee_id })}>
                    <LinearGradient
                        style={styles.pendingJobRow}
                        colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                        <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, borderRadius: 200, }}
                            source={imageAvailable ? { uri: image } : require('../images/generic_avatar.png')} />
                        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center' }}>
                                {name + " " + surName}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                                {service_name}
                            </Text>
                            <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                {chat_status == "0" ? "Nouvelle demande d'emploi"
                                    : status == "Pending" ? "Demande de chat acceptée"
                                        : "Travail accepté"}
                            </Text>
                        </View>
                        <View style={styles.arrowView}>
                            <Image style={styles.arrow}
                                source={require('../icons/arrow_right_animated.gif')} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            )
        }
    }

    render() {
        const { jobsInfo: { jobRequests, requestsFetched } } = this.props;
        return (
            <View style={styles.container}>
                {/* <StatusBar barStyle='light-content' backgroundColor='#C5940E' />   */}
                <StatusBarPlaceHolder />
                <View style={styles.header}>
                    <Hamburger
                        navigation={this.props.navigation}
                        text='Harfa'
                    />
                    <TouchableOpacity style={{ width: '100%', justifyContent: 'center', alignContent: 'center' }}
                        onPress={() => this.props.navigation.navigate("AddAddress")}>
                        <Image style={{ width: 22, height: 22, alignSelf: 'center', marginLeft: 45 }}
                            source={require('../icons/maps_location.png')} />
                    </TouchableOpacity>
                </View>

                <View style={{ width: screenWidth, height: 1, backgroundColor: '#C5940E' }}></View>

                <View style={{
                    flexDirection: 'row', width: '100%', height: 45, backgroundColor: colorPrimary,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5, shadowColor: '#000',
                    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,
                }}>
                    <View style={{
                        flex: 1, alignItems: "center", justifyContent: 'center'
                    }}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', }}>
                            Prestations de service
                        </Text>
                    </View>
                </View>

                <View style={[styles.gridView, { marginBottom: PendingJobRequest.Request.order_id == '' ? 0 : 75 }]}>
                    <FlatList
                        keyboardShouldPersistTaps={'handled'}
                        numColumns={3}
                        data={this.state.dataSource}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => index}
                        showsVerticalScrollIndicator={false}
                        onRefresh={this.onRefresh}
                        refreshing={this.state.isLoading}
                    // ItemSeparatorComponent={this.renderSeparator}
                    />
                </View>
                {/** show pending requests */}
                {requestsFetched && jobRequests.length > 0 ?
                    <View style={styles.pendingJobsContainer}>
                        <FlatList
                            keyboardShouldPersistTaps={'handled'}
                            numColumns={1}
                            data={jobRequests}
                            renderItem={this.renderPendingJobRequests}
                            keyExtractor={(item, index) => index}
                            showsVerticalScrollIndicator={false}
                        // ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View> : null}

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Appuyez à nouveau pour quitter l'application</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Sortie</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo
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
            dispatch(startFetchingJobCustomer());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobCustomerInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchCustomerJobInfoError(error))
        },
        dispatchSelectedJobRequest: job => {
            dispatch(setSelectedJobRequest(job));
        },
        updateActiveRequest: val => {
          dispatch(updateActiveRequest(val));
        }
    }
}

const AppStackNavigator = createStackNavigator({
    DashBoard: {
        screen: connect(mapStateToProps, mapDispatchToProps)(DashBoardScreen),
        navigationOptions: {
            header: null
        }
    },
    ListOfProvider: {
        screen: ListOfProviderScreen,
        navigationOptions: {
            header: null
        }
    },
    ProviderDetails: {
        screen: ProviderDetailsScreen,
        navigationOptions: {
            header: null
        }
    },
    Chat: {
        screen: ChatScreen,
        navigationOptions: {
            header: null
        }
    },
    MapDirection: {
        screen: MapDirectionScreen,
        navigationOptions: {
            header: null
        }
    },
    AddAddress: {
        screen: AddAddressScreen,
        navigationOptions: {
            header: null
        }
    },
    SelectAddress: {
        screen: SelectAddressScreen,
        navigationOptions: {
            header: null
        }
    }
});

const XYZ = createAppContainer(AppStackNavigator);
export default XYZ;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    header: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    touchableHighlight: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 15,
    },
    textHeader: {
        height: 50,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlignVertical: 'center',
    },
    text: {
        fontSize: 26,
        color: 'purple',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textView: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    open: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuIcon: {
        width: 22,
        height: 22,
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
    pendingJobStyle: {
        flex: 1,
        width: screenWidth,
        height: 75,
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    pendingJobsContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: screenWidth,
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    pendingJobRow: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        height: 75,
    },
    linearGradient: {
        flex: 1,
        paddingLeft: 15,
        paddingRight: 15,
        borderRadius: 5
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Gill Sans',
        textAlign: 'center',
        margin: 10,
        color: '#ffffff',
        backgroundColor: 'transparent',
    },
    arrowView: {
        flex: 1,
        height: 75,
        color: 'white',
        alignContent: 'center',
        justifyContent: 'center',
    },
    arrow: {
        width: 35,
        height: 35,
        alignSelf: 'flex-end',
        marginRight: 30,
    },
});