// Import necessary components from React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import styles from '../styles';// Create your functional component
import { ScrollView } from 'react-native-web';

import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { BASE_URL } from '../Constants';

const llamaContent = () => {
  const [data, setData] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [urlValidationFailed, setUrlValidationFailed] = useState(false);
  const [foldableViewOpen, setFoldableViewOpen] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [tagCloudViewOpen, setTagCloudViewOpen] = useState(false);



  const seo = async (data) => {
    try {
      let temp = JSON.stringify(data)
      console.log("POST DATA IS" + temp);
      let headers = {
        'Content-Type': 'application/json;charset=UTF-8',

        "Accept": "*/*"
      };

      setSpinner(true);
      let res = await axios
        .post(BASE_URL + "/content", data, { "headers": headers });
      if (res.status == 200) {
        // test for status you want, etc
        console.log(res.status)
      }
      setSpinner(false);
      // Don't forget to return something
      //console.log(res.data.keywords)
      return res.data.keywords
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setSpinner(false);
    }
  }


  const handleAddUrl = () => {
    if (url.trim() !== '') {
      if (isValidHttpUrl(url)) {
        setData((prevList) => [{ 'url': url }, ...prevList]);
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

  const renderKeywords = () => {

    const uniqueData = [...new Set(data)];

    return (
      <View style={styles.keyWordButtonFlex}>

        <FlatList
          data={uniqueData}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          //horizontal={true}
          showsHorizontalScrollIndicator={false}

        />
        <View style={styles.rowContainer}>

          <TouchableOpacity style={styles.ContentButton} onPress={() => alert('Button Pressed')}>
            <Text style={styles.ContentButtonText}>competitor Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  const renderItem = ({ item }) => (

    <View style={{ margin: 5 }}>
      <TouchableOpacity
        style={styles.keyWordButton}
        onPress={() => onDeleteItem(item)}
      >
        <Ionicons name="ios-close-circle" size={24} color="red" style={{ marginRight: 5 }} />

        <Text style={{ fontSize: 20, color: 'blue' }}>{item}</Text>
      </TouchableOpacity>
    </View>

  );


  const onDeleteItem = (itemToRemove) => {
    // Logic to remove item from the data array
    // Call a state update to trigger a re-render
  };

  const getRandomColor = () => {
    // Generate a random color in hex format
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  };
  
  const TagCloud = ({ onTagPress, onCrossPress }) => {
    const uniqueData = [...new Set(data)];

    return (
      <View style={styles.tagCloudContainer}>
        <TouchableOpacity onPress={onCrossPress} style={styles.crossButton}>
             <Ionicons name="ios-close-circle" size={34} color="red" style={{ marginRight: 5 }} />
        </TouchableOpacity>
        {uniqueData.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onTagPress(tag)}
            style={{ ...styles.tagContainer, backgroundColor: getRandomColor() }}
          >
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))
        }
        {
          setTagCloudViewOpen(true)
        }
      </View>
      
    );
  };

  const handleTagPress = (tag) => {
    console.log(`Tag pressed: ${tag}`);
    // Add your custom logic when a tag is pressed
  };

  const handleCrossPress = () => {
    console.log('Cross button pressed');
    // Add your custom logic for the cross button press
  };

  return (
    // Main container with a gray background
    <ScrollView style={styles.container}>
      <Text style={{ fontSize: 30, color: 'blue' }}>LLAMA - CONTENT</Text>

      <View style={styles.rowContainer}>
        <View style={styles.Title}>
          <TextInput
            style={styles.TitleInputBox}
            placeholder=" Title"
            onChangeText={(text) => setTitle(text)}
          />
          <TextInput
            style={styles.TitleBodyBox}
            placeholder=" Body"
            onChangeText={(text) => setBody(text)}
            multiline
          />

          <View style={styles.ContentButtonFlex}>
            <TouchableOpacity style={styles.ContentButton}

              onPress={() => {
                setFoldableViewOpen(!foldableViewOpen);
                //prev => new Map([...prev, [selectedLanguage, data]])
                seo({ "title": title, "body": body }).then(res => { setData((prevList) => [...res, ...prevList]); })
              }}>
              <Text style={styles.ContentButtonText}>SEO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ContentButton} onPress={() => alert('Button Pressed')}>
              <Text style={styles.ContentButtonText}>SAVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ContentButton} onPress={() => alert('Button Pressed')}>
              <Text style={styles.ContentButtonText}>PUBLISH</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {foldableViewOpen && (

        <View style={styles.foldableView}>
          {/* Your content for the foldable view */}
          {spinner ? <ActivityIndicator color={'blue'} /> :

            <TagCloud onTagPress={handleTagPress} onCrossPress={handleCrossPress} />
            
          }
        </View>
      )}

      {
          tagCloudViewOpen && (
              <View  style={styles.tagCloudContainer}>
                  <TouchableOpacity style={styles.tagContainer} onPress={() => alert('Button Pressed')}>
                        <Text style={styles.tagText}>Competitor Analysis</Text>
                  </TouchableOpacity>
              </View>
          )        
      }
    </ScrollView>
  );
};

// Export the component
export default llamaContent;
