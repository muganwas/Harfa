import Toast from 'react-native-simple-toast';
import Axios from 'axios';
import Config from '../../components/Config';
import {
  FETCHING_MESSAGES,
  FETCHED_MESSAGES,
  FETCHING_MESSAGES_ERROR,
  FETCHED_DB_MESSAGES,
} from '../types';

const FETCH_MESSAGES = Config.baseURL + 'chat/fetchChats';

export const startFetchingMessages = payload => {
  return {
    type: FETCHING_MESSAGES,
    payload,
  };
};

export const messagesFetched = payload => {
  return {
    type: FETCHED_MESSAGES,
    payload,
  };
};

export const dbMessagesFetched = payload => {
  return {
    type: FETCHED_DB_MESSAGES,
    payload,
  };
};

export const messagesError = payload => {
  return {
    type: FETCHING_MESSAGES_ERROR,
    payload,
  };
};

export const fetchEmployeeMessages = ({receiverId}) => {
  return async dispatch => {
    try {
      await Axios.get(
        FETCH_MESSAGES + '?sender=' + receiverId + '&userType=employee',
      )
        .then(async results => {
          const {data} = results;
          let messages = {};
          let otherUsers = {};
          // get ids of other users this user has chatted with
          if (!data.message) {
            await data.map(msgObj => {
              const {sender, recipient} = msgObj;
              if (sender !== receiverId) otherUsers[sender] = sender;
              else if (recipient !== receiverId)
                otherUsers[recipient] = recipient;
            });
            // if any user, seperate the different groups of messages
            if (Object.keys(otherUsers).length > 0) {
              await Object.keys(otherUsers).map(async otherUser => {
                const thisUsersMessages = [];
                await data.map(msgObj => {
                  const {sender, recipient} = msgObj;
                  if (otherUser === sender || otherUser === recipient)
                    thisUsersMessages.push(msgObj);
                });
                if (thisUsersMessages.length > 0)
                  messages[otherUser] = thisUsersMessages;
              });
            }
            dispatch(dbMessagesFetched(messages));
          } else {
            Toast.show('Something went wrong, please reload app');
          }
        })
        .catch(e => {
          console.log('mongo messages error', e);
          dispatch(messagesError(e.message));
        });
    } catch (e) {
      console.log('mongo messages error', e);
      dispatch(messagesError(e.message));
    }
  };
};
