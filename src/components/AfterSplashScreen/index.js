
import React, { Component } from 'react';
import { View, Image, Text, StatusBar, TouchableOpacity, BackHandler, Platform, StyleSheet } from 'react-native';
import { withNavigation } from 'react-navigation';
import RNExitApp from 'react-native-exit-app';
import { themeRed, white } from '../../Constants/colors';

class AfterSplashScreen extends Component {
    componentDidMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }


    handleBackButtonClick = () => {
        if (Platform.OS == 'android')
            BackHandler.exitApp();
        else
            RNExitApp.exitApp();
    }

    render() {
        return (
            <View style={styles.container}>

                <StatusBar barStyle='dark-content' backgroundColor={white} />

                <Image
                    style={{ width: 140, height: 140, marginBottom: 30 }}
                    source={require('../../images/kuchapa_logo.png')}
                    resizeMode="contain" />

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("AccountType")}>
                    <Text style={styles.text}>
                        Client
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("ProAccountType")}>
                    <Text style={styles.text}>
                        Service Provider
                    </Text>
                </TouchableOpacity>

            </View>
        )
    }
}

export default withNavigation(AfterSplashScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonContainer: {
        width: 250,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderWidth: 3,
        borderColor: themeRed,
        marginBottom: 25,
        textAlign: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#000000',
        textAlign: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    }
});