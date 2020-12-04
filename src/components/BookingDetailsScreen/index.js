import React, { Component } from 'react';
import {
    View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, BackHandler,
    ScrollView, Modal, StatusBar, Platform
} from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import Toast from 'react-native-simple-toast';
import { AirbnbRating } from 'react-native-ratings';
import ReviewDialogCustomer from '../ReviewDialogCustomer';
import WaitingDialog from '../WaitingDialog';
import Config from '../Config';
import { setSelectedJobRequest } from '../../Redux/Actions/jobsActions';
import { black, colorBg, colorPrimary, white, lightGray, themeRed, darkGray } from '../../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
    return (
        Platform.OS === 'ios' ?
            <View style={{
                width: "100%",
                height: STATUS_BAR_HEIGHT,
                backgroundColor: white
            }}>
                <StatusBar
                    barStyle="dark-content" />
            </View>
            :
            <StatusBar barStyle='dark-content' backgroundColor={white} />
    );
}

class BookingDetailsScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            isLoading: false,
            isErrorToast: false,
            bookingDetails: props.navigation.state.params.bookingDetails,
            isDialogLogoutVisible: false,
            mainId: '',
            username: props.navigation.state.params.bookingDetails.employee_details.username,
            fcm_id: props.navigation.state.params.bookingDetails.employee_details.fcm_id,
            customer_rating: props.navigation.state.params.bookingDetails.customer_rating,
            customer_review: props.navigation.state.params.bookingDetails.customer_review,
            employee_rating: props.navigation.state.params.bookingDetails.employee_rating,
            employee_review: props.navigation.state.params.bookingDetails.employee_review
        };
    };

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
        this.props.navigation.goBack();
        return true;
    }

    //Call also from ReviewDialog
    changeDialogVisibility = (bool, text, bookingDetails, rating, review) => {
        if (this.state.bookingDetails.customer_rating == '') {
            if (rating != '') {
                if (text == '') {

                    this.setState({
                        isDialogLogoutVisible: bool,
                        mainId: this.state.bookingDetails._id,
                    })
                }
                else {
                    if (text == "Not now") {
                        this.setState({
                            isDialogLogoutVisible: bool,
                        })
                    }
                    else if (text == "Submitted") {
                        this.setState({
                            isDialogLogoutVisible: bool,
                        })
                        this.reviewTask(rating, review);
                    }
                }
            }
            else {
                console.log("ELSE >>");
                if (text == "Not now") {
                    this.setState({
                        isDialogLogoutVisible: bool,
                    })
                }
                else if (text == "Submitted") {
                    this.setState({
                        isDialogLogoutVisible: bool,
                    })
                    this.reviewTask(rating, review);
                }
            }
        }
    }

    reviewTask = (rating, review) => {
        this.setState({
            isLoading: true,
            customer_rating: rating,
            customer_review: review,
        });
        const { userDetails } = this.props.userInfo;
        const reviewData = {
            "main_id": this.state.mainId,
            "type": "Customer",
            "rating": rating,
            "review": review,
            "notification": {
                "fcm_id": this.state.fcm_id,
                "type": "Review",
                "notification_by": "Customer",
                "title": "Given Review",
                "save_notification": true,
                "senderName": userDetails.username,
                "senderId": userDetails.userId,
                "body": this.state.username + " has given you a review",
            }
        }

        fetch(REVIEW_RATING,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            })
            .then((response) => response.json())
            .then((response) => {
                console.log("Response reviewTask " + JSON.stringify(response));
                if (response.result) {
                    this.setState({
                        isLoading: false,
                        isReviewDialogVisible: false,
                        mainId: "",
                        isErrorToast: false,
                    })
                    this.showToast("Review Submitted");
                }
                else {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true,
                    })
                    this.showToast("Something went wrong");
                }
            })
            .catch((error) => {
                console.log("Error :" + error);
                this.setState({
                    isLoading: false,
                })
            })
            .done()
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { userInfo: { userDetails }, dispatchSelectedJobRequest, navigation } = this.props;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <View style={{ flex: 1, flexDirection: 'row', }}>
                        <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
                            onPress={() => navigation.navigate('Booking')}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center', tintColor: black }}
                                source={require('../../icons/arrow_back.png')} />
                        </TouchableOpacity>
                        <Text style={{ color: black, fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                            Booking details
                    </Text>
                    </View>
                </View>

                <ScrollView>
                    <View style={{ marginBottom: 10 }}>
                        <View style={styles.mainContainer}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                alignContent: 'flex-start',
                                marginTop: 15,
                                paddingHorizontal: 10,
                                borderBottomColor: lightGray,
                                borderBottomWidth: 1
                            }}>
                                <Text style={{ color: darkGray, fontWeight: 'bold', fontSize: 14 }}>Order number - {this.state.bookingDetails.order_id.replace("\"", "")}</Text>
                            </View>
                            <View style={styles.providerDetailsContainer}>
                                <Image
                                    style={{ height: 45, width: 45, alignSelf: 'flex-start', alignContent: 'flex-start', borderRadius: 100 }}
                                    source={this.state.bookingDetails.employee_details.image ? { uri: this.state.bookingDetails.employee_details.image } : require('../../images/generic_avatar.png')} />
                                <View style={{ flexDirection: 'column' }}>
                                    <Text style={{ color: black, fontSize: 14, fontWeight: 'bold', textAlignVertical: 'center', marginLeft: 10, }}>
                                        {this.state.bookingDetails.employee_details.username + " " + this.state.bookingDetails.employee_details.surname}
                                    </Text>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                                        <Image
                                            style={{ height: 15, width: 15, alignSelf: 'center', alignContent: 'flex-start', borderRadius: 100, }}
                                            source={require('../../icons/mobile.png')} />
                                        <Text style={{ color: black, fontSize: 12, color: darkGray, textAlignVertical: 'center', marginLeft: 5 }}>
                                            {this.state.bookingDetails.employee_details.mobile}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5, marginRight: 50 }}>
                                        <Text style={{ color: black, fontSize: 12, color: black, textAlignVertical: 'center', }}>
                                            {this.state.bookingDetails.employee_details.description}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTowhitp: 5, marginRight: 50 }}>
                                        <Text style={{ color: black, fontSize: 12, color: darkGray, textAlignVertical: 'center', }}>
                                            {this.state.bookingDetails.employee_details.address}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                alignContent: 'flex-start',
                                marginTop: 15,
                                paddingHorizontal: 10,
                                borderTopColor: lightGray,
                                borderTopWidth: 1
                            }}>
                                <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>Service provider's rating</Text>
                            </View>
                            <View style={{
                                backgroundColor: white,
                                marginTop: 10,
                                marginBottom: 10,
                                alignItems: 'flex-start',
                                paddingHorizontal: 10
                            }}>
                                <AirbnbRating
                                    type='custom'
                                    ratingCount={5}
                                    size={25}
                                    defaultRating={this.state.employee_rating}
                                    ratingBackgroundColor={colorBg}
                                    showRating={false}
                                    isDisabled={true}
                                    onFinishRating={(rating) => console.log("Employee Rating : " + rating)} />
                            </View>

                            {this.state.employee_review != '' &&
                                <View>
                                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                        <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>Service provider's review</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                                        <Text style={{ color: darkGray, fontSize: 14, paddingLeft: 5, paddingRight: 5, paddingBottom: 10, }}>{this.state.employee_review}</Text>
                                    </View>
                                </View>
                            }
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                alignContent: 'flex-start',
                                marginTop: 15,
                                paddingHorizontal: 10,
                                borderTopColor: lightGray,
                                borderTopWidth: 1
                            }}>
                                <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>Your rating of service</Text>
                            </View>
                            <View style={{
                                backgroundColor: white,
                                marginTop: 10,
                                marginBottom: 10,
                                alignItems: 'flex-start',
                                paddingHorizontal: 10
                            }}>
                                <AirbnbRating
                                    type='custom'
                                    ratingCount={5}
                                    size={25}
                                    defaultRating={this.state.customer_rating}
                                    ratingBackgroundColor={colorBg}
                                    showRating={false}
                                    isDisabled={this.state.customer_rating != '' ? true : false}
                                    onFinishRating={(rating) => {
                                        this.setState({
                                            customer_rating: rating
                                        })
                                        this.changeDialogVisibility(true, "", this.state.bookingDetails, rating, "")
                                    }
                                    } />
                            </View>

                            {this.state.customer_review != '' &&
                                <View>
                                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                        <Text style={{ color: black, fontWeight: 'bold', fontSize: 14 }}>Your service review</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                                        <Text style={{ color: darkGray, fontSize: 14, paddingLeft: 5, paddingRight: 5, paddingBottom: 10, }}>{this.state.customer_review}</Text>
                                    </View>
                                </View>
                            }
                        </View>

                        <View style={styles.mainContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                <Text style={{ color: darkGray, fontWeight: 'bold', fontSize: 14 }}>Service address</Text>
                            </View>

                            <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>

                            <View style={styles.providerDetailsContainer}>
                                <View style={{ flexDirection: 'column' }}>
                                    <Text style={{ color: black, fontSize: 14, fontWeight: 'bold', textAlignVertical: 'center', marginLeft: 10, }}>
                                        {userDetails.username}
                                    </Text>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                                        <Image
                                            style={{ height: 15, width: 15, alignSelf: 'center', alignContent: 'flex-start', borderRadius: 100, }}
                                            source={require('../../icons/mobile.png')} />
                                        <Text style={{ color: black, fontSize: 12, color: darkGray, textAlignVertical: 'center', marginLeft: 5 }}>
                                            {userDetails.mobile}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5, marginRight: 50 }}>
                                        <Text style={{ fontSize: 12, color: darkGray, textAlignVertical: 'center', }}>
                                            {this.state.bookingDetails.delivery_address}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5, marginRight: 50 }}>
                                        <Text style={{ fontSize: 12, color: darkGray, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                            {this.state.bookingDetails.createdDate}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.chatView}
                            onPress={() => {
                                dispatchSelectedJobRequest({ employee_id: this.state.bookingDetails.employee_id });
                                this.props.navigation.navigate("ChatAfterBookingDetails", {
                                    'providerId': this.state.bookingDetails.employee_id,
                                    'providerName': this.state.bookingDetails.employee_details.username,
                                    'providerSurname': this.state.bookingDetails.employee_details.surname,
                                    'providerImage': this.state.bookingDetails.employee_details.image,
                                    'serviceName': this.state.bookingDetails.service_details.service_name,
                                    'orderId': this.state.bookingDetails.order_id,
                                    'pageTitle': "bookingDetails",
                                    'isJobAccepted': false,
                                })
                            }}>
                            <Image style={{ width: 20, height: 20, marginLeft: 20, tintColor: white }}
                                source={require('../../icons/chatting.png')} />
                            <Text style={{ color: white, fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                Chat history
                        </Text>
                            <Image style={{ width: 20, height: 20, marginLeft: 20, tintColor: white, position: "absolute", end: 0, marginRight: 15 }}
                                source={require('../../icons/right_arrow.png')} />
                        </TouchableOpacity>

                        <Modal transparent={true} visible={this.state.isDialogLogoutVisible} animationType='fade'
                            onRequestClose={() => this.changeDialogVisibility(false, "", "", "", "", "")}>
                            <ReviewDialogCustomer style={{
                                shadowColor: black, shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,
                            }}
                                changeDialogVisibility={this.changeDialogVisibility}
                                data={JSON.stringify(this.state.bookingDetails) + "//////" + this.state.customer_rating} />
                        </Modal>
                    </View>
                </ScrollView>
                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {
        dispatchSelectedJobRequest: job => {
            dispatch(setSelectedJobRequest(job));
        },
        fetchNotifications: data => {
            dispatch(startFetchingNotification(data));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withNavigation(BookingDetailsScreen));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    mainContainer: {
        width: screenWidth,
        backgroundColor: white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: white,
        borderRadius: 2,
        marginTop: 10
    },
    providerDetailContainer: {
        width: screenWidth,
        flexDirection: 'row',
        backgroundColor: white,
        padding: 10,
    },
    providerDetailsContainer: {
        width: screenWidth,
        flexDirection: 'row',
        backgroundColor: white,
        padding: 10,
    },
    chatView: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
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