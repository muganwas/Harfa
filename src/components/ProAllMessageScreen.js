import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text, ScrollView, FlatList, TextInput,
    ActivityIndicator, BackHandler, StatusBar, Platform, Animated} from 'react-native';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import firebase from 'react-native-firebase';
import {createAppContainer,} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import ProChatAfterBookingDetailsScreen from './ProChatAfterBookingDetailsScreen';
import ProviderDetails from './ProviderDetails';
import ProChatScreen from './ProChatScreen';
import Notifications from './Notifications';
import Hamburger from './ProHamburger';
import {imageExists} from '../misc/helpers';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0'

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

class ProAllMessageScreen extends Component {

    constructor(props) {
        super(props)

        this.state = {
            isLoading: false,
            dataSource: [],
            isRecentMessage: false,
            query: "",
            fullData: [],
            isDataMatch: true,
            backClickCount: 0,
        };
        this.springValue = new Animated.Value(100);
    };

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick.bind(this));
        let dbRef = firebase.database().ref('recentMessage').child(ProviderDetails.Provider.providerId);
        dbRef.once('value', (snapshot) => {
            const key = snapshot.key;
            const message = snapshot.val();

            if (message != null) {
                dbRef.on('child_added', val => {
                    let message = val.val();
                    let id = val.key;
                    console.log("ProAllMessageScreen Id : " + id);
                    console.log("ProAllMessageScreen Message : " + JSON.stringify(message));

                    this.setState({
                        isLoading: false,
                    });

                    this.setState((prevState) => {
                        return {
                            dataSource: [...prevState.dataSource, message],
                            fullData: [...prevState.dataSource, message],
                            isLoading: false,
                            isRecentMessage: true,
                        }
                    });
                })
            }
            else {
                this.setState({
                    isLoading: false,
                    isRecentMessage: false,
                    isDataMatch: false,
                })
            }
        })
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick.bind(this));
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

    renderRecentMessageItem = ({ item }) => {
        return (
            <TouchableOpacity style={styles.itemMainContainer}
                onPress={() => this.props.navigation.navigate("ProChatAfterBookingDetails", {
                    'receiverId': item.id,
                    'receiverName': item.name,
                    'receiverImage': item.image,
                    'orderId': item.orderId,
                    'serviceName': item.serviceName,
                    'pageTitle': "ProAllMessage"
                })}>
                <View style={styles.itemImageView}>
                    <Image style={{ width: 40, height: 40, borderRadius: 100 }}
                        source={{ uri: item.image }} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: 'black', textAlignVertical: 'center' }}>
                        {item.name}
                    </Text>
                    <Text style={{
                        width: screenWidth - 150, fontSize: 10, color: 'black',
                        textAlignVertical: 'center', color: 'gray', marginTop: 3,
                    }}
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

        console.log("Pro Message Search >> "+textInput);

        let text = textInput.toLowerCase()
        let tracks = this.state.fullData
        let filterTracks = tracks.filter(item => {

            console.log("Pro >> "+text+" == "+item.name.toLowerCase());
        if(item.name.toLowerCase().match(text)) {
            console.log("Pro Message Search >> "+text+" == "+item.name.toLowerCase());
            this.setState({
            isDataMatch: true,
            })
          return item
        }
        else{
            console.log("False")
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

                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5 }}>
                    <Hamburger
                        Notifications={Notifications}
                        navigation={this.props.navigation}
                        text='Tous les messages' 
                    />
                </View>
                <View style={{
                    flexDirection: 'row', width: '100%', height: 55, backgroundColor: colorYellow,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5}}>
                    <View style={{
                        flexDirection: 'row', width: screenWidth - 40, height: 45, justifyContent: 'center',
                        alignItems: 'center', borderRadius: 5, backgroundColor: 'white', shadowColor: '#000',
                        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5,elevation: 5, }}>
                        <Image style={{ width: 15, height: 15, marginLeft: 20 }}
                            source={require('../icons/search.png')}/>
                        <TextInput style={{width: screenWidth - 60, height: 45, fontWeight: 'bold', marginLeft: 10}}
                            placeholder='Chercher...'
                            onChangeText={(inputText) => this.searchTask(inputText)}>
                        </TextInput>
                    </View>
                </View>

                <ScrollView>
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

                {this.state.dataSource.length == 0 && !this.state.isLoading && (
                    <View style={styles.noDataStyle}>
                        <Text style={{ color: 'black', fontSize: 20 }}>
                            Aucune correspondance de données!
                        </Text>
                    </View>
                 )}

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Press back again to exit the app</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Exit</Text>
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

const AppStackNavigator = createStackNavigator({
    ProAllMessage: {
        screen: ProAllMessageScreen,
        navigationOptions:{
            header : null
        }
    },
    ProChat: {
        screen: ProChatScreen,
        navigationOptions:{
            header : null
        }
    }, 
    ProChatAfterBookingDetails: {
        screen: ProChatAfterBookingDetailsScreen,
        navigationOptions: {
            header: null
        }
    },
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
    }
});