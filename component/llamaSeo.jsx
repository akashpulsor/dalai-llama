// Import necessary components from React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import styles from '../styles';// Create your functional component

const llamaSeo = () => {
    const [data, setData] = useState([]);
    const [url, setUrl] = useState('');
    const [urlValidationFailed, setUrlValidationFailed] = useState(false);    
    const [foldableViewOpen, setFoldableViewOpen] = useState(false);

    useEffect(() => {
      // Fetch data from the web
      const fetchData = async () => {
        try {
          const response = await fetch('https://ce8ad948-5e94-44f9-b8e1-200cf0387b00.mock.pstmn.io/seo');
          const jsonData = await response.json();
          console.log(jsonData)
          setData(jsonData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }});

      const handleAddUrl = () => {
        if (url.trim() !== '') {
          if(isValidHttpUrl(url)){
            setData((prevList) => [{'url':url},...prevList]);
            setUrl(''); // Clear the input after adding to the list
            setUrlValidationFailed(false);
            console.log(data)
          }
          else {
            setUrlValidationFailed(true);
          }    

        }
      };

      function isValidHttpUrl(s) {
        let url;
        try {
        url = new URL(s);
        } catch (e) { return false; }
        return /https?/.test(url.protocol);
      }
    
    const renderCard = ({ item }) => (
        <View>
            <View style={styles.AddUrlRow}>
                <Text style={styles.AddUrlText}> {item.url} </Text>
                <TouchableOpacity style={styles.AddUrlButton} onPress={() => setFoldableViewOpen(!foldableViewOpen)}>
                        <Text style={styles.AddUrlbuttonText}>SEO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.AddUrlButton} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.AddUrlbuttonText}>SAVE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.AddUrlButton} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.AddUrlbuttonText}>PUBLISH</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.SeoContentFlex}>
                    {/* Foldable View */}
                {foldableViewOpen && (
                    <View style={styles.foldableView}>
                        {/* Your content for the foldable view */}
                        <Text>This is the foldable view content.</Text>
                    </View>
                )}
            </View>
        </View>

    );  

  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>
            <Text style={{ fontSize: 30, color: 'blue' }}>LLAMA - SEO</Text>
            <View style={styles.AddUrlFlex}>
                <TextInput
                        style={styles.AddUrl}
                        placeholder=" Add Url..."
                        onChangeText={(text) => setUrl(text)}
                />
        
                <TouchableOpacity style={styles.AddUrlButton} onPress={() => handleAddUrl()}>
                        <Text style={styles.AddUrlbuttonText}>Add Url</Text>
                </TouchableOpacity>
                                
            </View>
            {urlValidationFailed && (
                <View style={styles.errorViewFlex}>
                    <Text style={styles.errorText}>URL validation failed. Please enter a valid URL.</Text>
                </View>
        )}
        </View>
        
        <View style={styles.rowContainer}>
            <View style={styles.AddUrlList}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.url}
                    renderItem={renderCard}
                />
            </View>
    
        </View>
        <View style={styles.rowContainer}>
            
            
        </View>

    </View>
  );
};

// Export the component
export default llamaSeo;
