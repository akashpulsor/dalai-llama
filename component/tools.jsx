import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import CustomHeader from './CustomHeader';
import DropDownPicker from 'react-native-dropdown-picker';
import styles from '../styles';
import { createStackNavigator } from '@react-navigation/stack';
import llamaContent from './llamaContent';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';


// Create stack navigator for cards
const Stack = createStackNavigator();



//TODO We need to add link to link to your cms
const Tools = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);

  const [llm, setLlm] = useState([]);

  const [choosenLlm, setChoosenLlm] = useState(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: 'GPT4', value: 'GPT4' },
    { label: 'LLAMA2', value: 'LLAMA2' },
    { label: 'KRUTRIM', value: 'KRUTRIM' },
  ]);

  const llmData = [
    { label: 'GPT4', value: 'GPT4' },
    { label: 'LLAMA2', value: 'LLAMA2' },
    { label: 'KRUTRIM', value: 'KRUTRIM' },
  ];

  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1); // Initially fetch page 1

  useEffect(() => {
    // Fetch data from the web
    const fetchData = async () => {
      try {
        const response = await fetch('https://63949ed0-1855-4bba-b6fe-be08df3fce3e.mock.pstmn.io/tools');
        console.log(response);
        const jsonData = await response.json();
        setData((prevCards) => [...prevCards, ...jsonData]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchLLM = async () => {
      try {
        const llmData =[
        
          { label: 'GPT4', value: 'GPT4' },
          { label: 'LLAMA2', value: 'LLAMA2' },
          { label: 'KRUTRIM', value: 'KRUTRIM' },
        ]
        console.log(llmData)
        setLlm(llmData);
        console.log(llm)
      } catch (error) {
        console.error('Error fetching LLM data:', error);
      }
    };
    fetchData();
    fetchLLM();
    console.log(llm)
  }, []); // The empty dependency array ensures the effect runs only once, similar to componentDidMount


  const CardScreen = ({ navigation, card }) => {
    const handlePress = () => {
          // Navigate to a new screen when a card is pressed
          navigation.navigate(card.name);
    };
  
    return (
      <TouchableOpacity onPress={handlePress} style={{ padding: 10, margin: 10, borderWidth: 1, borderColor: 'gray' }}>
        <Text>{card.name}</Text>
      </TouchableOpacity>
    );
  }
  
  
  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LLAMACONTENT')}>
      <Text style={styles.Text}>{item.name}</Text>
    </TouchableOpacity>
  );

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
              placeholder={'Choose an option.'}
            />  
        </View>
      </View >

      <ScrollView  style={{ zIndex: -1}} onScroll={handleScroll} scrollEventThrottle={16}>
 
          



          <TouchableOpacity style={styles.card} onPress={() => {console.log(navigation.getState());navigation.navigate("LLAMA-CONTENT");}}>
      <Text style={styles.Text}>test</Text>
    </TouchableOpacity>              
      </ScrollView>
    </View>
  );
};


export default Tools;
