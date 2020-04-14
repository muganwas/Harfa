import React, { Component } from 'react';
import { connect } from 'react-redux';
import {View, StyleSheet, Dimensions, TouchableOpacity, Image, Text, ScrollView, FlatList, TextInput,
    ActivityIndicator, BackHandler, StatusBar, Platform, Animated} from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import {createAppContainer,} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
//import { DrawerActions } from 'react-navigation-drawer';
import RNExitApp from 'react-native-exit-app';
import firebase from 'react-native-firebase';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import Notifications from './Notifications';
import Hamburger from './Hamburger';
import UserDetails from './UserDetails';
import ChatAfterBookingDetailsScreen from './ChatAfterBookingDetailsScreen';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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

class AllMessageScreen extends Component {

    constructor(props) {
      super(props)
    
      this.state = {
        isLoading: true,
        dataSource: [],
        isRecentMessage: false,
        query: "",
        fullData: [],
        isDataMatch: true,
        backClickCount: 0,
    };

    this.springValue = new Animated.Value(100);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentDidMount(){
        let dbRef = firebase.database().ref('recentMessage').child(UserDetails.User.userId);

        dbRef.once('value', (snapshot) => {
            const key = snapshot.key;
            const message = snapshot.val();
            
            if(message != null)
            {
                dbRef.on('child_added', (val) => {
        
                    let message = val.val();
                    let id = val.key;
                    console.log("componentDidMount Id : "+id);
                    console.log("componentDidMount Message : "+JSON.stringify(message));
        
                    this.setState({
                        isLoading: false,
                    });
        
                    this.setState((prevState) => {
                                        
                        return {
                            dataSource: [...prevState.dataSource, message],
                            fullData: [...prevState.fullData, message],
                            isLoading: false,
                            isRecentMessage: true,
                        }
                    })
                })
            }
            else{
                this.setState({
                    isLoading: false,
                    isRecentMessage: false,
                    isDataMatch: false,
                })
            }
        });   
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    componentDidUpdate(){
        console.log('data source')
        console.log(this.state.dataSource)
    }
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleBackButtonClick() {
        // this.props.navigation.navigate("DashBoard");
        // return true;
        if(Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
    }

    _spring() {
        this.setState({backClickCount: 1}, () => {
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
                this.setState({backClickCount: 0});
            });
        });
    }

    renderRecentMessageItem = ({ item }) => {
        return (
            <TouchableOpacity style={styles.itemMainContainer}
                onPress={() => this.props.navigation.navigate("ChatAfterBookingDetails", {
                    'providerId': item.id, 
                    'providerName': item.name,
                    'providerSurname': '',
                    'providerImage': item.image,
                    'orderId': item.orderId,
                    'serviceName': item.serviceName})}>
                <View style={styles.itemImageView}>
                    <Image style={{ width: 40, height: 40, borderRadius: 100 }}
                        source={item.image ? { uri: item.image } : require('../images/generic_avatar.png')} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'black', textAlignVertical: 'center' }}>
                        {item.name}
                    </Text>
                    <Text style={{width: screenWidth - 150, fontSize: 10, color: 'black',
                        textAlignVertical: 'center', color: 'gray', marginTop: 3,}}
                        numberOfLines={2}>
                        {item.textMessage}
                    </Text>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                    <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
                        {item.date}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    searchTask(textInput){

        let text = textInput.toLowerCase()
        let tracks = this.state.fullData
        let filterTracks = tracks.filter(item => {
        if(item.name.toLowerCase().match(text)) {
            this.setState({
            isDataMatch: true,
            })
          return item
        }
        else{
            // this.setState({
            //     isDataMatch: false,
            // })
        }
      })
      this.setState({ dataSource: filterTracks })
    }

    render() {
        return (
        <View style={styles.container}> 

                <StatusBarPlaceHolder/>

                <View style={styles.header}>
                    <Hamburger 
                        Notifications={Notifications}
                        navigation={this.props.navigation}
                        text='Tous les Messages'
                    />
                </View>

                <View style={{flexDirection: 'row', width: '100%', height: 55,  backgroundColor: colorYellow,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5}}>
                    <View style={{ flexDirection: 'row', width: screenWidth-40, height: 45, justifyContent: 'center', 
                        alignItems:'center', borderRadius: 5, backgroundColor: 'white', shadowColor: '#000', 
                        shadowOffset: { width: 0, height: 0 },shadowOpacity: 0.75,shadowRadius: 5,
                        elevation: 5,}}>
                        <Image style={{ width: 15, height: 15, marginLeft: 20 }}
                            source={require('../icons/search.png')}></Image>
                        <TextInput style={{
                            width: screenWidth - 60, height: 45, fontWeight: 'bold', marginLeft: 10}}
                            placeholder='Recherche ...'
                            onChangeText={(inputText) => this.searchTask(inputText)}>
                        </TextInput>
                    </View>
                </View>

                {this.state.dataSource.length != 0 && (
                    <ScrollView >
                        <View style={styles.listView}>
                            <FlatList
                                numColumns={1}
                                data={this.state.dataSource}
                                renderItem={this.renderRecentMessageItem}
                                keyExtractor={(item, index) => index.toString()}
                                showsVerticalScrollIndicator={false}
                                extraData={this.state} />
                        </View> 
                    </ScrollView>
                )}

                {this.state.dataSource.length == 0  && !this.state.isLoading && (
                    <View style={styles.noDataStyle}>
                        <Text style={{ color: 'black', fontSize: 20, }}>
                            Aucune correspondance de données!
                        </Text>
                    </View>
                )}

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Appuyez à nouveau pour quitter l'application</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Sortie</Text>
                    </TouchableOpacity>
                </Animated.View>

                {this.state.isLoading && (
                    <View style={styles.loaderStyle}>
                        <ActivityIndicator
                            style={{ height: 80 }}
                            color="#C00"
                            size="large" />
                    </View>
                )}
        </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo
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

const AppStackNavigator = createStackNavigator({
    AllMessage: {
        screen: connect(mapStateToProps, mapDispatchToProps)(AllMessageScreen),
        navigationOptions:{
            header : null
        }
    },
    ChatAfterBookingDetails : {
        screen: ChatAfterBookingDetailsScreen,
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
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    itemMainContainer: {
        width: screenWidth,
        flex: 1,
        height: 70,
        flexDirection: 'row',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        padding: 5,
    },
    itemImageView: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 5,
    },
    noDataStyle: {
        height: screenHeight-105,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center'
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
    header: {
        flexDirection: 'row', 
        width: '100%', 
        height: 50, 
        backgroundColor: colorPrimary,
        paddingLeft: 10, 
        paddingRight: 20, 
        paddingBottom: 5
    }
});