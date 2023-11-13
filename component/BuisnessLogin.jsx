// Import necessary components from React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';

// Create your functional component
const BuisnessLogin = () => {
  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>

        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                    LOGIN
                </Text>
            </View>
            <View style={styles.rowItem1}>
                <View style={styles.LoginInput}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Email..."
                    />
                </View>
                <View style={styles.searchButton}>
                    <TouchableOpacity style={styles.LoginButton} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
                
            </View>    
        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem1}>
                <View style={styles.TextFlex}>
                        <Text>OR</Text>
                </View>
                <View style={styles.searchButton}>
                    <TouchableOpacity onPress={() => alert('Link Clicked!')}>
                        <Text style={{ fontSize: 16, color: 'blue' }}>SignUp</Text>
                    </TouchableOpacity>
            
                </View>
                
                
            </View>
        
        </View>

    </View>
  );
};

// Export the component
export default BuisnessLogin;
