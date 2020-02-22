import React, { Component } from 'react';
import {View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, ScrollView, StatusBar, Platform,
     BackHandler, Animated} from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import RNExitApp from 'react-native-exit-app';

const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
const colorGray = '#C0C0C0' ;

const screenWidth = Dimensions.get('window').width;

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

export default class AboutUsScreen extends Component{

    constructor(props) {
      super(props)
    
      this.state = {
        backClickCount: 0,
    };
    this.springValue = new Animated.Value(100);
    };
    
    componentDidMount() {
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

    render(){
        return(
            <View style={styles.container}>

                <StatusBarPlaceHolder/>
                
                <View style={{flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                     paddingLeft: 10, paddingRight: 20, paddingBottom: 5}}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={{ width: 35, height: 35, justifyContent: 'center', }}
                            onPress={() => this.props.navigation.dispatch(DrawerActions.openDrawer())}>
                            <Image style={{ width: 25, height: 25, alignSelf: 'center' }}
                                source={require('../icons/humberger.png')} />
                        </TouchableOpacity>

                        <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 5 }}>
                            À propos de nous
                        </Text>
                    </View>
                </View>

                <ScrollView>
                    <View style={styles.mainContainer}>
                        <Image style={{width: screenWidth-20, height: 200,}}
                            source={{uri: 'https://cdn.pixabay.com/photo/2014/08/15/06/16/imprint-418594_960_720.jpg'}}/>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10, marginTop: 10}}>au sujet de Harfa</Text>        
                        <View style={{width:screenWidth-20, height:1, backgroundColor: colorGray, marginTop: 10}}/>

                        <View style={{ flexDirection: 'row', padding: 10, }}>
                            <Text style={{fontSize: 18, }}>It is not a legend, it is sometimes difficult to find a good plumber, electrician or mason available to do work at your place. We created this application to remove this problem from everyday life. Harfa is an application created to help people find the best Craftsman or Handyman for their masonry, plumbing, carpentry, cleaning, etc.</Text>        
                        </View>
                
                    </View>
                </ScrollView>

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Appuyez à nouveau pour quitter l'application</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Sortie</Text>
                    </TouchableOpacity>
                </Animated.View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg ,
    },
    mainContainer: {
        backgroundColor: 'white',
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
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