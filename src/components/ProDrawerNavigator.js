
import React , { Component } from 'react';
import {createAppContainer} from 'react-navigation';
import {createDrawerNavigator } from 'react-navigation-drawer';
import ProCustomMenuLayout from './ProCustomMenuLayout';
import ProCheckProfileScreen from './ProCheckProfileScreen'
import ProDashboardScreen from './ProDashboardScreen';
import ProMyProfileScreen from './ProMyProfileScreen';
import ProNotificationsScreen from './ProNotificationsScreen';
import ProAllMessageScreen from './ProAllMessageScreen';
import ChatWithAdminScreen from './ChatWithAdminScreen';
import ContactUsScreen from './ContactUsScreen';
import AboutUsScreen from './AboutUsScreen';
import ProBookingScreen from './ProBookingScreen';

const colorPrimary = '#FFBF0F';

const ProMyDrawerNavigator = createDrawerNavigator({
    
    ProDashboard: {screen: ProDashboardScreen},
    ProMyProfile: {screen: ProMyProfileScreen},
    ProCheckProfile: {screen: ProCheckProfileScreen},
    ProNotifications: {screen: ProNotificationsScreen},
    ProAllMessage: {screen: ProAllMessageScreen},
    ChatWithAdmin: {screen: ChatWithAdminScreen},
    ContactUs: {screen: ContactUsScreen},
    AboutUs: {screen: AboutUsScreen},
    ProBooking: {screen: ProBookingScreen}
},
{
    initialRouteName: 'ProDashboard',
    drawerWidth: 275,
    drawerPosition: 'left',
    drawerType: "push-screen",
    contentComponent: ProCustomMenuLayout,
    drawerOpenRoute: 'DrawerOpen',
    drawerCloseRoute: 'DrawerClose',
    drawerToggleRoute: 'DrawerToggle'
}
);

const AppContainer = createAppContainer(ProMyDrawerNavigator);

export default class ProDrawerNavigator extends Component{

    render(){
        return <AppContainer/>;
    }
}

