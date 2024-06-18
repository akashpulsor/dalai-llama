// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import {Platform,View, Text, TextInput,TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Button, Linking,Modal, CheckBox,Image } from 'react-native';
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
import FontAwesome from '@expo/vector-icons/FontAwesome';
const SearchV2 = ({tool}) => {
  const user =  useSelector(selectUser);
  const llm =  useSelector(selectedLLm);
  const [searchQuery, setSearchQuery] = useState('');
  const [secondSearch, setSecondSearch] = useState(false);
  const [searchMutation, { data: searchData,isLoading :isSearchLoading, isError :isSearchError, isSuccess :isSearchSuccess, error :searchError }] = useSearchMutation();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focused, setFocused] = useState(false);
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

  
  const handleSearchPress =   () => {

    let userId = user.id;
    let llmId = llm.id;
    searchMutation({searchQuery,llmId,userId});
    // Add your custom logic for the cross button press
  };

  const search =() =>{
  
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
    <View style={[styles.container,{borderWidth:2, borderColor:'gray',borderRadius: 10}]}>
      <View style={{flexDirection:'row', alignSelf:'center',alignContent:'space-between',width:'100%'}}>
        <View style={{width:'50%', padding: 10, borderRadius: 10, height: 40, marginTop:'10%'}}>
        <TouchableOpacity onPress={search} style={{ backgroundColor: '#0092ca',alignSelf:'center',width:'40%', padding: 10, borderRadius: 10, height: 40 }}>
            <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Upsc Digest</Text>
          </TouchableOpacity>

        </View>
        <View style={{width:'50%', padding: 10, borderRadius: 10, height: 40, marginTop:'10%'}}>
            <TouchableOpacity onPress={search} style={{ backgroundColor: '#0092ca',alignSelf:'center',width:'40%', padding: 10, borderRadius: 10, height: 40 }}>
              <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Law Digest</Text>
            </TouchableOpacity>

          </View> 
      </View>
     
      <Image source={require('../assets/search-logo.png')} style={[styles.Searchlogo,{shadowColor:"white",
      
    shadowOffset:3,
    shadowOpacity:10,    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    position:'absolute',
    shadowRadius: 4,
    elevation: 5,}]} />


      {isSearchSuccess && <ScrollView  >
      
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>

       
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>
       <Text>sdds</Text>

       <Text>sdds</Text>

       </ScrollView>}

      <View style={[styles.rowContainer,{flexDirection:'row',marginLeft: '10%',marginTop:'30%',
        justifyContent:'center',justifyContent:'center',position:'absolute',
        width: '80%', height:"15%"}]}>
          <TextInput
            style={[styles.BlogTopicInputBox,{alignSelf:'center',height:'100%', borderWidth:2,
                borderRightWidth:0,
                borderTopRightRadius:0, borderBottomRightRadius:0,fontSize: 18, col:'gray'
            }]}
            placeholder="Ask me any thing.."
            onChangeText={(text) => setSearchQuery(text)}
            onFocus={() => setFocused(true)}
            maxLength={100}
            >
            </TextInput>

            <View style={{width: '5%'}}>
            <TouchableOpacity style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderWidth:2, 
             borderRadius:5, borderLeftWidth:0, borderTopLeftRadius:0,borderBottomLeftRadius:0, borderColor:'gray'
            }}
         hitSlop={{top: 20, bottom: 20, left: 50, right: 50}} onPress={search}>
            <FontAwesome name="arrow-circle-up" size={40} color="white" />
        </TouchableOpacity>
            </View>

        </View>
    </View>
  );
};

// Export the component
export default SearchV2;

