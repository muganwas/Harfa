import React, {Component} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  BackHandler,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import {connect} from 'react-redux';
import {AirbnbRating} from 'react-native-ratings';
import Toast from 'react-native-simple-toast';
import ReviewDialog from '../ReviewDialog';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import {reviewTask} from '../../controllers/bookings';
import {cloneDeep} from 'lodash';
import {
  setSelectedJobRequest,
  updateCompletedBookingData,
} from '../../Redux/Actions/jobsActions';
import {
  colorPrimary,
  colorBg,
  white,
  black,
  lightGray,
  darkGray,
  themeRed,
} from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
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

class ProBookingDetailsScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      isLoading: false,
      isErrorToast: false,
      bookingDetails: props.navigation.state.params.bookingDetails,
      isRatingDialogVisible: false,
      mainId: '',
      fcm_id: props.navigation.state.params.bookingDetails.user_details.fcm_id,
      username:
        props.navigation.state.params.bookingDetails.user_details.username,
      customer_rating:
        props.navigation.state.params.bookingDetails.customer_rating,
      customer_review:
        props.navigation.state.params.bookingDetails.customer_review,
      employee_rating:
        props.navigation.state.params.bookingDetails.employee_rating,
      employee_review:
        props.navigation.state.params.bookingDetails.employee_review,
    };
  }

  componentDidMount() {
    const {navigation} = this.props;
    navigation.addListener('willFocus', async () => {
      this.init(this.props);
      BackHandler.addEventListener('hardwareBackPress', () =>
        this.handleBackButtonClick(),
      );
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
    });
  }

  init = props => {
    this.setState({
      isLoading: false,
      isErrorToast: false,
      bookingDetails: props.navigation.state.params.bookingDetails,
      isRatingDialogVisible: false,
      mainId: '',
      fcm_id: props.navigation.state.params.bookingDetails.user_details.fcm_id,
      username:
        props.navigation.state.params.bookingDetails.user_details.username,
      customer_rating:
        props.navigation.state.params.bookingDetails.customer_rating,
      customer_review:
        props.navigation.state.params.bookingDetails.customer_review,
      employee_rating:
        props.navigation.state.params.bookingDetails.employee_rating,
      employee_review:
        props.navigation.state.params.bookingDetails.employee_review,
    });
  };

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  };

  //Call also from ReviewDialog
  changeDialogVisibility = async (bool, resp) => {
    const {employee_rating, employee_review, bookingDetails} = this.state;
    this.setState({
      isRatingDialogVisible: bool,
      mainId: bookingDetails._id,
    });
    if (
      bookingDetails.customer_rating === '' &&
      employee_rating &&
      employee_rating !== '' &&
      resp === 'Submit'
    ) {
      console.log('uploading review...');
      await this.reviewTaskProvider(employee_rating, employee_review);
    }
  };

  reviewTaskProvider = async (rating, review) =>
    await reviewTask({
      rating,
      review,
      main_id: this.state.mainId,
      fcm_id: this.state.fcm_id,
      senderName: this.props?.userInfo?.providerDetails?.name,
      senderId: this.props?.userInfo?.providerDetails?.providerId,
      userType: 'Employee',
      notification_by: 'Employee',
      notificationType: 'Review',
      reviewURL: REVIEW_RATING,
      onSuccess: () => {
        this.setState({
          isErrorToast: false,
          isLoading: false,
          isReviewDialogVisible: false,
          mainId: '',
        });
        const pos = this.props.navigation.getParam('position');
        let newCompletedBookingData = cloneDeep(
          this.props.jobsInfo.bookingCompleteData,
        );
        let newBookingDetails = cloneDeep(this.state.bookingDetails);
        if (pos !== undefined) {
          newBookingDetails.employee_rating = this.state.employee_rating;
          newBookingDetails.employee_review = this.state.employee_review;
          newCompletedBookingData[pos] = newBookingDetails;
          this.props.updateCompletedBookingData(newCompletedBookingData);
        }
      },
      toggleIsLoading: bool => {
        if (bool === true) {
          this.setState({
            isLoading: bool,
            isErrorToast: false,
            employee_rating: rating,
            employee_review: review,
          });
        } else {
          this.setState({
            isLoading: false,
            isErrorToast: true,
          });
        }
      },
    });

  showToast = message => {
    Toast.show(message);
  };

  changeWaitingDialogVisibility = bool => {
    this.setState({
      isLoading: bool,
    });
  };

  render() {
    const {dispatchSelectedJobRequest, navigation} = this.props;
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
          <View style={{flex: 1, flexDirection: 'row'}}>
            <TouchableOpacity
              style={{
                width: 35,
                height: 35,
                alignSelf: 'center',
                justifyContent: 'center',
              }}
              onPress={() =>
                navigation.navigate('ProBooking', {from: 'detailsScreen'})
              }>
              <Image
                style={{
                  width: 20,
                  height: 20,
                  alignSelf: 'center',
                  tintColor: black,
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
              Booking details
            </Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              marginTop: 15,
              paddingHorizontal: 10,
              borderBottomColor: lightGray,
              borderBottomWidth: 1,
            }}>
            <Text style={{color: darkGray, fontWeight: 'bold', fontSize: 14}}>
              Order number -{' '}
              {this.state.bookingDetails.order_id.replace('"', '')}
            </Text>
          </View>
          <View style={styles.providerDetailsContainer}>
            <View style={styles.profilePictureContainer}>
              <Image
                style={styles.profilePicture}
                source={
                  this.state.bookingDetails.user_details.image
                    ? {uri: this.state.bookingDetails.user_details.image}
                    : require('../../images/generic_avatar.png')
                }
              />
            </View>
            <View style={styles.addressContainer}>
              <Text
                style={{
                  color: black,
                  fontSize: 14,
                  fontWeight: 'bold',
                  textAlignVertical: 'center',
                  marginLeft: 10,
                }}>
                {this.state.bookingDetails.user_details.username}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                }}>
                <Image
                  style={{
                    height: 15,
                    width: 15,
                    alignSelf: 'center',
                    alignContent: 'flex-start',
                    borderRadius: 100,
                  }}
                  source={require('../../icons/mobile.png')}
                />
                <Text
                  style={{
                    color: black,
                    fontSize: 12,
                    color: darkGray,
                    textAlignVertical: 'center',
                    marginLeft: 5,
                  }}>
                  {this.state.bookingDetails.user_details.mobile}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                }}>
                <Image
                  style={{
                    height: 15,
                    width: 15,
                    alignSelf: 'center',
                    alignContent: 'flex-start',
                    borderRadius: 100,
                  }}
                  source={require('../../icons/calendar.png')}
                />
                <Text
                  style={{
                    color: black,
                    fontSize: 12,
                    color: darkGray,
                    textAlignVertical: 'center',
                    marginLeft: 5,
                  }}>
                  {this.state.bookingDetails.user_details.dob}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 10,
                  marginTop: 5,
                  marginRight: 50,
                }}>
                <Text
                  style={{
                    color: black,
                    fontSize: 12,
                    color: darkGray,
                    textAlignVertical: 'center',
                  }}>
                  {this.state.bookingDetails.user_details.address}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignContent: 'flex-start',
                  marginTop: 15,
                  marginLeft: 10,
                }}>
                <Text
                  style={{
                    color: darkGray,
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}>
                  {this.state.bookingDetails.createdDate}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              marginTop: 15,
              paddingHorizontal: 10,
              borderTopColor: lightGray,
              borderTopWidth: 1,
            }}>
            <Text style={{color: black, fontWeight: 'bold', fontSize: 14}}>
              Customer's rating of service
            </Text>
          </View>
          <View style={styles.ratingSect}>
            <AirbnbRating
              type="custom"
              ratingCount={5}
              size={25}
              defaultRating={this.state.customer_rating}
              ratingBackgroundColor={colorBg}
              showRating={false}
              isDisabled={true}
              onFinishRating={rating =>
                console.log('Customer Rating : ' + rating)
              }
            />
          </View>

          {this.state.customer_review !== '' && (
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignContent: 'flex-start',
                  marginTop: 15,
                  marginLeft: 10,
                }}>
                <Text style={{color: black, fontWeight: 'bold', fontSize: 14}}>
                  Customer's review
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignContent: 'flex-start',
                  margin: 10,
                }}>
                <Text style={{color: 'grey', fontSize: 14, padding: 10}}>
                  {this.state.customer_review}
                </Text>
              </View>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              marginTop: 15,
              paddingHorizontal: 10,
              borderTopColor: lightGray,
              borderTopWidth: 1,
            }}>
            <Text style={{color: black, fontWeight: 'bold', fontSize: 14}}>
              Your rating of customer
            </Text>
          </View>
          <View style={styles.ratingSect}>
            <AirbnbRating
              type="custom"
              ratingCount={5}
              size={25}
              defaultRating={this.state.employee_rating}
              ratingBackgroundColor={colorBg}
              showRating={false}
              isDisabled={this.state.employee_rating != '' ? true : false}
              onFinishRating={rating => {
                this.setState({
                  employee_rating: rating,
                });
                this.changeDialogVisibility(true);
              }}
            />
          </View>

          {this.state.employee_review !== '' && (
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignContent: 'flex-start',
                  marginTop: 15,
                  marginLeft: 10,
                }}>
                <Text style={{color: black, fontWeight: 'bold', fontSize: 14}}>
                  Your customer review
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignContent: 'flex-start',
                  margin: 10,
                }}>
                <Text style={{color: 'grey', fontSize: 14, padding: 10}}>
                  {this.state.employee_review}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.chatView}
          onPress={() => {
            dispatchSelectedJobRequest({
              user_id: this.state.bookingDetails.user_id,
            });
            this.props.navigation.navigate('ProChatAfterBookingDetails', {
              receiverId: this.state.bookingDetails.user_id,
              receiverName: this.state.bookingDetails.user_details.username,
              receiverImage: this.state.bookingDetails.user_details.image,
              orderId: this.state.bookingDetails.order_id,
              serviceName: this.state.bookingDetails.service_details
                .service_name,
              pageTitle: 'ProBookingDetails',
              fcm_id: this.state.fcm_id,
            });
          }}>
          <Image
            style={{
              width: 20,
              height: 20,
              marginLeft: 20,
              tintColor: white,
            }}
            source={require('../../icons/chatting.png')}
          />
          <Text
            style={{
              color: white,
              fontWeight: 'bold',
              fontSize: 16,
              textAlign: 'center',
              marginLeft: 10,
            }}>
            Chat history
          </Text>
          <Image
            style={{
              width: 20,
              height: 20,
              marginLeft: 20,
              tintColor: white,
              position: 'absolute',
              end: 0,
              marginRight: 15,
            }}
            source={require('../../icons/right_arrow.png')}
          />
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={this.state.isRatingDialogVisible}
          animationType="fade"
          onRequestClose={() => this.changeDialogVisibility(false)}>
          <ReviewDialog
            style={{
              shadowColor: black,
              shadowOffset: {width: 0, height: 3},
              shadowOpacity: 0.75,
              shadowRadius: 5,
              elevation: 5,
            }}
            rating={this.state.employee_rating}
            review={this.state.employee_review}
            updateReview={review => this.setState({employee_review: review})}
            updateRating={rating => this.setState({employee_rating: rating})}
            changeDialogVisibility={this.changeDialogVisibility}
            data={this.state.bookingDetails}
          />
        </Modal>

        <Modal
          transparent={true}
          visible={this.state.isLoading}
          animationType="fade"
          onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
          <WaitingDialog
            changeWaitingDialogVisibility={this.changeWaitingDialogVisibility}
          />
        </Modal>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  jobsInfo: state.jobsInfo,
  userInfo: state.userInfo,
});

const mapDispatchToProps = dispatch => ({
  dispatchSelectedJobRequest: job => {
    dispatch(setSelectedJobRequest(job));
  },
  updateCompletedBookingData: data => {
    dispatch(updateCompletedBookingData(data));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProBookingDetailsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorBg,
  },
  mainContainer: {
    width: screenWidth,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 2,
    marginTop: 10,
  },
  providerDetailContainer: {
    width: screenWidth,
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
  },
  profilePicture: {
    height: 100,
    width: 100,
    alignSelf: 'flex-start',
    alignContent: 'flex-start',
    borderRadius: 100,
  },
  providerDetailsContainer: {
    width: screenWidth,
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 10,
    padding: 10,
  },
  profilePictureContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingSect: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 0,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 0,
  },
  addressContainer: {
    flexDirection: 'column',
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  chatView: {
    flexDirection: 'row',
    width: screenWidth,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: themeRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
});
