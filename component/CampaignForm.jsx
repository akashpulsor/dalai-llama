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
import Button from './Button';

import { Picker } from '@react-native-picker/picker';
import { useVerificationCodeMutation } from './authApi';


const CampaignForm = ({ 
    enabled, formData, setFormData
 }) => {
  
    const handleFormChange = (field, value) => {
        setFormData((prevData) => ({
          ...prevData,
          [field]: value,
        }));
    };

  return (
                <View style={[styles.modalView]}>
                    
                    <ScrollView style={{width:'100%', borderRadius:12, borderWidth:1, borderColor:'black'}}>
                        <View style={styles.container}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Name of Campaign</Text>
                                    <TextInput
                                        style={[styles.input, !enabled && styles.disabledInput]}
                                        placeholder="Enter campaign name"
                                        value={formData.name}
                                        onChangeText={(text) => handleFormChange('name', text)}
                                        editable={enabled}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Objective of Campaign</Text>
                                    <TextInput
                                        style={[styles.input, !enabled && styles.disabledInput]}
                                        placeholder="Enter campaign objective"
                                        value={formData.objective}
                                        onChangeText={(text) => handleFormChange('objective', text)}
                                        editable={enabled}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Campaign Description</Text>    

                                                          <TextInput
                        style={[styles.input, styles.textArea, !enabled && styles.disabledInput]}
                        value={formData.persona}
                        onChangeText={(text) => handleFormChange('description', text)}
                        placeholder="Enter campaign description"
                        multiline={true}
                        numberOfLines={4}
                        editable={enabled}
                      />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>First Message</Text>
                                    <TextInput
                                        style={[styles.input, !enabled && styles.disabledInput]}
                                        placeholder="First Message"
                                        value={formData.firstMessage}
                                        onChangeText={(text) => handleFormChange('firstMessage', text)}
                                        editable={enabled}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Language</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={formData.language}
                                                onValueChange={(text) => handleFormChange('language', text)}
                                                style={styles.picker}
                                                enabled={enabled}
                                            >
                                                <Picker.Item label="Select a language" value="" />
                                                <Picker.Item label="English" value="en" />
                                                <Picker.Item label="Hindi" value="hn" />
                                                <Picker.Item label="Spanish" value="es" />
                                                <Picker.Item label="French" value="fr" />
                                                <Picker.Item label="German" value="de" />
                                            </Picker>
                                        </View>
                                </View>    
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Duration (minutes)</Text>
                                    <TextInput
                                        style={[styles.input, !enabled && styles.disabledInput]}
                                        placeholder="Enter duration (max 5 minutes)"
                                        value={formData.duration.toString()}
                                        onChangeText={(text) =>
                                            setFormData(prev => ({
                                            ...prev,
                                            duration: Math.min(parseInt(text) || 0, 5)
                                            }))
                                        }
                                        keyboardType="numeric"
                                        editable={enabled}
                                    />
                                </View>   
                        </View>
                    </ScrollView>
                </View>


  );
};

CampaignForm.propTypes = {
    enabled: PropTypes.bool.isRequired,
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
  };

export default CampaignForm;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalView: {
      width:'100%',
      height:'90%',
      borderRadius: 20,
      alignItems: 'center',

    },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  errorContainer: {
    marginVertical: 20,
  },
  container: {
    flex: 1,
   
    paddingHorizontal: 20,
    paddingVertical: 40,

  },
  formContainer: {
    
    borderRadius: 10,
    padding: 20,

  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 8,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0', // Gray out disabled input
    color: '#b0b0b0', // Optional: change text color for disabled fields
  }
});