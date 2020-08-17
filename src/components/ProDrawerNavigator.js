
import React, { Component } from 'react';
import { createAppContainer } from 'react-navigation';
import { createDrawerNavigator } from 'react-navigation-drawer';
import ProCustomMenuLayout from './ProCustomMenuLayout';
import ProCheckProfileScreen from './ProCheckProfileScreen'
import ProAddAddressScreen from './ProAddAddressScreen';
import ProDashboardScreen from './ProDashboardScreen';
import ProMyProfileScreen from './ProMyProfileScreen';
import ProNotificationsScreen from './ProNotificationsScreen';
import ProAllMessageScreen from './ProAllMessageScreen';
import ChatWithAdminScreen from './ChatWithAdminScreen';
import ContactUsScreen from './ContactUsScreen';
import ProAboutUsScreen from './ProAboutUsScreen';
import ProBookingScreen from './ProBookingScreen';
import ProFacebookGoogleScreen from './ProFacebookGoogleScreen';
import ProForgotPasswordScreen from './ProForgotPasswordScreen';
import ProAccountTypeScreen from './ProAccountTypeScreen';
import ProRegisterFBScreen from './ProAcceptRejectJobScreen';
import ProRegisterScreen from './ProRegisterScreen';
import ProServiceSelectScreen from './ProServiceSelectScreen';

const ProMyDrawerNavigator = createDrawerNavigator({
    ProDashboard: { screen: ProDashboardScreen },
    ProHome: { screen: ProDashboardScreen },
    ProAddAddress: { screen: ProAddAddressScreen },
    ProMyProfile: { screen: ProMyProfileScreen },
    ProCheckProfile: { screen: ProCheckProfileScreen },
    ProNotifications: { screen: ProNotificationsScreen },
    ProAllMessage: { screen: ProAllMessageScreen },
    ChatWithAdmin: { screen: ChatWithAdminScreen },
    ContactUs: { screen: ContactUsScreen },
    AboutUs: { screen: ProAboutUsScreen },
    ProBooking: { screen: ProBookingScreen },
    ProFacebookGoogle: { screen: ProFacebookGoogleScreen },
    ProForgotPassword: { screen: ProForgotPasswordScreen },
    ProAccountType: { screen: ProAccountTypeScreen },
    ProRegisterFB: { screen: ProRegisterFBScreen },
    ProRegister: { screen: ProRegisterScreen },
    ProServiceSelect: { screen: ProServiceSelectScreen },
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

export default class ProDrawerNavigator extends Component {
    render() {
        return <AppContainer />
    }
}

