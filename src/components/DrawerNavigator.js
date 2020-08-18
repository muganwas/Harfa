
import React, { Component } from 'react';
import { createAppContainer } from 'react-navigation';
import { createDrawerNavigator } from 'react-navigation-drawer';
import DashboardScreen from './DashboardScreen';
import AccountTypeScreen from './AccountTypeScreen';
import AfterSplashScreen from './AfterSplashScreen';
import CustomMenuLayout from './CustomMenuLayout';
import ChatWithAdminScreen from './ChatWithAdminScreen';
import AboutUsScreen from './AboutUsScreen';
import ContactUsScreen from './ContactUsScreen';
import MyProfileScreen from './MyProfileScreen';
import AllMessageScreen from './AllMessageScreen';
import NotificationsScreen from './NotificationsScreen';
import BookingScreen from './BookingScreen';
import ProviderDetailsScreen from './ProviderDetailsScreen';
import ProAccountTypeScreen from './ProAccountTypeScreen';
import ListOfProviderScreen from './ListOfProviderScreen';
import FacebookGoogleScreen from './FacebookGoogleScreen';
import AddAddressScreen from './AddAddressScreen';

const MyDrawerNavigator = createDrawerNavigator({
    FacebookGoogle: { screen: FacebookGoogleScreen},
    AfterSplash: { screen: AfterSplashScreen },
    AccountType: { screen: AccountTypeScreen },
    Home: { screen: DashboardScreen },
    ProAccountType: { screen: ProAccountTypeScreen },
    Dashboard: { screen: DashboardScreen },
    ProviderDetails: { screen: ProviderDetailsScreen },
    ListOfProviders: { screen: ListOfProviderScreen },
    AddAddress: { screen: AddAddressScreen },
    MyProfile: { screen: MyProfileScreen },
    Booking: { screen: BookingScreen },
    AboutUs: { screen: AboutUsScreen },
    ChatWithAdmin: { screen: ChatWithAdminScreen },
    ContactUs: { screen: ContactUsScreen },
    AllMessage: { screen: AllMessageScreen },
    Notifications: { screen: NotificationsScreen },
},
    {
        initialRouteName: 'Dashboard',
        drawerWidth: 275,
        drawerPosition: 'left',
        drawerType: "push-screen",
        contentComponent: CustomMenuLayout,
    }
);

const AppContainer = createAppContainer(MyDrawerNavigator);

export default class DrawerNavigator extends Component {
    render() {
        return <AppContainer />
    }
}