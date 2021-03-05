import React, {useState} from 'react';
import {View, TouchableOpacity, TextInput, Image} from 'react-native';
import style from './styles';
import PropTypes from 'prop-types';

const MessagesFooter = ({
  inputMesage,
  textChangeAction,
  sendMessageTask,
  attachFileTask,
  showButton,
}) => {
  const [inputHeight, updateInputHeight] = useState();
  return (
    <>
      <View style={style.textInputContainer}>
        <TouchableOpacity style={style.attachFile} onPress={attachFileTask}>
          <Image
            style={style.sendButtonImg}
            source={require('../../images/png/attachment.png')}
          />
        </TouchableOpacity>
        <TextInput
          style={[style.textInput, {height: inputHeight}]}
          placeholder="Type message"
          value={inputMesage}
          multiline={true}
          onChangeText={textChangeAction}
          onContentSizeChange={event => {
            updateInputHeight(event.nativeEvent.contentSize.height);
          }}
        />
        {showButton && (
          <TouchableOpacity
            style={style.sendButton}
            onPress={() => sendMessageTask('text')}>
            <Image
              style={style.sendButtonImg}
              source={require('../../images/png/paper-plane-thicc.png')}
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

MessagesFooter.propTypes = {
  inputMesage: PropTypes.string,
  textChangeAction: PropTypes.func.isRequired,
  sendMessageTask: PropTypes.func.isRequired,
  attachFileTask: PropTypes.func.isRequired,
  showButton: PropTypes.bool.isRequired,
};

export default MessagesFooter;
