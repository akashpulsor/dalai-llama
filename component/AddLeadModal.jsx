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
import { MaterialIcons } from '@expo/vector-icons';

import { useVerificationCodeMutation } from './authApi';
import { Picker } from '@react-native-picker/picker';

const AddLeadModal = ({ onClose, openModal }) => {
  const [isEditable, setIsEditable] = useState(false); 



  useEffect(() => {

  }, []);

  const onAddLeadPress = async () => {
    handleModalClose();
  };

  const handleModalClose = () => {
    onClose(false);
  }


  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    gender: '',
    address: '',
    landmark: ''
  });


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
                                  <Text style={{fontSize:34, fontFamily:'bold'}}> Lead Data</Text>
                                  <ScrollView style={styles.container}>
                                        <View style={styles.formContainer}>
                                                <View style={styles.inputGroup}>
                                                      <Text style={styles.label}>Name of Lead</Text>
                                                      <TextInput
                                                          style={styles.input}
                                                          placeholder="Name"
                                                          value={formData.name}
                                                          onChangeText={(text) => handleChange('name', text)}
                                                          required
                                                      />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>Email</Text>
                                                    <TextInput
                                                            style={styles.input}
                                                            placeholder="Email"
                                                            keyboardType="email-address"
                                                            value={formData.email}
                                                            onChangeText={(text) => handleChange('email', text)}
                                                            required
                                                    />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>Phone</Text>
                                                    <TextInput
                                                            style={styles.input}
                                                            placeholder="Phone"
                                                            keyboardType="phone-pad"
                                                            value={formData.phone}
                                                            onChangeText={(text) => handleChange('phone', text)}
                                                          />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>WhatsApp</Text>
                                                    <TextInput
                                                            style={styles.input}
                                                            placeholder="WhatsApp"
                                                            keyboardType="phone-pad"
                                                            value={formData.whatsapp}
                                                            onChangeText={(text) => handleChange('whatsapp', text)}
                                                          /> 
                                                </View>
                

                                                <View style={styles.inputGroup}>
                                                  <Text style={styles.label}>Gender</Text>
                                                  <View style={styles.pickerContainer}>
                                                        <Picker
                                                          selectedValue={formData.gender}
                                                          onValueChange={(value) =>
                                                            setFormData(prev => ({ ...prev, gender: value }))
                                                          }
                                                          style={styles.picker}
                                                        >
                                                        <Picker.Item label="Select Gender" value="" />
                                                            <Picker.Item label="Male" value="male" />
                                                            <Picker.Item label="Female" value="female" />
                                                            <Picker.Item label="Other" value="other" />
                                                            <Picker.Item label="Prefer Not to Say" value="prefer-not-to-say" />
                                                        </Picker>
                                                  </View>
                                                </View>
                                                        
                                                <View style={styles.inputGroup}>
                                                      <Text style={styles.label}>Address</Text>
                                                      <TextInput
                                                      style={styles.input}
                                                      placeholder="Address"
                                                      value={formData.address}
                                                      onChangeText={(text) => handleChange('address', text)}
                                                    />
                                                </View>        

                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.label}>Address</Text>
                                                    <TextInput
                                                      style={styles.input}
                                                      placeholder="Landmark"
                                                      value={formData.landmark}
                                                      onChangeText={(text) => handleChange('landmark', text)}
                                                    /> 
                                                </View>
                    
                                        </View>
                                  </ScrollView>



                                <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                                    <View style={{margin:'5%'}}>
                                        <Button mode="contained" onPress={() => setIsEditable(false)} >
                                            Add Lead
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
  }
});