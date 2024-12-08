
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
import { useSelector } from 'react-redux';
import {selectUser, selectOnboardingData} from './authSlice';
import {useGetBusinessDataQuery,useGeneratePhoneMutation} from './authApi';

const BusinessDataSnapShot = ({navigation}) => {
    const user =  useSelector(selectUser);
    const onBoardingData =  useSelector(selectOnboardingData);
    const { data: businessData, error, isLoading, isError } = useGetBusinessDataQuery(
        user?.id
    );

   


    useEffect(() => {
        console.log("DHANYAAAAAA");
        console.log(onBoardingData);
    }, [onBoardingData]);


    return (
        <View style={[styles.tableContainer,{flexDirection:'column'}]}>
                {/* Business Name */}
                <View style={[styles.section]}>
                    <Text style={styles.businessName}>{businessData?.businessName}</Text>
                    <View style={{flexDirection:'row'}}>
                        <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold"}]}>Email: </Text>
                        <Text style={[styles.value]}>{businessData?.email||'-'}</Text>
                    </View>
                    <View style={{flexDirection:'row'}}>
                            <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold"}]}>Inbound: </Text>
                            <Text style={[styles.value]}>{businessData?.email||'-'}</Text>
                    </View>
                    <View  style={{flexDirection:'row'}}>
                        <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold"}]}>Outbound: </Text>
                        <Text style={[styles.value]}>{businessData?.email||'-'} </Text>
                    </View>
                </View>

                
                    <View style={{marginLeft:'90%',flexDirection:'row', marginBottom:'100%'}}>
                        {!onBoardingData && (
                                <TouchableOpacity 
                                    style={[styles.generateButton]}
                                    onPress={() => navigation.navigate('Business')}
                                >
                                    <Text style={styles.generateButtonText}>
                                        OnBoard Business
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </View>

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
        width: '100%',
        flexDirection:'column'
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
    },
    loadingContainer: {
      marginVertical: 20,
    },
    businessName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
    },
    section: {
      marginBottom: 16,
      flexDirection:'column',
      alignSelf:'flex-start'
    },
    phoneContainer: {
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
   
    },
    value: {
      fontSize: 16,
      color: '#333',
    },
    generateButton: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      width:'30%',
      marginBottom:'50%'
    },
    generateButtonDisabled: {
      backgroundColor: '#A5A5A5',
    },
    generateButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: 'red',
      fontSize: 16,
      textAlign: 'center',
    },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessInfoSection: {
    flex: 1,
    paddingRight: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  buttonSection: {
    justifyContent: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 12,
    minWidth: 150,
  },
  generateButtonDisabled: {
    backgroundColor: '#A5A5A5',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

});

