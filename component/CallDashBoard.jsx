
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PropTypes from 'prop-types';


const CallDashBoard = ({ businessId }) => {
    const [data, setData] = useState(null);
    useEffect(() => {

    }, []);
    
    
    return (
        <ScrollView style={styles.tableContainer} >
        <View style={styles.contentWrapper}>
          {/* Cards Grid */}
          <View style={styles.cardsGrid}>
            <View style={styles.column}>
              <View style={styles.cardContainer} />
              <View style={styles.cardContainer} />
            </View>
            
            <View style={styles.column}>
              <View style={styles.cardContainer} />
              <View style={styles.cardContainer} />
            </View>
            
            <View style={styles.column}>
              <View style={styles.cardContainer} />
              <View style={styles.cardContainer} />
            </View>
            
            <View style={styles.column}>
              <View style={styles.cardContainer} />
              <View style={styles.cardContainer} />
            </View>
            <View style={styles.column}>
              <View style={[styles.cardContainer,{marginTop:'40%'}]} />
              
            </View>
          </View>
           
          {/* Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              style={styles.picker}
              onValueChange={(value) => {}}
            >
              <Picker.Item label="Duration" value="" />
              <Picker.Item label="Past Month" value="en" />
              <Picker.Item label="Past Six Month" value="hn" />
              <Picker.Item label="All Time" value="es" />
            </Picker>
          </View>
        </View>
      </ScrollView>
    );

}

export default CallDashBoard;

CallDashBoard.propTypes = {
    businessId : PropTypes.number.isRequired
};

const styles = StyleSheet.create({
    tableContainer: {
        flex: 1,

        width:'100%'
      },
      contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
      },
      cardsGrid: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "flex-start",
        alignItems: 'flex-start',
      },
      column: {
        width: '23%', // Slightly less than 25% to account for spacing
        alignItems: 'center',
      },
      cardContainer: {
        width: '80%',
        aspectRatio: 1, // Makes it square
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      pickerContainer: {
        width: 150, // Fixed width for the picker
        marginLeft: 10,
      },
      picker: {
        height: 50,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
      },
});

