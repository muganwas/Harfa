import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import {View, StyleSheet, TouchableOpacity, Image, Text,Dimensions, FlatList, 
    ActivityIndicator, StatusBar, Platform, Animated, BackHandler} from 'react-native';
import RNExitApp from 'react-native-exit-app';
//import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
//import { DrawerActions } from 'react-navigation-drawer';
//import Config from './Config';
import Notifications from './Notifications';
import Hamburger from './ProHamburger';

//const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' 
const screenWidth = Dimensions.get('window').width;

//const NOTIFICATION_URL = Config.baseURL+"";

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

class ProNotificationsScreen extends Component {

    constructor(props) {
      super();
      this.state = {
         isLoading: true,
         isNoData: true,
         dataSource: [],
         backClickCount: 0
      };
      this.springValue = new Animated.Value(100);
    };

    componentDidMount() {
        const { fetchedNotifications } = this.props;
        fetchedNotifications({type: 'generic', value: 0});
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick.bind(this));
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

    //GridView Items
    renderItem = ({ item }) => {

        return (
            <View style={{
                flex: 1, flexDirection: 'row', margin: 5, padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.75,
                shadowRadius: 5,
                elevation: 5,
                backgroundColor: 'white',
                borderRadius: 2,
                alignItems: 'center',
                justifyContent: 'center' }}>
                <Image style={{ width: 45, height: 45, borderRadius: 100 }}
                    source={{ uri: item.employee_details.image }} />
                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', marginLeft: 10 }}>
                    <Text style={{ color: 'black', fontSize: 14, marginTop: 5, alignSelf:'center' }}>
                        {item.title}
                    </Text>
                    <Text style={{ fontWeight: 'bold', color: colorGray, fontSize: 10, marginTop: 5, }}>
                        {item.date}
                    </Text>
                </View>  
            </View>
        )
    }
    
  render() {
    return (

      <View style={styles.container}>

       <StatusBarPlaceHolder/>

        <View style={styles.header} >
            <Hamburger
                Notifications={Notifications}
                navigation={this.props.navigation}
                text='Notifications'
            />
            </View>
                {!this.state.isLoading && !this.state.isNoData &&
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
                    <View style={{flex: 1, flexDirection: 'column', backgroundColor: colorBg, justifyContent: 'center', alignItems: 'center'}}>
                        <View style={{width: 100, height: 100, borderRadius: 100, backgroundColor: colorYellow,     justifyContent: 'center', alignItems: 'center'}}>
                            <Image style={{width: 50, height: 50}}
                                source={require('../icons/ic_notification.png')}/>
                        </View>
                        <Text style={{fontSize: 18, marginTop: 10}}>Notifications Not Found</Text>     

                    </View>
                }

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
});

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

export default connect(mapStateToProps, mapDispatchToProps)(ProNotificationsScreen)