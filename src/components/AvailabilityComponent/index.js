import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { colorRed, colorGreen, black } from '../../Constants/colors';
import styles from './styles';
const AvailabilityComponent = ({ online }) => {
    return (
        <View style={styles.onlineOfflineView}>
            <View style={[styles.onlineOfflineDisplay, { backgroundColor: online ? colorGreen : colorRed }]} />
            <Text style={{ color: black, }}>
                {online ? "Online" : "Offline"}
            </Text>
        </View>
    )
}

AvailabilityComponent.propTypes = {
    online: PropTypes.bool.isRequired
}

export default AvailabilityComponent;