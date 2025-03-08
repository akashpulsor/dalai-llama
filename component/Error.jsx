import React, { useState, useRef, useEffect, Platform } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';  // Add this import


const Error = ({ errorText }) => {
    return (
        <View style={styles.errorContainer}>
            {errorText ? (
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.errorText}>
                            {errorText.split(' ').reduce((acc, word, index) => {
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
    );
}


Error.propTypes = {
    errorText: PropTypes.string.isRequired,
};

export default Error;

const styles = StyleSheet.create({
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