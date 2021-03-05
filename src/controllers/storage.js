import {Platform} from 'react-native';
import storage from '@react-native-firebase/storage';

const attachmentsRef = storage().ref('/attachments');
const iOS = Platform.OS === 'ios';

export const uploadAttachment = async file => {
  const {path, uri, fileName} = file;
  const realPath = iOS ? uri : path;
  const fileRef = attachmentsRef.child(`/${fileName}`);
  let remotePath;
  await fileRef.putFile(realPath).then(async uploadRes => {
    const {state} = uploadRes;
    if (state === 'success') {
      await fileRef.getDownloadURL().then(urlResult => {
        remotePath = urlResult;
      });
    }
  });
  return remotePath;
};
