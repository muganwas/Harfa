import { StyleSheet, Dimensions } from 'react-native';
import { lightGray } from '../../Constants/colors';
const screenWidth = Dimensions.get('window').width;

const style = StyleSheet.create({
    container: {
        flex: 1,
    },
    listView: {
        flex: 1,
        padding: 5,
    },
    footer: {
        width: screenWidth,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
    },
    text: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: lightGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
    },
    itemChatImageView: {
        width: 20,
        height: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRightChatContainer: {
        maxWidth: screenWidth / 2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
    },
    recievedContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    recievedMsgContainer: {
        margin: 3,
        flexDirection: 'column',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0, 0.5)'
    },
    recievedMsg: {
        flex: 1,
        color: "#ffffff",
        textAlign: 'left',
    },
    chatTime: {
        fontSize: 8,
        color: '#F3F3F3',
        fontWeight: '600'
    },
    chatUserIcon: { 
        width: 30, 
        height: 30, 
        borderRadius: 15, 
        alignItems: 'center' 
    },
    msgInfo: {
        flexDirection: 'row',
        width: 80,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    sentContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    sentMsgContainer: {
        margin: 2,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'flex-end',
        backgroundColor: '#407675'
    },
    sentMsg: {
        flex: 1,
        color: "#ffffff",
        textAlign: 'right',
    },
    messagesContainer: {
        height: '100%',
        minHeight: 100,
        padding: 10,
        height: 200
    },
    messagesSubContainer: {
        display: 'flex',
        flex: 1,
        paddingHorizontal: 10,
        width: '100%',
        flexDirection: "column"
    },
    loaderStyle: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default style;