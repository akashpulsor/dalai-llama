import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import {selectUser } from '../component/authSlice';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import { useGetPhoneDataListQuery, useAddPhoneDataMutation } from './authApi';

const PhoneModal = ({ onClose , openModal}) => {
  const user =  useSelector(selectUser);
  const [errorMessages, setErrorMessages] = useState({});
  const [isActive, setIsActive] = useState(true);

  const [isActiveToggleSwitch, setIsActiveToggleSwitch] = useState(false);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
        phoneId: '',
        businessId: user?.id,
        vendorName: '',
        accountAuthToken: '',
        accountSid: '',
        friendlyName: '',
        businessNumber: '',
        callSecret: '',
        logoImage: '',
        status: '',
        active: isActive,
  });

  const { 
    data: phoneDataList, 
    error, 
    isSuccess, 
    isLoading, 
    isError 
} = useGetPhoneDataListQuery({businessId: user?.id});
const toggleSwitch = () => {
  const newActiveState = !isActive;
  setIsActive(newActiveState);
  setFormData(prevState => ({
    ...prevState,
    active: newActiveState
  }));
};

const [addPhoneData, { data: phoneData, isLoading:isPhoneDataLoading, isSuccess:isPhoneDataSuccess, isError:isPhoneDataError, error:phoneDataError }] = useAddPhoneDataMutation();
  useEffect(() => {
    if (isPhoneDataSuccess && phoneData) {
      setFormData(phoneData);
      dispatch(showMessage({
        message: 'Phone Data added successfully',
        type: 'info'
      }));
      setFormData({
        phoneId: '',
        businessId: user?.id,
        vendorName: '',
        accountAuthToken: '',
        accountSid: '',
        friendlyName: '',
        businessNumber: '',
        callSecret: '',
        logoImage: '',
        status: '',
        active: isActive,
      });
      setIsActiveToggleSwitch(false);
      onClose(false);
  }

  if(isSuccess){
    console.log(phoneDataList);
  }
  }, [phoneDataList, isPhoneDataSuccess, isSuccess]);

  const addPhoneDataPress = async () => {
    addPhoneData(formData);
  };

  const handleModalClose = () => {
    setFormData({
          phoneId: '',
          businessId: user?.id,
          vendorName: '',
          accountAuthToken: '',
          accountSid: '',
          friendlyName: '',
          businessNumber: '',
          callSecret: '',
          logoImage: '',
          status: '',
          active: isActive,
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

  // Assuming phoneDataList is passed as a prop

  const handlePhoneSelection = (businessNumber) => {
    // Find the selected phone data object
    const selectedPhone = phoneDataList.find(phone => phone.businessNumber === businessNumber);
    
    // If a phone is selected, update all form fields
    if (selectedPhone) {
      setFormData({
        phoneId: selectedPhone.phoneId,
        businessId: selectedPhone.businessId,
        vendorName: selectedPhone.vendorName,
        accountAuthToken: selectedPhone.accountAuthToken,
        accountSid: selectedPhone.accountSid,
        friendlyName: selectedPhone.friendlyName,
        businessNumber: selectedPhone.businessNumber,
        callSecret: selectedPhone.callSecret,
        logoImage: selectedPhone.logoImage,
        status: selectedPhone.status,
        active: selectedPhone.active,
      });
      setIsActiveToggleSwitch(true);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={openModal}
      onRequestClose={handleModalClose}
    >
        <View style={styles.slideContent}>
                <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleModalClose()}>
                    <MaterialIcons name="cancel" size={24} color="gray" />
                </TouchableOpacity>
                
          <View style={styles.container}>
            <Text style={{fontSize:34, fontFamily:'bold',alignSelf:'center'}}>Phone Data</Text>
              
            <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Configured Phone</Text>
                    <View style={styles.pickerContainer}>
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#0000ff" />
                          </View>
                        ) : isError ? (
                          <Text style={styles.errorText}>Error loading phone data</Text>
                        ) : (
                          <Picker
                            selectedValue={formData.businessNumber}
                            onValueChange={handlePhoneSelection}
                            style={[
                              styles.picker,
                              errorMessages?.firstMessage ? styles.inputError : null
                            ]}
                          >
                            <Picker.Item label="Select Business Number" value="" />
                            {Array.isArray(phoneDataList) && phoneDataList.map((phone) => (
                              <Picker.Item
                                key={phone.phoneId}
                                label={phone.businessNumber}
                                value={phone.businessNumber}
                              />
                            ))}
                          </Picker>
                        )}
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Account Auth Token</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Account Auth Token"
                          value={formData.accountAuthToken}
                          onChangeText={(text) => handleChange('accountAuthToken', text)}
                          required
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Account Sid</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Account Sid"
                          value={formData.accountSid}
                          onChangeText={(text) => handleChange('accountSid', text)}
                          required
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Friendly Name</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Friendly Name"
                          value={formData.friendlyName}
                          onChangeText={(text) => handleChange('friendlyName', text)}
                          required
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Call Secret</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Call Secret"
                          value={formData.callSecret}
                          onChangeText={(text) => handleChange('callSecret', text)}
                          required
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Business Number</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Business Number"
                          value={formData.businessNumber}
                          onChangeText={(text) => handleChange('businessNumber', text)}
                          required
                      />
                  </View>

                  <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Vendor Name</Text>
                                    <View style={styles.pickerContainer}>
                                          <Picker
                                            selectedValue={formData.vendorName}
                                            onValueChange={(value) =>
                                              setFormData(prev => ({ ...prev, vendorName: value }))
                                            }
                                            style={[styles.picker, errorMessages.firstMessage ? styles.inputError : null]}
                                          >
                                            <Picker.Item label="Vendor name" value="" />
                                            <Picker.Item label="twilio" value="twilio" />

                                          </Picker>
                                    </View>
                  </View>

                  <View style={[styles.inputGroup,{alignSelf:'center'}]}>
                    {isActiveToggleSwitch && <View>
                      <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isActive ? "#007AFF" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange= {toggleSwitch}
                            value={isActive}
                            style={styles.switch}
                        />
                      <Pressable onPress={toggleSwitch}>
                        <Text style={styles.label}>Active</Text>
                      </Pressable>
                    </View>}

                </View>
                <View style={{flexDirection:'row', width:'100%' ,zIndex: 1, marginTop:'1%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                        <View style={{margin:'5%'}}>
                            <Button mode="contained" onPress={() => addPhoneDataPress()} >
                                Add Phone
                            </Button>
                        </View>
                </View>
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
};

PhoneModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired
};

export default PhoneModal;

const styles = StyleSheet.create({
  slideContent: {
    marginTop:'5%',
    flex: 1,
    justifyContent: 'center',
    alignSelf:'center',
    alignItems: 'center',
    flexDirection: 'column',
    width:'50%',
    height:'60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5
    },

    borderRadius:12,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom:'5%',
  },
  input: {
    width: '150%',
    borderWidth: 1,
    marginTop: 15,
    borderColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  errorContainer: {
    height: 'auto',
    justifyContent: 'center',
    width: '80%',
    paddingHorizontal: 0,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 10,
    lineHeight: 12,
    flexWrap: 'wrap',
    textAlign: 'left',
    flexDirection: 'row',
    display: 'flex',
    wordBreak: 'break-word',
  },
  loadingContainer: {
    marginVertical: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  inputError: {
    borderColor: 'red',
  }
});