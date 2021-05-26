import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {AirbnbRating} from 'react-native-ratings';
import {
  lightGray,
  black,
  colorBg,
  white,
  themeRed,
  colorGray,
  colorGreen,
} from '../../Constants/colors';

export default class DialogReviewCustomer extends Component {
  constructor() {
    super();
    this.state = {
      width: Dimensions.get('window').width,
      isReviewDialogVisible: false,
    };
    Dimensions.addEventListener('change', e => {
      this.setState(e.window);
    });
  }

  changeReviewDialogVisibility = bool => {
    this.setState({
      isReviewDialogVisible: bool,
    });
  };

  closeReviewDialog = action => {
    const {changeDialogVisibility} = this.props;
    if (action === 'Submit') {
      changeDialogVisibility(false, 'Submit');
    } else if (action === 'Not now') {
      console.log('Not now');
      changeDialogVisibility(false, 'Not now');
    }
  };

  render() {
    const {data, review, rating, updateRating, updateReview} = this.props;
    return (
      <TouchableOpacity
        activeOpacity={1}
        disabled={true}
        style={styles.contentContainer}>
        <View style={[styles.modal, {width: this.state.width - 80}]}>
          <View style={styles.textView}>
            <Text style={[styles.text, {fontSize: 20}]}> Review </Text>
            <View
              style={{
                width: this.state.width - 100,
                height: 1,
                backgroundColor: lightGray,
              }}
            />

            <Image
              style={{width: 45, height: 45, borderRadius: 100, marginTop: 15}}
              source={
                data.employee_details.image
                  ? {uri: data.employee_details.image}
                  : require('../../images/generic_avatar.png')
              }
            />
            <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>
              {data.employee_details.username +
                ' ' +
                data.employee_details.surname}
            </Text>

            <View style={{backgroundColor: colorBg, marginTop: 10}}>
              <AirbnbRating
                type="custom"
                defaultRating={rating}
                ratingCount={5}
                size={20}
                ratingBackgroundColor={colorBg}
                showRating={false}
                onFinishRating={updateRating}
              />
            </View>

            <View>
              <TextInput
                style={{
                  width: this.state.width - 120,
                  height: 80,
                  borderRadius: 5,
                  borderColor: colorGray,
                  borderWidth: 1,
                  marginTop: 10,
                  padding: 10,
                }}
                multiline={true}
                value={review.toString()}
                placeholder="Additional comments"
                onChangeText={updateReview}
              />
            </View>
          </View>
          <View style={styles.buttonView}>
            <TouchableOpacity
              style={styles.touchableHighlight}
              onPress={() => this.closeReviewDialog('Not now')}>
              <Text style={[styles.text, {color: themeRed}]}> Not now </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.touchableHighlight]}
              onPress={() => this.closeReviewDialog('Submit')}>
              <Text style={[styles.text, {color: colorGreen}]}> Submit </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    height: 360,
    paddingTop: 10,
    alignSelf: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: colorBg,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  touchableHighlight: {
    flex: 1,
    backgroundColor: white,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 5,
    borderRadius: 5,
    marginLeft: 5,
    marginRight: 5,
    shadowColor: black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    padding: 10,
  },
  textView: {
    flex: 1,
    alignItems: 'center',
  },
  buttonView: {
    width: '100%',
    flexDirection: 'row',
  },
});
