import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import PropTypes from 'prop-types';
import Availability from '../AvailabilityComponent';
import {colorPrimary, black} from '../../Constants/colors';

const MessagesHeader = ({
  receiverImage,
  receiverName,
  imageAvailable,
  handleBackButtonClick,
  online = false,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
        height: 50,
        backgroundColor: colorPrimary,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 5,
        paddingBottom: 5,
      }}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <TouchableOpacity
          style={{width: 20, height: 20, alignSelf: 'center'}}
          onPress={handleBackButtonClick}>
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

        <Image
          style={{
            width: 35,
            height: 35,
            borderRadius: 100,
            alignSelf: 'center',
            marginLeft: 20,
          }}
          source={
            imageAvailable
              ? {uri: receiverImage}
              : require('../../images/generic_avatar.png')
          }
        />
        <Text
          style={{
            color: black,
            fontSize: 16,
            fontWeight: 'bold',
            alignSelf: 'center',
            marginLeft: 15,
          }}>
          {receiverName}
        </Text>
      </View>
      <Availability online={online} />
    </View>
  );
};

MessagesHeader.propTypes = {
  handleBackButtonClick: PropTypes.func.isRequired,
  receiverName: PropTypes.string.isRequired,
  imageAvailable: PropTypes.bool.isRequired,
  receiverImage: PropTypes.string,
  online: PropTypes.bool.isRequired,
};

export default MessagesHeader;
