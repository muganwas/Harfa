import React, {Component} from 'react';
import {Dimensions} from 'react-native';
import {connect} from 'react-redux';
import RNExitApp from 'react-native-exit-app';
import firebaseAuth from '@react-native-firebase/auth';
import rNES from 'react-native-encrypted-storage';
import DialogComponent from '../DialogComponent';
import {resetUserDetails} from '../../Redux/Actions/userActions';
import Config from '../Config';

class DialogLogout extends Component {
  constructor(props) {
    super();
    this.state = {
      width: Dimensions.get('window').width,
    };
    Dimensions.addEventListener('change', e => {
      this.setState(e.window);
    });
  }

  closeDialogLogout = async action => {
    const {resetUserDetails, changeDialogVisibility} = this.props;
    if (action == 'Ok') {
      if (firebaseAuth().currentUser) firebaseAuth().signOut();
      await rNES.removeItem('userId');
      await rNES.removeItem('auth');
      await rNES.removeItem('firebaseId');
      await rNES.removeItem('email');
      await rNES.removeItem('userType');
      resetUserDetails();
      Config.socket.close();
      changeDialogVisibility(false);
      RNExitApp.exitApp();
    } else if (action == 'Cancel') {
      console.log('Logout Cancel');
    }
    changeDialogVisibility(false);
  };

  render() {
    return (
      <>
        <DialogComponent
          transparent={true}
          isDialogVisible={this.props.isDialogLogoutVisible}
          animation="fade"
          width={this.state.width - 80}
          changeDialogVisibility={this.props.changeDialogVisibility}
          leftButtonAction={() => this.closeDialogLogout('Cancel')}
          rightButtonAction={() => this.closeDialogLogout('Ok')}
          isLoading={false}
          titleText="Logout!"
          descText="Are you sure you want to log out?"
          leftButtonText="Cancel"
          rightButtonText="Ok"
        />
      </>
    );
  }
}

const mapStateToProps = state => ({
  userInfo: state.userInfo,
});
const mapDispatchToProps = dispatch => ({
  resetUserDetails: () => {
    dispatch(resetUserDetails());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DialogLogout);
