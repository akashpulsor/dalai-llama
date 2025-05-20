import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';

import { useVerificationCodeMutation } from './authApi';
import { emailValidator } from '../helper/emailValidator';

const ResetPassword = ({ onClose, verificationEmail, verifyCodeModal }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sendVerificationCode, { isLoading, isSuccess, isError, error }] = useVerificationCodeMutation();

  useEffect(() => {
    if (isLoading) {
      setShowError(false);
      setErrorMessage('');
    } else if (isSuccess) {
      onClose(false);
      verifyCodeModal(true);
      verificationEmail(email);
    } else if (isError) {
      setShowError(true);
      setErrorMessage(error?.data?.message || 'Please try again after sometime.');
    }
  }, [isLoading, isSuccess, isError, onClose, verifyCodeModal, verificationEmail, email, error]);

  const onSendCodePress = async () => {
    let validEmail = emailValidator(email);
    if (validEmail === '') {
      setEmailError('');
              let body = {
                "email": email,
        }
        body = JSON.stringify(body);  
        console.log("temp" + body);
      await sendVerificationCode(body);
    } else {
      setEmailError(validEmail);
    }
  };

  return (
    <View style={styles.slideContent}>
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        value={email}
        onChangeText={setEmail}
        placeholder="Registered Email"
        editable={!isLoading}
      />
      {emailError ? (
        <Text style={styles.errorText}>
          {emailError.split(' ').reduce((acc, word, index) => {
            if (index > 0 && index % 3 === 0) {
              acc.push(<Text key={index}>{`${word} `}</Text>);
            } else {
              acc.push(<Text key={index}>{`${word} `}</Text>);
            }
            return acc;
          }, [])}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <Button mode="contained" onPress={onSendCodePress} disabled={isLoading}>
          Send Code
        </Button>
      )}

      {showError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {errorMessage.split(' ').reduce((acc, word, index) => {
              if (index > 0 && index % 3 === 0) {
                acc.push(<Text key={index}>{`${word} `}</Text>);
              } else {
                acc.push(<Text key={index}>{`${word} `}</Text>);
              }
              return acc;
            }, [])}
          </Text>
        </View>
      )}
    </View>
  );
};

ResetPassword.propTypes = {
  onClose: PropTypes.func.isRequired,
  verificationEmail: PropTypes.func.isRequired,
  verifyCode: PropTypes.func.isRequired,
};

export default ResetPassword;

const styles = StyleSheet.create({
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '150%',
    borderWidth: 1.5, // make border more visible
    marginTop: 15,
    borderColor: '#8e24aa', // purple border for focus/clarity
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  errorContainer: {
    marginVertical: 20,
  },
});