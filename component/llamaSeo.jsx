// Import necessary components from React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';

// Create your functional component
const llamaSeo = () => {
    

  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>
            <Text style={{ fontSize: 30, color: 'blue' }}>LLAMA - SEO</Text>
            <View style={styles.AddUrlFlex}>
                <TextInput
                        style={styles.AddUrl}
                        placeholder=" Add Url..."
                />
                <TouchableOpacity style={styles.AddUrlButton} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.AddUrlbuttonText}>Add Url</Text>
                </TouchableOpacity>
                
            </View>
        
        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem}>

                <View  style={styles.searchBarFlex}>
                    
                </View>
            </View>
            <View style={styles.rowItem1}>
                <View style={styles.searchBarFlex}>

                </View>
                <View style={styles.searchButton}>

                </View>
                
            </View>    
        </View>
        <View style={styles.rowContainer}>
            
            
        </View>

    </View>
  );
};

// Export the component
export default llamaSeo;
