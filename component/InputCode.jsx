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

const InputCode = ({ onClose, showNewPasswordModal}) => {
    const [code, setCode] = useState('');
    const onSendCodePress = () => {
        //TODO call send Code Api and send to entered email 
        // in case of positive response send a variable to close  
        onClose(false);
        showNewPasswordModal(true);
    }

    return (
        <View style={styles.slideContent}>
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
    }
  });