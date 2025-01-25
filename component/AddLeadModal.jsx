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

import { 
  isValidEmail, 
  isValidPhone, 
  isValidWhatsApp,
  cleanContactData 
} from '../helper/utils';

import CountryPicker from './CountryPicker';
import { height } from '@fortawesome/free-solid-svg-icons/fa0';

const AddLeadModal = ({ onClose, openModal }) => {

  const user =  useSelector(selectUser);
  const [addLead, { data: leadData, isLoading:isLeadDataLoading, isSuccess:isLeadDataSuccess, isError:isLeadDataError, error:LeadDataError }] = useAddLeadMutation();
  const [errorMessages, setErrorMessages] = useState({});
  const [formData, setFormData] = useState({
          name: '',
          email: '',
          phone: '',
          phoneCountryCode: 'US',
          test:false,
          whatsapp: '',
          whatsappCountryCode: 'US',
          gender: '',
          address: {      
            country: {
                name: '',
                isoCode: '',
                flag: '',
                phonecode: '',
                currency: '',
                latitude: '',
                longitude: '',
                timezones: [
                    {
                        zoneName: '',
                        gmtOffset: 0,
                        gmtOffsetName: '',
                        abbreviation: '',
                        tzName: ''
                    }
                ]
            },
            state: {
              name: '',
              isoCode: '',
              countryCode: '',
              latitude: '',
              longitude: ''
            },
            city: {
              name: '',
              countryCode: '',
              stateCode: '',
              latitude: '',
              longitude: ''
            },
            streetAddress: '',
            apartment: '',
            postalCode: '',
            formattedAddress: ''
          }
  });
  const dispatch = useDispatch();
  const [isTestEnabled, setIsTestEnabled] = useState(true);
  const toggleSwitch = () => setIsTestEnabled(previousState => !previousState);
  useEffect(() => {
    if (isLeadDataSuccess && leadData) {
      setFormData(leadData);
      dispatch(showMessage({
        message: 'Lead created successfully',
        type: 'info'
      }));
      resetForm();
      onClose(false);

  }

  }, []);


  const resetForm = () => {
    setFormData({
        name: '',
        email: '',
        phone: '',
        phoneCountryCode: 'US',
        whatsapp: '',
        whatsappCountryCode: 'US',
        gender: '',
        address: {      
          country: {
              name: '',
              isoCode: '',
              flag: '',
              phonecode: '',
              currency: '',
              latitude: '',
              longitude: '',
              timezones: [
                  {
                      zoneName: '',
                      gmtOffset: 0,
                      gmtOffsetName: '',
                      abbreviation: '',
                      tzName: ''
                  }
              ]
          },
          state: {
            name: '',
            isoCode: '',
            countryCode: '',
            latitude: '',
            longitude: ''
          },
          city: {
            name: '',
            countryCode: '',
            stateCode: '',
            latitude: '',
            longitude: ''
          },
          streetAddress: '',
          apartment: '',
          postalCode: '',
          formattedAddress: ''
      }
    });
    setErrorMessages({});
  };

  const validatePhoneNumber = (phone, countryCode) => {
    try {
      phone=countryCode+phone;
      return isValidPhone(phone);
    } catch (error) {
      return false;
    }
  };

  const formatPhoneNumber = (phone, countryCode) => {
    try {
      const phoneNumber = parsePhoneNumber(phone, countryCode);
      return phoneNumber.formatInternational();
    } catch (error) {
      return phone;
    }
  };

  const onAddLeadPress = async () => {
    const newFormData = {
      ...formData,
      businessId: user?.id,
      test: isTestEnabled
    };
  
    // Validate businessId first
    if (!newFormData.businessId) {
      dispatch(showMessage({
        message: 'Business Id not present',
        type: 'error'
      }));
  
      return;
    }
  
    const errors = {};
  
    // Phone validation
    if (!newFormData.phone) {
      errors.phone = 'Phone is required';
    } else if (!validatePhoneNumber(newFormData.phone, newFormData.phoneCountryCode)) {
      errors.phone = 'Please enter a valid phone number (e.g., +1234567890)';
    }
  
    // Email validation
    if (!newFormData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(newFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
  
    // WhatsApp validation (if provided)
    if (newFormData.whatsapp && !validatePhoneNumber(newFormData.whatsapp, newFormData.whatsappCountryCode)) {
      errors.whatsapp = 'Please enter a valid WhatsApp number with country code (e.g., +1234567890)';
    }
  
    // Additional validation for empty or whitespace-only values
    ['phone', 'email', 'whatsapp'].forEach(field => {
      if (newFormData[field] && newFormData[field].trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`;
      }
    });
  
    setErrorMessages(errors);
  
    if (Object.keys(errors).length === 0) {
      // Clean the data before submitting
      const cleanedFormData = cleanContactData(newFormData);
            // Format phone numbers before submission
      const formattedData = {
        ...cleanedFormData,
        phone: formatPhoneNumber(cleanedFormData.phone, cleanedFormData.phoneCountryCode),
        whatsapp: cleanedFormData.whatsapp ? formatPhoneNumber(cleanedFormData.whatsapp, cleanedFormData.whatsappCountryCode) : ''
      };
      console.log("Lead Data");
      console.log(newFormData);
      addLead(formattedData);
    }
  };
  const handleModalClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      phoneCountryCode: 'US',
      whatsapp: '',
      whatsappCountryCode: 'US',
      gender: '',
      address: {      
        country: {
            name: '',
            isoCode: '',
            flag: '',
            phonecode: '',
            currency: '',
            latitude: '',
            longitude: '',
            timezones: [
                {
                    zoneName: '',
                    gmtOffset: 0,
                    gmtOffsetName: '',
                    abbreviation: '',
                    tzName: ''
                }
            ]
        },
        state: {
          name: '',
          isoCode: '',
          countryCode: '',
          latitude: '',
          longitude: ''
        },
        city: {
          name: '',
          countryCode: '',
          stateCode: '',
          latitude: '',
          longitude: ''
        },
        streetAddress: '',
        apartment: '',
        postalCode: '',
        formattedAddress: '',
        test:false
      }
    });
    setErrorMessages({});
    onClose(false);
  }


  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePhoneChange = (text, field) => {
    handleChange(field, text);
    // Clear error when user starts typing
    if (errorMessages[field]) {
      setErrorMessages(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddressChange = (address) => {
    handleChange("address",address);
  };

  const handleCountrySelect = (text, field) => {
    console.log("AKASHHH");
    console.log(field);
    handleChange(text,field.code);
  };


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
                                  {isLeadDataLoading &&  <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#0000ff" />
                                  </View>}
                                  {isLeadDataError &&  <View style={styles.loadingContainer}>
                                  <Text style={[styles.label,{color:'red', fontSize:10}]}>{LeadDataError}</Text>
                                  </View>}
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
                                                            style={[styles.input,errorMessages.email ? styles.inputError : null]}
                                                            placeholder="Email"
                                                            keyboardType="email-address"
                                                            value={formData.email}
                                                            onChangeText={(text) => handleChange('email', text)}
                                                            required
                                                    />
                                                </View>

                                                <View style={styles.inputGroup}>
                                                  <Text style={styles.label}>Phone</Text>
                                                  <View style={styles.phoneContainer}>
                                                      

                                                  <CountryPicker
                                                    onSelect={(country) => handleCountrySelect('phoneCountryCode', country)}
                                                    defaultCountryCode="+1"
                                                    buttonStyle={{width: '100%', backgroundColor:"#ffff"}}
                                                    containerStyle={{ width: '20%' }}
                                                    dropdownStyle={{ maxHeight: 250,position:'relative', backgroundColor:"#ffff" }} // Optional: customize dropdown height
                                                  />  

                                                  <TextInput
                                                          style={[styles.input, {height:'85%'},errorMessages.phone && styles.inputError]}
                                                          placeholder="234 567 8900"
                                                          keyboardType="phone-pad"
                                                          value={formData.phone}
                                                          onChangeText={(text) => handlePhoneChange(text, 'phone')}
                                                        />
                                                  </View>

                                                  {errorMessages.phone && (
                                                    <Text style={styles.errorText}>{errorMessages.phone}</Text>
                                                  )}
                                                </View>

                                                <View style={styles.inputGroup}>
                                                      <Text style={styles.label}>WhatsApp</Text>
                                                      <View style={styles.phoneContainer}>
                                                        
                                                        <CountryPicker
                                                            onSelect={(country) => handleCountrySelect('whatsappCountryCode', country)}
                                                            defaultCountryCode="+1"
                                                            buttonStyle={{width: '100%', backgroundColor:"#ffff"}}
                                                            containerStyle={{ width: '20%' }}
                                                            dropdownStyle={{ maxHeight: 250,position:'relative', backgroundColor:"#ffff" }} // Optional: customize dropdown height
                                                        />       
                                                        <TextInput
                                                          style={[styles.input, {height:'85%'},errorMessages.whatsapp && styles.inputError]}
                                                          placeholder="234 567 8900"
                                                          keyboardType="phone-pad"
                                                          value={formData.whatsapp}
                                                          onChangeText={(text) => handlePhoneChange(text, 'whatsapp')}
                                                        />

                                                      </View>
                                                      {errorMessages.whatsapp && (
                                                        <Text style={styles.errorText}>{errorMessages.whatsapp}</Text>
                                                      )}
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
                                                    <Switch
                                                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                                                        thumbColor={isTestEnabled ? "#007AFF" : "#f4f3f4"}
                                                        ios_backgroundColor="#3e3e3e"
                                                        onValueChange={toggleSwitch}
                                                        value={isTestEnabled}
                                                        style={styles.switch}
                                                    />
                                                  <Pressable onPress={toggleSwitch}>
                                                    <Text style={styles.label}>Test User</Text>
                                                  </Pressable>
                                                </View>
                                                        
                                                <View style={styles.inputGroup}>
                                                  <Text style={styles.label}>Address</Text>
                                                  <WorldwideAddressPicker
                                                    isEditMode={true}
                                                    initialAddress={formData.address}
                                                    onAddressChange={handleAddressChange}
                                                    onSubmit={handleAddressChange}
                                                  />
                                                </View>
                    
                                        </View>
                                  </ScrollView>



                                <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                                    <View style={{margin:'5%'}}>
                                        <Button mode="contained" onPress={() => onAddLeadPress()} >
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