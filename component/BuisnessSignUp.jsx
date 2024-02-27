// Import necessary components from React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';

// Create your functional component
const BuisnessSignUp = ({navigation}) => {
  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>

        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                    SignUp
                </Text>
            </View>
            <View style={styles.rowItem1}>
                <View style={styles.LoginInput}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Email"
                    />
                </View>
                <View style={styles.searchButton}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Password"
                        secureTextEntry={true}
                    />
                </View>
                
            </View>    
        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem1}>
                <View style={styles.searchButton}>
                    <TouchableOpacity style={styles.LoginButton} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.buttonText}>SignUp</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.searchButton}>
                
            
                </View>
            </View>
        </View>
    </View>
  );
};

// Export the component
export default BuisnessSignUp;
