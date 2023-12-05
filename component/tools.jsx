import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import styles from '../styles';
//TODO We need to add link to link to your cms
const Tools = ({navigation}) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the web
    const fetchData = async () => {
      try {
        const response = await fetch('https://ce8ad948-5e94-44f9-b8e1-200cf0387b00.mock.pstmn.io/tools');
        const jsonData = await response.json();
        console.log(jsonData)
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []); // The empty dependency array ensures the effect runs only once, similar to componentDidMount

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LLAMACONTENT')}>
      <Text style={styles.Text}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tools:</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
      />
    </View>
  );
};


export default Tools;
