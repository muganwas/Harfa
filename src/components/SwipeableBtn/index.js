import React from 'react';
import {
    View,
    Text,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import PropTypes from 'prop-types';
import { font_size } from '../../Constants/metrics';
import { white, themeRed, colorGreen } from '../../Constants/colors';

class SwipeableBtn extends React.Component {
    constructor() {
        super();
        this.swipeable = null;
        this.state = {}
    }
    renderLeftActions = () => (
        <View
            style={{
                marginVertical: 5,
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingLeft: 10,
                backgroundColor: colorGreen,
                width: '100%'
            }}
        >
            <Text style={{ color: white, fontSize: font_size.sub_header, fontWeight: 'bold' }}>Read</Text>
        </View>
    )
    renderRightActions = () => (
        <View
            style={{
                marginVertical: 5,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingRight: 10,
                backgroundColor: themeRed,
                width: '100%'
            }}
        >
            <Text style={{ color: white, fontSize: font_size.sub_header, fontWeight: 'bold' }}>Delete</Text>
        </View>
    )
    render() {
        const { children, onSwipeableLeftOpen, onSwipeableRightOpen, renderLeftActions = this.renderLeftActions, renderRightActions = this.renderRightActions } = this.props;
        return (
            <>
                <Swipeable
                    ref={ref => this.swipeable = ref}
                    friction={2}
                    leftThreshold={80}
                    enableTrackpadTwoFingerGesture
                    rightThreshold={40}
                    renderLeftActions={renderLeftActions}
                    onSwipeableLeftOpen={() => {
                        onSwipeableLeftOpen();
                        this.swipeable.close();
                    }}
                    onSwipeableRightOpen={() => {
                        onSwipeableRightOpen();
                        this.swipeable.close();
                    }}
                    renderRightActions={renderRightActions}
                >
                    {children}
                </Swipeable>
            </>
        )
    }
}

SwipeableBtn.propTypes = {
    onSwipeableLeftOpen: PropTypes.func,
    onSwipeableRightOpen: PropTypes.func
}

export default SwipeableBtn;