import React, {useState} from 'react';
import {connect} from 'react-redux';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import _ from 'lodash';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import rNES from 'react-native-encrypted-storage';
import SimpleToast from 'react-native-simple-toast';
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
const Android = Platform.OS === 'android';

const ProMessagesComponent = ({
  senderId,
  receiverId,
  messagesInfo,
  uploadingImage,
}) => {
  const [downloading, updateDownloading] = useState({});
  const downloadFile = ({name, fileType, url, key, index}) => {
    let newDownloading = _.cloneDeep(downloading);
    let path = RNFS.DocumentDirectoryPath + '/' + name;
    let DownloadFileOptions = {
      fromUrl: url,
      toFile: path,
      //headers: Headers,
      background: true,
      cacheable: true,
      progressDivider: 1,
      discretionary: true,
      begin: res => {
        let {statusCode} = res;
        if (statusCode === 200) {
          let newDownloading = _.cloneDeep(downloading);
          if (newDownloading[key]) {
            newDownloading[key][index] = {
              percentage: 1,
              path,
              name,
            };
          } else {
            newDownloading[key] = {
              [index]: {
                percentage: 1,
                path,
                name,
              },
            };
          }
          updateDownloading(newDownloading);
        }
      },
      progress: prog => {
        let newDownloading = _.cloneDeep(downloading);
        let {bytesWritten, contentLength} = prog;
        let percentage = (bytesWritten / contentLength) * 100;
        if (newDownloading[key]) {
          if (newDownloading[key][index])
            newDownloading[key][index].percentage = percentage;
          else newDownloading[key][index] = {percentage, path, name};
        } else {
          newDownloading[key] = {
            [index]: {percentage, path, name},
          };
        }
        updateDownloading(newDownloading);
      },
    };
    if (
      !newDownloading[key] ||
      (newDownloading[key] && !newDownloading[key][index])
    ) {
      console.log('downloading file');
      RNFS.downloadFile(DownloadFileOptions)
        .promise.then(async () => {
          let newDownloading = _.cloneDeep(downloading);
          let newPath = !Android ? 'file:////' + path : path;
          /** Some small files don't record progress so manual progress update is required */
          if (newDownloading[key] && newDownloading[key][index]) {
            newDownloading[key][index].percentage = 100;
          }
          await rNES.getItem('downloadedFiles').then(async downloadedInfo => {
            if (!downloadedInfo) {
              let newDownloadedInfo = {
                name: newPath,
              };
              await rNES.setItem(
                'downloadedFiles',
                JSON.stringify(newDownloadedInfo),
              );
            } else {
              let newDownloadedInfo = JSON.parse(downloadedInfo);
              newDownloadedInfo[name] = newPath;
              await rNES.setItem(
                'downloadedFiles',
                JSON.stringify(newDownloadedInfo),
              );
              /** Open file for Android onlhy */
              Android
                ? RNFetchBlob.android.actionViewIntent(newPath, fileType)
                : null;
            }
          });
        })
        .catch(err => {
          console.log('download error', err);
          let newDownloading = _.cloneDeep(downloading);
          if (newDownloading[key]) {
            if (newDownloading[key][index]) delete newDownloading[key][index];
          }
          updateDownloading(newDownloading);
          SimpleToast.show(
            'Something went wrong with the download, try again later.',
            SimpleToast.SHORT,
          );
        });
    }
  };
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
            marginBottom: 50,
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
                  {usersMessages.map((messageInfo, index) => {
                    const {
                      sender,
                      local,
                      type,
                      notUploaded,
                      file,
                      message,
                      time,
                    } = messageInfo;
                    const file_name = file && file.name;
                    const ext = file && file.ext;
                    if (String(sender) === String(receiverId)) {
                      return (
                        <View key={index} style={style.recievedContainer}>
                          <View style={style.recievedMsgContainer}>
                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                            {(type === 'text' || !type) && (
                              <Text style={style.recievedMsg}>{message}</Text>
                            )}
                            {type === 'image' && (
                              <>
                                <TouchableOpacity
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    width: 100,
                                    marginHorizontal: 3,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  onPress={() => {
                                    if (
                                      downloading[key] &&
                                      downloading[key][index] &&
                                      downloading[key][index].percentage > 90
                                    )
                                      Android
                                        ? RNFetchBlob.android.actionViewIntent(
                                            downloading[key][index].path,
                                            file.fileType,
                                          )
                                        : null;
                                    else
                                      downloadFile({
                                        name: file_name,
                                        fileType: file.fileType,
                                        url: message,
                                        key,
                                        index,
                                      });
                                  }}>
                                  {renderIcon(ext, message)}
                                </TouchableOpacity>
                                {downloading[key] &&
                                  downloading[key][index] &&
                                  downloading[key][index].percentage > 0 &&
                                  downloading[key][index].percentage < 90 && (
                                    <View
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        width: 100,
                                        marginHorizontal: 3,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                      <ActivityIndicator
                                        color="white"
                                        size="small"
                                      />
                                    </View>
                                  )}
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
                        <View key={index} style={style.sentContainer}>
                          <View style={style.sentMsgContainer}>
                            <Text style={style.chatTime}>{chatDate(time)}</Text>
                            {(type === 'text' || !type) && (
                              <Text style={style.sentMsg}>{message}</Text>
                            )}
                            {type === 'image' && (
                              <>
                                {local && notUploaded && uploadingImage ? (
                                  <ActivityIndicator
                                    style={{height: 80}}
                                    color="red"
                                    size="large"
                                  />
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        width: 100,
                                        marginHorizontal: 3,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      onPress={() => {
                                        if (
                                          local ||
                                          (downloading[key] &&
                                            downloading[key][index] &&
                                            downloading[key][index].percentage >
                                              90)
                                        )
                                          Android
                                            ? RNFetchBlob.android.actionViewIntent(
                                                (downloading[key] &&
                                                  downloading[key][index]
                                                    .path) ||
                                                  file.path,
                                                file.fileType,
                                              )
                                            : null;
                                        else
                                          downloadFile({
                                            name: file_name,
                                            fileType: file.fileType,
                                            url: message,
                                            key,
                                            index,
                                          });
                                      }}>
                                      {renderIcon(ext, message)}
                                    </TouchableOpacity>
                                    {downloading[key] &&
                                      downloading[key][index] &&
                                      downloading[key][index].percentage > 0 &&
                                      downloading[key][index].percentage <
                                        90 && (
                                        <View
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            width: 100,
                                            marginHorizontal: 3,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}>
                                          <ActivityIndicator
                                            color="white"
                                            size="small"
                                          />
                                        </View>
                                      )}
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
