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
import { useVerificationCodeMutation } from './authApi';

const InputCode = ({ onClose, showNewPasswordModal}) => {
    const [code, setCode] = useState('');
    //[sendCode, ]
    const [addVerificationCode, { data: verificationData, isVerificationLoading, isVerificationSuccess, isVerificationError, verificationError }] = useVerificationCodeMutation();
    const onSendCodePress = () => {
        //TODO call send Code Api and send to entered email 
        // in case of positive response send a variable to close  
        getVerificationCode();
        onClose(false);
        showNewPasswordModal(true);
    }

    return (
        <View style={styles.slideContent}>
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}> {verificationError}</Text>
              </View>
              <TextInput
                    style={[styles.input]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="Input Code"
                />

            <Button mode="contained" onPress={onSendCodePress}>
                        Verify Code
            </Button>
        </View>
      )
    
}

InputCode.propTypes = {
    onClose: PropTypes.func.isRequired,
    showNewPasswordModal:  PropTypes.func.isRequired,
    //onError: PropTypes.func.isRequired,
};

export default InputCode;



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
    },
    errorContainer: {
      height: 35, // Fixed height for error container
      justifyContent: 'center',
      width:'80%',
      paddingHorizontal: 0,

    },
    errorText: {
        color: '#FF3B30',
        fontSize: 10,
        lineHeight: 12,
        flexWrap: 'wrap', // Enable text wrapping
        textAlign: 'left',
        flexDirection: 'row',
        display: 'flex',
        wordBreak: 'break-word', // Align text to left

    }
  });