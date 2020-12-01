import React from 'react';
import { connect } from 'react-redux';
import { View, Text, Dimensions } from 'react-native';
import { chatDate } from '../../misc/helpers';
import style from './styles';
import PropTypes from 'prop-types';

const screenWidth = Dimensions.get('window').width;

const ProMessagesComponent = ({ senderId, receiverId, messagesInfo }) => {
    const renderMessages = () => {
        const { messages } = messagesInfo;
        if (senderId && receiverId) {
            return (
                <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                    {
                        Object.keys(messages).map(key => {
                            const usersMessages = messages[key];
                            // display messages from selected user
                            if (String(key) === String(receiverId)) {
                                return <View key={key} style={style.messagesSubContainer}>
                                    {
                                        Object.keys(usersMessages).map(key => {
                                            const sender = usersMessages[key].sender;
                                            const message = usersMessages[key].message;
                                            const time = usersMessages[key].time;
                                            if (String(sender) === String(receiverId)) {
                                                return (
                                                    <View key={key} style={style.recievedContainer}>
                                                        <View style={style.recievedMsgContainer}>
                                                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                                                            <Text style={style.recievedMsg}>{message}</Text>
                                                        </View>
                                                    </View>
                                                )
                                            }
                                            else if (String(sender) === String(senderId)) {
                                                return (
                                                    <View key={key} style={style.sentContainer}>
                                                        <View style={style.sentMsgContainer}>
                                                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                                                            <Text style={style.sentMsg}>{message}</Text>
                                                        </View>
                                                    </View>
                                                )
                                            }
                                            else return;
                                        })
                                    }
                                </View>
                            }
                        })
                    }
                </View>
            )
        }

    }
    return (
        <View style={style.listView}>
            {renderMessages()}
        </View>
    )
}

ProMessagesComponent.propTypes = {
    senderId: PropTypes.string.isRequired,
    receiverId: PropTypes.string.isRequired,
    messagesInfo: PropTypes.object
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        jobsInfo: state.jobsInfo,
        messagesInfo: state.messagesInfo,
        generalInfo: state.generalInfo,
        userInfo: state.userInfo
    }
}

const mapDispatchToProps = dispatch => {
    return {}
}

const ProMessagesComponentContainter = connect(mapStateToProps, mapDispatchToProps)(ProMessagesComponent);
export default ProMessagesComponentContainter;