import React, { Component } from 'react';
import { View, Text, StatusBar, TouchableOpacity, BackHandler, Image } from 'react-native';
import { themeRed, black, white } from '../../Constants/colors';

export default class ProAccountTypeScreen extends Component {
    
    componentDidMount(){
        const { navigation } = this.props; 
        navigation.addListener('willFocus', async () => {       
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick = () => {
        this.props.navigation.goBack();
        return true;
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar barStyle='dark-content' backgroundColor={white} />
                <Image
                    style={{ width: 140, height: 140, marginBottom: 10 }}
                    source={require('../../images/kuchapa_logo.png')}
                    resizeMode="contain" />
                <Text style={{color: 'white', fontSize: 20, marginBottom: 50, fontWeight: 'bold', color:black}}>
                    Select your account type
                </Text>

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("ProFacebookGoogle", {
                        "accountType" : "Individual"})}>
                    <Text style={styles.text}>
                        Individual
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonContainer}
                    onPress={() => this.props.navigation.navigate("ProFacebookGoogle", {
                        "accountType" : "Company"})}>
                    <Text style={styles.text}>
                        Enterprise
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: white,
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
        color: black,
        textAlign: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
        fontWeight: 'bold'
    }
};