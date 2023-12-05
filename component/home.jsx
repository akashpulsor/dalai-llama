// Import necessary components from React Native
import React, { useState} from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles';
import { ScrollView } from 'react-native-web';


// Create your functional component
const Home = ({navigation}) => {
    const [data, setData] = useState([]);    
    const [foldableViewOpen, setFoldableViewOpen] = useState(false);
    const [searchQuestion, setSearchQuestion] = useState('');

    const renderCard = () => (
        <ScrollView>
            <View style={styles.SeoContentFlex}>
                    {/* Foldable View */}
                {foldableViewOpen && (
                    <View style={styles.foldableView}>
                        {/* Your content for the foldable view */}
                        <Text>{data}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    
    );

          // Fetch data from the web
    const fetchData = async () => {
            try {
              setFoldableViewOpen(false);
              setData([]);
              console.log(searchQuestion);  
              const response = await fetch('localhost:8000/search/'+searchQuestion);
              const jsonData = await response.json();
              //const jsonData = '{test Data}';
              console.log(jsonData)
              setData(jsonData);
              setSearchQuestion('');
              setFoldableViewOpen(true);
            } catch (error) {
              console.error('Error fetching data:', error);
            }
    };
  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>
            <TouchableOpacity onPress={()=>navigation.navigate('Tools')}>
                <Text style={{ fontSize: 16, color: 'blue' }}>Business</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
                    DALAI LLAMA
                </Text>
            </View>
            <View style={styles.rowItem1}>
                <View style={styles.searchBarFlex}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder=" Search..."
                        onChangeText={(text) => setSearchQuestion(text)}
                    />
                </View>
                <View style={styles.searchButton}>
                    <TouchableOpacity style={styles.buttonContainer} onPress={() => fetchData()}>
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>
                
            </View>

    
        </View>
        <View style={styles.rowContainer}>
                                            {/* Foldable View */}
                                            {foldableViewOpen && renderCard()}
            
        </View>

    </View>
  );
};

// Export the component
export default Home;
