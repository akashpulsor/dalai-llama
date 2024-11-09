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
import { validatePassword } from '../helper/password-validator';

const NewPassword = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({
      password: '',
      confirmPassword: '',
    });
  
    const validateForm = () => {
            let isValid = true;
            const newErrors = {
                password: '',
                confirmPassword: '',
            };
        
            // Validate password security using your util function
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                newErrors.password = passwordValidation.message;
                isValid = false;
            }
        
            // Check if passwords match
            if (password !== confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
                isValid = false;
            }
        
            // Check if fields are empty
            if (!password) {
                newErrors.password = 'Password is required';
                isValid = false;
            }
        
            if (!confirmPassword) {
                newErrors.confirmPassword = 'Confirm password is required';
                isValid = false;
            }
        
            setErrors(newErrors);
            return isValid;
    };
  
    const onChangePasswordPress = async () => {
      if (validateForm()) {
        try {
          // TODO: Call your API here
          // const response = await sendCodeApi(password);
          // if (response.success) {
          onClose(false);
          // }
        } catch (error) {
          setErrors({
            ...errors,
            password: 'Failed to change password. Please try again.',
          });
        }
      }
    };
  
    return (
      <View style={styles.slideContent}>
        <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setErrors({ ...errors, password: '' });
                    }}
                    placeholder="New Password"
                    secureTextEntry
                />
                <View style={styles.errorContainer}>
                        {errors.password ? (
                        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.errorText}>
                                        {errors.password.split(' ').reduce((acc, word, index) => {
                // Add a new line after every 3 words
                if (index > 0 && index % 3 === 0) {
                    return acc + '\n' + word;
                }
                return index === 0 ? word : acc + ' ' + word;
            }, '')}
                        </Text>
                            ) : (
                                <View style={styles.errorPlaceholder} />
                        )}
                </View>
        </View>


        <View style={styles.inputContainer}>
            <TextInput
                style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError
                ]}
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors({ ...errors, confirmPassword: '' });
                }}
                placeholder="Confirm Password"
                secureTextEntry
            />
         <View style={styles.errorContainer}>
            {errors.confirmPassword ? (
                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.errorText}>
                {errors.confirmPassword}
                </Text>
            ) : (
                <View style={styles.errorPlaceholder} />
            )}
            </View>
        </View>
  
        <Button mode="contained" onPress={onChangePasswordPress}>
          Change Password
        </Button>
      </View>
    );
  };
  

NewPassword.propTypes = {
    onClose: PropTypes.func.isRequired,
    //onError: PropTypes.func.isRequired,
};

export default NewPassword;



const styles = StyleSheet.create({
    slideContent: {
      flex: 1,  
      justifyContent:'center',
      alignItems:'center',
    },
    inputContainer: {
      marginBottom: 8,
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
        marginBottom: 5,
        fontSize: 16,
    },
    inputError: {

      borderColor: 'red',
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

    },
    errorPlaceholder: {
      height: 16, // Maintains consistent spacing when no error
    }
  });