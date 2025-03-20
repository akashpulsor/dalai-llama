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
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { useVerificationCodeMutation, useAddLeadMutation } from './authApi';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import {selectUser } from '../component/authSlice';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
import WorldwideAddressPicker from './WorldwideAddressPicker';
import countryData from '../helper/countryData';

import { 
  isValidEmail, 
  isValidPhone, 
  isValidWhatsApp,
  cleanContactData 
} from '../helper/utils';

import CountryPicker from './CountryPicker';
import { height } from '@fortawesome/free-solid-svg-icons/fa0';

const PortalConfigurationModal = ({ onClose, openModal }) => {

  const user =  useSelector(selectUser);
  const [errorMessages, setErrorMessages] = useState({});
  
  const dispatch = useDispatch();

  useEffect(() => {

      dispatch(showMessage({
        message: 'Lead created successfully',
        type: 'info'
      }));


  }
  , []);

  const handleModalClose = () => {
    
    setErrorMessages({});
    onClose(false);
  }

  return (

    <Modal
    animationType="slide"
    transparent={true}
    visible={openModal}
    onRequestClose={handleModalClose}
>
                <View style={styles.centeredView}>
                    <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleModalClose()}>
                        <MaterialIcons name="cancel" size={24} color="gray" />
                    </TouchableOpacity>
                            <View style={[styles.modalView]}>
                                  <Text style={{fontSize:34, fontFamily:'bold'}}> Portal Configurer</Text>
                                  
                                  <ScrollView style={styles.container}>
                                        <View style={styles.formContainer}>
                                                <View style={styles.inputGroup}>
                                                      <Text style={styles.label}>Url</Text>
                                                      <TextInput
                                                          style={styles.input}
                                                          placeholder="Url"
                                                          value={formData.name}
                                                          //onChangeText={() => ()}
                                                          required
                                                      />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>Intent To use this Website</Text>
                                                    <TextInput
                                                            style={[styles.input,errorMessages.email ? styles.inputError : null]}
                                                            placeholder="eg. I want to use this website to shortlist the candidate "
                                                            //keyboardType="email-address"
                                                            //value={formData.email}
                                                            //onChangeText={(text) => handleChange('email', text)}
                                                            required
                                                    />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>Steps To use this Website</Text>
                                                    <TextInput
                                                            style={[styles.input,errorMessages.email ? styles.inputError : null]}
                                                            placeholder="Give comma separated list, eg. Go to home page, select Login, go to search, add crieteria for search, navigate all candidate ... "
                                                            //keyboardType="email-address"
                                                            //value={formData.email}
                                                            //onChangeText={(text) => handleChange('email', text)}
                                                            required
                                                    />
                                                </View>
                                        </View>
                                  </ScrollView>



                                <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                                    <View style={{margin:'5%'}}>
                                        <Button mode="contained" onPress={() => onAddLeadPress()} >
                                            Configure
                                        </Button>
                                    </View>
                                </View>
                            </View> 
                    
                </View>
  
        </Modal>

  );
};

AddLeadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal : PropTypes.bool.isRequired
};

export default AddLeadModal;

const styles = StyleSheet.create({
  centeredView: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
  },
  modalView: {
      margin: 2.5,
      height:'90%',
      backgroundColor: '#d3d3d3',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '80%'
  },  
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'white'
  },   
  inputContainer: {
      padding: 2,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      justifyContent: 'center'
  },
  textInput: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 14,
      color: '#333',
      backgroundColor: 'transparent',

      textAlignVertical: 'center',
  },
  pickerContainer: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white'
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formContainer: {
    backgroundColor: '#d3d3d3',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    flex: 1,
    width:'100%',
    backgroundColor: '#d3d3d3',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  picker: {
    height: 50,
    borderRadius: 8,
  },
  inputError: {
    borderColor: 'red',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white'
  },
  countryCodeInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    textAlign: 'center'
  },
  buttonStyle: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonTextStyle: {
    color: '#333',
    fontSize: 18,
  },
  modalStyle: {
    backgroundColor: '#f9f9f9',
  },
  modalHeaderStyle: {
    backgroundColor: '#007AFF',
    height: 60,
  },
  modalTitleStyle: {
    color: '#fff',
    fontSize: 20,
  },
  searchInputStyle: {
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
  },
  listItemStyle: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  listItemTextStyle: {
    color: '#333',
  },
});