
import React , { Component } from 'react';
import {createAppContainer} from 'react-navigation';
import {createDrawerNavigator } from 'react-navigation-drawer';
import CustomMenuLayout from './CustomMenuLayout';

import DashBoardScreen from './DashboardScreen';
import AboutUsScreen from './AboutUsScreen';
import ContactUsScreen from './ContactUsScreen'; 
import MyProfileScreen from './MyProfileScreen';
import AllMessageScreen from './AllMessageScreen';
import NotificationsScreen from './NotificationsScreen';
import BookingScreen from './BookingScreen';

const MyDrawerNavigator = createDrawerNavigator({
    
    Dashboard: {screen: DashBoardScreen},
    MyProfile: {screen: MyProfileScreen},
    Booking: {screen: BookingScreen},
    AboutUs: {screen: AboutUsScreen},
    ContactUs: {screen: ContactUsScreen},
    AllMessage: {screen: AllMessageScreen},
    Notifications: {screen: NotificationsScreen},
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

export default class DrawerNavigator extends Component{

    render(){
        return <AppContainer/>;
    }
}