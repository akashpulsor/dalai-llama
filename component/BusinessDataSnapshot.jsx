
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

        </View>
    );

}

export default BusinessDataSnapShot;

BusinessDataSnapShot.propTypes = {
    businessId : PropTypes.number.isRequired
};

const styles = StyleSheet.create({
    tableContainer :{
        margin: 2.5,
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
    RowContainer :{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth:1,
        borderColor:'black'
    },
    ColumnContainer :{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth:1,
        borderColor:'black'
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
    }

});

