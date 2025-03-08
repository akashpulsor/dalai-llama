import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { useValidateCodeMutation } from './authApi';

const InputCode = ({ onClose, verificationEmail, showNewPasswordModal }) => {
  const [code, setCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showError, setShowError] = useState(false);

  const [validateCode, { isLoading, isSuccess, isError, error }] = useValidateCodeMutation();

  useEffect(() => {
    if (isLoading) {
      setShowError(false);
      setVerificationError('');
    } else if (isSuccess) {
      onClose(false);
      showNewPasswordModal(true);
    } else if (isError) {
      setShowError(true);
      setVerificationError(error?.data?.message || 'An error occurred while validating the code. Please try again.');
    }
  }, [isLoading, isSuccess, isError, onClose, showNewPasswordModal, error]);

  const onSendCodePress = async () => {
    try {
      await validateCode({ code, verificationEmail });
    } catch (e) {
      setShowError(true);
      setVerificationError('An error occurred while validating the code. Please try again.');
    }
  };

  return (
    <View style={styles.slideContent}>
      {showError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {verificationError.split(' ').reduce((acc, word, index) => {
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
      <TextInput
        style={[styles.input]}
        value={code}
        onChangeText={setCode}
        placeholder="Input Code"
        editable={!isLoading}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <Button mode="contained" onPress={onSendCodePress} disabled={isLoading}>
          Verify Code
        </Button>
      )}
    </View>
  );
};

InputCode.propTypes = {
  onClose: PropTypes.func.isRequired,
  verificationEmail: PropTypes.string.isRequired,
  showNewPasswordModal: PropTypes.func.isRequired,
};

export default InputCode;

const styles = StyleSheet.create({
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '150%',
    borderWidth: 1,
    marginTop: 15,
    borderColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  errorContainer: {
    height: 'auto',
    justifyContent: 'center',
    width: '80%',
    paddingHorizontal: 0,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 10,
    lineHeight: 12,
    flexWrap: 'wrap',
    textAlign: 'left',
    flexDirection: 'row',
    display: 'flex',
    wordBreak: 'break-word',
  },
  loadingContainer: {
    marginVertical: 20,
  },
});