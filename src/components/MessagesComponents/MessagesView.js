import React from 'react';
import {connect} from 'react-redux';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {chatDate} from '../../misc/helpers';
import XlsIcon from '../../images/svg/xls.svg';
import PdfIcon from '../../images/svg/pdf.svg';
import GenericDocIcon from '../../images/svg/other.svg';
import DocIcon from '../../images/svg/doc.svg';
import DocXIcon from '../../images/svg/docx.svg';
import MovIcon from '../../images/svg/mov.svg';
import Mp4Icon from '../../images/svg/mp4.svg';
import PptIcon from '../../images/svg/ppt.svg';
import TiffIcon from '../../images/svg/tiff.svg';
import TextIcon from '../../images/svg/txt.svg';
import ZipIcon from '../../images/svg/zip.svg';
import style from './styles';
import PropTypes from 'prop-types';

const screenWidth = Dimensions.get('window').width;

const ProMessagesComponent = ({
  senderId,
  receiverId,
  messagesInfo,
  uploadingImage,
}) => {
  const downloadFile = () => {};
  const renderIcon = (ext, message) => {
    return (
      <>
        {ext === 'pdf' ? (
          <PdfIcon fill={'white'} />
        ) : ext === 'doc' ? (
          ext === 'docx' ? (
            <DocXIcon fill={'white'} />
          ) : ext === 'txt' || ext === 'rtf' ? (
            <TextIcon fill={'white'} />
          ) : (
            <DocIcon fill={'white'} />
          )
        ) : ext === 'xls' ? (
          <XlsIcon fill={'white'} />
        ) : ext === 'zip' || ext === 'rar' ? (
          <ZipIcon fill={'white'} />
        ) : ext === 'MP4' ? (
          <Mp4Icon fill={'white'} />
        ) : ext === 'MOV' ? (
          <MovIcon fill={'white'} />
        ) : ext === 'ppt' || ext === 'pptx' ? (
          <PptIcon fill={'white'} />
        ) : ext === 'tif' || ext == 'tiff' ? (
          <TiffIcon fill={'white'} />
        ) : ext === 'jpg' || ext === 'png' || ext === 'gif' ? (
          <Image
            source={{
              uri: message,
            }}
            style={{width: 100, height: 100}}
            resizeMode={'contain'}
          />
        ) : (
          <GenericDocIcon fill={'white'} />
        )}
      </>
    );
  };
  const renderMessages = () => {
    const {messages} = messagesInfo;
    if (senderId && receiverId) {
      return (
        <View
          style={{
            width: screenWidth,
            marginBottom: 80,
            flex: 1,
            alignContent: 'flex-start',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}>
          {Object.keys(messages).map(key => {
            const usersMessages = messages[key];
            // display messages from selected user
            if (String(key) === String(receiverId)) {
              return (
                <View key={key} style={style.messagesSubContainer}>
                  {Object.keys(usersMessages).map(key => {
                    const sender = usersMessages[key].sender;
                    const local = usersMessages[key].local;
                    const type = usersMessages[key].type;
                    const file = usersMessages[key].file;
                    const file_name = file && file.name;
                    const ext = file && file.ext;
                    const message = usersMessages[key].message;
                    const time = usersMessages[key].time;
                    if (String(sender) === String(receiverId)) {
                      return (
                        <View key={key} style={style.recievedContainer}>
                          <View style={style.recievedMsgContainer}>
                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                            {(type === 'text' || !type) && (
                              <Text style={style.recievedMsg}>{message}</Text>
                            )}
                            {type === 'image' && (
                              <>
                                <TouchableOpacity onPress={downloadFile}>
                                  {renderIcon(ext, message)}
                                </TouchableOpacity>
                                {file_name && (
                                  <Text style={style.recievedMsg}>
                                    {file_name.length > 10
                                      ? file_name.substring(0, 10) + '..' + ext
                                      : file_name}
                                  </Text>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      );
                    } else if (String(sender) === String(senderId)) {
                      return (
                        <View key={key} style={style.sentContainer}>
                          <View style={style.sentMsgContainer}>
                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                            {(type === 'text' || !type) && (
                              <Text style={style.sentMsg}>{message}</Text>
                            )}
                            {type === 'image' && (
                              <>
                                {local && uploadingImage ? (
                                  <ActivityIndicator
                                    style={{height: 80}}
                                    color="red"
                                    size="large"
                                  />
                                ) : (
                                  <>
                                    <TouchableOpacity onPress={downloadFile}>
                                      {renderIcon(ext, message)}
                                    </TouchableOpacity>
                                    {file_name && (
                                      <Text style={style.sentMsg}>
                                        {file_name.length > 10
                                          ? file_name.substring(0, 10) +
                                            '..' +
                                            ext
                                          : file_name}
                                      </Text>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      );
                    } else return;
                  })}
                </View>
              );
            }
          })}
        </View>
      );
    }
  };
  return <View style={style.listView}>{renderMessages()}</View>;
};

ProMessagesComponent.propTypes = {
  senderId: PropTypes.string.isRequired,
  receiverId: PropTypes.string.isRequired,
  messagesInfo: PropTypes.object,
  uploadingImage: PropTypes.bool,
};

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    messagesInfo: state.messagesInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo,
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ProMessagesComponentContainter = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProMessagesComponent);
export default ProMessagesComponentContainter;
