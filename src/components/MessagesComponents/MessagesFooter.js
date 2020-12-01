import React from 'react';
import { View, TouchableOpacity, TextInput, Image } from 'react-native';
import style from './styles';
import PropTypes from 'prop-types';


const MessagesFooter = ({ inputMesage, textChangeAction, sendMessageTask, showButton }) => {
    return (
        <>
            <View style={style.textInputContainer}>
                <TextInput style={style.textInput}
                    placeholder='Type message'
                    value={inputMesage}
                    multiline={true}
                    onChangeText={textChangeAction}>
                </TextInput>
                {showButton && <TouchableOpacity
                    style={style.sendButton}
                    onPress={sendMessageTask}>
                    <Image style={style.sendButtonImg}
                        source={require('../../images/png/paper-plane-thicc.png')}
                    />
                </TouchableOpacity>}
            </View>
        </>
    )
}

MessagesFooter.propTypes = {
    inputMesage: PropTypes.string,
    textChangeAction: PropTypes.func.isRequired,
    sendMessageTask: PropTypes.func.isRequired,
    showButton: PropTypes.bool.isRequired
}

export default MessagesFooter;