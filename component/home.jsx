// Import necessary components from React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';

// Create your functional component
const Home = () => {
  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>
            <TouchableOpacity onPress={() => alert('Link Clicked!')}>
                <Text style={{ fontSize: 16, color: 'blue' }}>Business</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                    DALAI LLAMA
                </Text>
            </View>
            <View style={styles.rowItem1}>
                <View style={styles.searchBarFlex}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder=" Search..."
                    />
                </View>
                <View style={styles.searchButton}>
                    <TouchableOpacity style={styles.buttonContainer} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>
                
            </View>    
        </View>
        <View style={styles.rowContainer}>
            
            
        </View>

    </View>
  );
};

// Export the component
export default Home;
