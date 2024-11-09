import React, { useState, useRef, useEffect, Platform } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import PropTypes from 'prop-types';  // Add this import
import Button from './Button';

const ResetPassword = ({ onClose, verifyCodeModal }) => {
    const [email, setEmail] = useState('');
    const onSendCodePress = () => {
        //TODO call send Code Api and send to entered email 
        // in case of positive response send a variable to close  
        onClose(false);
        verifyCodeModal(true);
    }

    return (
        <View style={styles.slideContent}>
              <TextInput
                    style={[styles.input]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Registerd Email"
                />

            <Button mode="contained" onPress={onSendCodePress}>
                        Send Code
            </Button>
        </View>
      )
    
}

ResetPassword.propTypes = {
    onClose: PropTypes.func.isRequired,
    verifyCode: PropTypes.func.isRequired
    //onError: PropTypes.func.isRequired,
};

export default ResetPassword;



const styles = StyleSheet.create({
    slideContent: {
      flex: 1,
                            
      justifyContent:'center',
      alignItems:'center',
  
  
    },
    input: {
      width:'150%',
      borderWidth: 1,
      marginTop:15,
      borderColor: 'white',
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      fontSize: 16,
    }
  });