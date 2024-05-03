// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Button, Modal, CheckBox,Image } from 'react-native';
import styles from '../styles';// Create your functional component
import { ScrollView } from 'react-native-web';
import Toast from 'react-native-toast-message';

import { Checkbox } from 'react-native-paper';
import NestedCheckbox from './NestedCheckBox';
import {useSearchMutation} from './authApi';
import {useSelector} from "react-redux";
import {selectedLLm, selectUser} from "./authSlice";

const Search = ({tool}) => {
  const user =  useSelector(selectUser);
  const llm =  useSelector(selectedLLm);
  const [searchQuery, setSearchQuery] = useState('');
  const [secondSearch, setSecondSearch] = useState(false);
  const [searchMutation, { data: searchData,isLoading :isSearchLoading, isError :isSearchError, isSuccess :isSearchSuccess, error :searchError }] = useSearchMutation();
  
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
      {isSearchSuccess && <View><Text style={[{color: '#0092ca',fontSize:25}]}>Your Search Result </Text></View>}
      {isSearchSuccess &&
        <ScrollView   style={[styles.StructureContainer, {borderRadius:2,backgroundColor: '#d3d3d3'}]}>
          {console.log(searchData.subject)}
          { searchData.subject && <View><Text style={[{color: 'white',fontSize:15}]}>{searchData.subject}</Text></View> }
          { searchData.topStories && <View><Text style={[{color: 'white',fontSize:15}]}>{searchData.topStories}</Text></View> }
          { searchData.summary && <View><Text style={[{color: 'white',fontSize:15}]}>{searchData.summary}</Text></View> }       
        </ScrollView>
      }

      {secondSearch && <View style={{flexDirection:'row',alignContent:"center",alignItems:"center",justifyContent:"center"}}>
      <TextInput
          style={[{height: 40,width:'60%',borderColor: 'gray',borderWidth: 1,padding:10,borderTopLeftRadius: 10,borderBottomLeftRadius: 10,padding:10, alignContent:"center",alignItems:"center"}]}
          placeholder="Ask me any thing.."
          onChangeText={(text) => setSearchQuery(text)}
          maxLength={100}
      />

      <TouchableOpacity onPress={() => {handleSearchPress()}} style={{ backgroundColor: '#0092ca', padding: 10, borderTopRightRadius: 10,borderBottomRightRadius: 10, height: 40, width:'10%',alignSelf:'center' }}>
        <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Search</Text>
      </TouchableOpacity>
      </View>}
      


      
      
      


    </View>
  );
};

// Export the component
export default Search;

