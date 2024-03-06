import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity,  ScrollView, Dimensions } from 'react-native';

import DropDownPicker from 'react-native-dropdown-picker';
import styles from '../styles';
import {useGetToolsQuery, useGetLlmQuery, useGenerateTagsMutation} from './authApi';
import {useDispatch, useSelector} from "react-redux"; // Import navigation hook from React Navigation
const screenWidth = Dimensions.get('window').width;
import { MaterialIcons } from '@expo/vector-icons';
import {setToken, setUser, setTools, setLlm, setSelectedLlm, selectUser, selectedLLm} from "./authSlice";
import LlamaContent from "./llamaContent";
const Tools = ({ navigation }) => {
  const { data: toolsData, error: toolsError, isLoading: toolsLoading } = useGetToolsQuery();
  const selectedLlm =  useSelector(selectedLLm);
  const [data, setData] = useState([]);
  const [toolPage, setToolPage] = useState(true);
  const [contentFlag, setContentFlag] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1); // Initially fetch page 1
  useEffect(() => {
    if (toolsData) {
      console.log(toolsData);
      setData(toolsData);
    }
  }, [toolsData]);
  // The empty dependency array ensures the effect runs only once, similar to componentDidMount

  const renderTool = ({ tool }) =>{
      setToolPage(false);
      setContentFlag(true);
  }
  const cancelTool = () =>{
        setToolPage(true);
        setContentFlag(false);
        setCurrentTool(null);
    }
  const renderCard = ({ item }) =>{
    return (
      <View style={{margin:10}}>
          <TouchableOpacity style={styles.card} onPress={() =>  renderTool(item)} disabled={!item.active}>
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

        {toolPage && <ScrollView  style={{ zIndex: -1}} onScroll={handleScroll} scrollEventThrottle={16}>
          <FlatList
          data={data}
          renderItem={renderCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.container}
          numColumns={Math.floor(screenWidth / 150)} // Adjust card width as needed
        />
      </ScrollView>}
        {!toolPage && <View style={{alignContent:'center',justifyContent:'center',height:'100%'}}>
            <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  cancelTool()}>
                <MaterialIcons name="cancel" size={24} color="gray" />
            </TouchableOpacity>
            {contentFlag && <LlamaContent tool={currentTool}/>}
        </View>}
    </View>
  );
};


export default Tools;

