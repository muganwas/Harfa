import React, {Component} from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import CheckBox from 'react-native-check-box';
import SimpleToast from 'react-native-simple-toast';
import images from '../../Constants/images';
import {fetchServices} from '../../controllers/jobs';
import {
  colorBg,
  colorPrimary,
  white,
  themeRed,
  black,
  lightGray,
} from '../../Constants/colors';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return Platform.OS === 'ios' ? (
    <View
      style={{
        width: '100%',
        height: STATUS_BAR_HEIGHT,
        backgroundColor: white,
      }}>
      <StatusBar barStyle="dark-content" />
    </View>
  ) : (
    <StatusBar barStyle="dark-content" backgroundColor={white} />
  );
};

export default class ProServiceSelectScreen extends Component {
  constructor() {
    super();
    this.state = {
      dataSource: [],
      selectedServiceId: [],
      selectedServiceName: [],
      isLoading: true,
    };
  }

  async componentDidMount() {
    //Get All Services
    await fetchServices({
      onSuccess: dataSource =>
        this.setState({
          dataSource,
          isLoading: false,
        }),
      onError: msg => {
        this.setState({
          isLoading: false,
        });
        SimpleToast.show(msg);
      },
    });
  }

  onCheckBoxPress = (id, serviceName) => {
    let tmpId = this.state.selectedServiceId;
    let tmpName = this.state.selectedServiceName;

    if (tmpId.includes(id)) {
      tmpId.splice(tmpId.indexOf(id), 1);
      tmpName.splice(tmpName.indexOf(serviceName));
    } else {
      tmpId.push(id);
      tmpName.push(serviceName);
    }

    this.setState({
      selectedServiceId: tmpId,
      selectedServiceName: tmpName,
    });
  };

  checkValidation = () => {
    const {navigation} = this.props;
    const origin = navigation.getParam('from');
    const onGoBack = navigation.getParam('onGoBack');
    if (this.state.selectedServiceId.length > 0) {
      navigation.state.params.onGoBack(
        this.state.selectedServiceId + '/' + this.state.selectedServiceName,
      );
      if (origin === 'profile-screen') {
        navigation.navigate('ProMyProfile', {
          onGoBack,
          from: 'service-select',
        });
      } else navigation.goBack();
    } else {
      SimpleToast.show('Select atleast one services', SimpleToast.SHORT);
    }
  };

  renderItem = (item, index) => {
    return (
      <View
        key={index}
        style={[
          styles.header,
          {
            alignItems: 'center',
            marginVertical: 1.5,
            backgroundColor: themeRed,
          },
        ]}>
        <View
          style={[
            styles.touchaleHighlight,
            {
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}>
          <Image
            style={{
              width: 25,
              tintColor: white,
              height: 25,
            }}
            source={images[item.image]}
          />
        </View>
        <Text style={styles.textHeader}> {item.service_name}</Text>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignContent: 'center',
          }}>
          <CheckBox
            style={{
              alignSelf: 'flex-end',
              marginRight: 20,
            }}
            isChecked={
              this.state.selectedServiceId.includes(item.id) ? true : false
            }
            checkBoxColor={white}
            onClick={() => this.onCheckBoxPress(item.id, item.service_name)}
          />
        </View>
      </View>
    );
  };

  render() {
    const {navigation} = this.props;
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: 50,
            backgroundColor: colorPrimary,
            paddingLeft: 10,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 5,
          }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
            }}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                alignSelf: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                const origin = navigation.getParam('from');
                const onGoBack = navigation.getParam('onGoBack');
                if (origin === 'profile-screen') {
                  this.props.navigation.navigate('ProMyProfile', {
                    onGoBack,
                    from: 'service-select',
                  });
                } else this.props.navigation.goBack();
              }}>
              <Image
                style={{
                  width: 20,
                  height: 20,
                  tintColor: black,
                  alignSelf: 'center',
                }}
                source={require('../../icons/arrow_back.png')}
              />
            </TouchableOpacity>

            <Text
              style={{
                color: black,
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginLeft: 10,
              }}>
              Services
            </Text>
          </View>
        </View>

        <ScrollView style={styles.gridView}>
          {this.state.dataSource.map(this.renderItem)}
        </ScrollView>

        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={this.checkValidation}>
            <Text style={styles.text}>Submit</Text>
          </TouchableOpacity>
        </View>

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator style={{height: 80}} color="#C00" size="large" />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  header: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: lightGray,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  touchaleHighlight: {
    width: 40,
    height: 40,
    borderRadius: 35,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textHeader: {
    fontSize: 14,
    color: white,
    fontWeight: 'bold',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  buttonContainer: {
    width: 175,
    height: 40,
    backgroundColor: white,
    shadowColor: black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    textAlign: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  text: {
    fontSize: 16,
    color: black,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridView: {
    flex: 1,
    backgroundColor: colorBg,
    padding: 5,
  },
  open: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuIcon: {
    width: 22,
    height: 22,
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
