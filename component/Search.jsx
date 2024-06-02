// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import {Platform,View, Text, TextInput, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Button, Linking,Modal, CheckBox,Image } from 'react-native';
import styles from '../styles';// Create your functional component
import { ScrollView } from 'react-native-web';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import {useSearchMutation} from './authApi';
import {useSelector} from "react-redux";
import {selectedLLm, selectUser} from "./authSlice";
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import Iframe from 'react-iframe'
import * as WebBrowser from 'expo-web-browser';

const Search = ({tool}) => {
  const user =  useSelector(selectUser);
  const llm =  useSelector(selectedLLm);
  const [searchQuery, setSearchQuery] = useState('');
  const [secondSearch, setSecondSearch] = useState(false);
  const [searchMutation, { data: searchData,isLoading :isSearchLoading, isError :isSearchError, isSuccess :isSearchSuccess, error :searchError }] = useSearchMutation();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!llm) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Select llm to proceed',
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'red',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },// Change the text color here
      });
    }
  }, [llm]);

  useEffect(() => {
    if (isSearchSuccess) {
      setSecondSearch(true);
    }
  }, [isSearchSuccess]);


  useEffect(() => {
    if (isSearchError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: {searchError},
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'gray',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
 
  }, [isSearchError]);

  const css = `
  body {
    color: #2a2a2a;
    font-family: sans-serif, Roboto, monospace;
  }
  img, figure {
    display: none;
  }
  h1 {
    border-bottom-width: 1px;
    border-color: #ccc;
    padding-bottom: 3px;
    border-bottom-style:solid;
    font-size: 1.6em;
    font-weight: bold;
    letter-spacing: .05em;
  }
  p {
    letter-spacing: .03em;
  }
`;
  const handleSearchPress =   () => {

    let userId = user.id;
    let llmId = llm.id;
    searchMutation({searchQuery,llmId,userId});
    // Add your custom logic for the cross button press
  };



  const handleSearchResultPress =   (url, index) => {

    let userId = user.id;
    let llmId = llm.id;
    console.log(url);
    setCurrentUrl(url);
    
    setCurrentIndex(index);
    Platform.OS === "web" ?  
       
       Linking.canOpenURL(url).then(() => {
        Linking.openURL(url);
    })
    : setModalVisible(true);  
    // Add your custom logic for the cross button press
  };

  const OrganicResults = ({ organicResults }) => {
    console.log(organicResults);
    return (
      <View>

      </View>
    );
  };
  return (
    // Main container with a gray background
    <View style={[styles.container]}>
      {!secondSearch && <View>
        <TextInput
            style={[styles.BlogTopicInputBox,{marginBottom:20,alignSelf:'center'}]}
            placeholder="Ask me any thing.."
            onChangeText={(text) => setSearchQuery(text)}
            maxLength={100}
        />

        <TouchableOpacity onPress={() => {handleSearchPress()}} style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'20%',alignSelf:'center' }}>
          <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Search</Text>
        </TouchableOpacity>
      </View>}

      
      {isSearchLoading &&  <ActivityIndicator color={'blue'} />}
      
      {isSearchSuccess &&
        <ScrollView   style={[styles.StructureContainer, {borderRadius:2,backgroundColor: '#d3d3d3'}]}>
          {console.log(searchData.subject)}
          { searchData.subject && <View><Text style={[{color: 'black',fontSize:30, fontWeight:'bold'}]}>{searchData.subject}</Text></View> }
          { searchData.topStories &&  searchData.topStories.map((result, index) => (
              <TouchableOpacity onPress={() => {handleSearchResultPress(result.link,index)}} style={[styles.resultContainer,{    borderColor: 'gray',borderWidth: 1, padding: 10, margin:10,borderRadius: 10, height: '20%', width:'50%',alignSelf:'flex-start'}]}>
                <View key={index} >
                  <Text style={[{color: 'black',fontSize:15}]}>{result.title}</Text>
                  {console.log(result.thumbnail)}
                    {result.thumbnail && (
                        
                      <Image source={{ uri: result.thumbnail }} style={styles.thumbnail} />
                    )}
                  <View style={[{flexDirection:'row'}]}>
                  
                    <Text style={[{color: 'black',fontSize:15}]}>{result.date}</Text>
                    <Text style={[{color: 'black',fontSize:15}]}>{result.snippet}</Text>
                  </View>

                </View>
              </TouchableOpacity>
            ))}
          { searchData.summary && <View><Text style={[{color: 'black',fontSize:15}]}>{searchData.summary}</Text></View> }
          <View>
            {searchData.organicResults.map((result, index) => (
              <TouchableOpacity onPress={() => {handleSearchResultPress(result.link,index)}} style={[styles.resultContainer,{    borderColor: 'gray',borderWidth: 1, padding: 10, margin:10,borderRadius: 10, height: '40%', width:'50%',alignSelf:'flex-start'}]}>
                <View key={index} >
                  
                  <Text style={[{color: 'black',fontSize:15}]}>{result.snippet}</Text>
                  {result.favicon && (
                    <Image source={{ uri: result.favicon }} style={styles.thumbnail} />
                  )}
                  <Text style={[{color: 'black',fontSize:15}]}>{result.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
        </ScrollView>
        
      }

          <Modal animationType="slide" presentationStyle={'overFullScreen'}
                                transparent={true} 
                                visible={modalVisible}
                                onRequestClose={() => {
                                  setModalVisible(false);
                                }} >
                                  <ScrollView  style={[styles.container,{height: 40, flex: 1,width:'50%',borderColor: 'gray',borderWidth: 1,padding:10,borderRadius: 10, alignContent:"center",alignSelf:'center'}]}>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{alignSelf:'center'}}>
                                      <MaterialIcons name="cancel" size={24} color="gray" />
                                    </TouchableOpacity>
                                    <WebView
      style={{ flex: 1,height: '100%', flex: 1,width:'100%' }}
      source={{ uri: {currentUrl} }}
    />
                                    
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{alignSelf:'center'}}>
                                      <AntDesign name="downcircleo" size={24} color="gray" />
                                    </TouchableOpacity>
                                  </ScrollView>
                                
            </Modal>

        {secondSearch && <View style={{flexDirection:'row', flexGrow:"1",alignContent:"center",alignItems:"center",justifyContent:"center"}}>
        <TextInput
            style={[{height: 40,width:'60%',borderColor: 'gray',borderWidth: 1,padding:10,borderTopLeftRadius: 10,borderBottomLeftRadius: 10, alignContent:"center",alignItems:"center"}]}
            placeholder="Ask me any thing.."
            onChangeText={(text) => setSearchQuery(text)}
            maxLength={100}
        />

        <TouchableOpacity onPress={() => {handleSearchPress1()}} style={{ backgroundColor: '#0092ca', padding: 10, borderTopRightRadius: 10,borderBottomRightRadius: 10, height: 40, width:'10%',alignSelf:'center' }}>
          <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Search</Text>
        </TouchableOpacity>
        </View>}      
    </View>
  );
};

// Export the component
export default Search;

