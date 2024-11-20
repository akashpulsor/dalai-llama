
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
import PropTypes from 'prop-types';


const BusinessDataSnapShot = ({ businessId }) => {
    const [data, setData] = useState(null);
    useEffect(() => {

    }, []);
    
    
    return (
        <View style={styles.tableContainer}>
                <View style={styles.cardContainer} />
                <View style={styles.cardContainer} />

        </View>
    );

}

export default BusinessDataSnapShot;

BusinessDataSnapShot.propTypes = {
    businessId : PropTypes.number.isRequired
};

const styles = StyleSheet.create({
    tableContainer :{
        
        height:'90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '100%'
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
      height:'50%',
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
    }

});

