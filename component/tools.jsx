import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import CustomHeader from './CustomHeader';
import DropDownPicker from 'react-native-dropdown-picker';
import styles from '../styles';
import { useGetToolsQuery,useGetLlmQuery } from './authApi';
import { createStackNavigator } from '@react-navigation/stack';
import llamaContent from './llamaContent';
import { createContext, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import {useDispatch} from "react-redux"; // Import navigation hook from React Navigation
const screenWidth = Dimensions.get('window').width;

import {setToken,setUser,setTools,setLlm} from "./authSlice";
const Tools = ({ navigation }) => {
  const { data: toolsData, error: toolsError, isLoading: toolsLoading } = useGetToolsQuery();
  const { data: llmsData, error: llmsError, isLoading: llmsLoading } = useGetLlmQuery();

  const [data, setData] = useState([]);


  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);



  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1); // Initially fetch page 1
  useEffect(() => {
    if (toolsData) {
      setData(toolsData);
      dispatch(setTools(toolsData));
    }
  }, [toolsData]);
  useEffect(() => {

      if (llmsData) {
          setItems(llmsData);
          //dispatch(setLlm(items));
      }
  }, [llmsData]); // The empty dependency array ensures the effect runs only once, similar to componentDidMount

  const renderCard = ({ item }) =>{
    return (
      <View style={{margin:10}}>
          <TouchableOpacity style={styles.card} onPress={() =>  navigation.navigate( item.name )} disabled={!item.active}>
              <View style={{margin:'20%'}}>
                  <Text style={{    fontSize: 24,
    fontWeight: 'bold',color:'white'}}>{item.name}</Text>
              </View>

              <View >
                    {!item.active && <Text style={{ color: 'blue',FontFace:'PT Mono' }}>Under Development</Text>}
              </View>
              
          </TouchableOpacity>
      </View>
  
    );
  } 


  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom) {
      // If close to bottom, fetch next page
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    
    <View style={styles.container}>
       
      <View style={styles.Header}>
        <View style={styles.titleFlex}>
          
        </View>
        <View style={styles.LLMFlex}>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              dropDownStyle={{backgroundColor: '#fafafa'}}
              containerStyle={styles.LLM}
              onChangeItem={(item) =>{
                  console.log('AKASH');
                  console.log(item);
                }                 
              }
              placeholder={'Choose an llm.'}
            />  
        </View>
      </View >

      <ScrollView  style={{ zIndex: -1}} onScroll={handleScroll} scrollEventThrottle={16}>
      <FlatList
      data={data}
      renderItem={renderCard}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.container}
      numColumns={Math.floor(screenWidth / 150)} // Adjust card width as needed
    />

      </ScrollView>
    </View>
  );
};


export default Tools;

