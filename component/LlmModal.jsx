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
import {selectUser } from './authSlice';
import { useGetLlmDataListQuery, useAddLLMDataMutation } from './authApi';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';

const LlmModal = ({ onClose , openModal}) => {
  const user =  useSelector(selectUser);
  const [errorMessages, setErrorMessages] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [isActiveToggleSwitch, setIsActiveToggleSwitch] = useState(false);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    llmId: '',
    businessId: user?.id,
    vendorName: '',
    apiKey:'',
    friendlyName: '',
    logoImage: '',
    status: '',
    active: isActive,
  });

  const { 
    data: llmDataList, 
    error, 
    isSuccess, 
    isLoading, 
    isError 
} = useGetLlmDataListQuery({businessId: user?.id});
const [addLLMData, { data: llmData, isLoading:isLlmDataLoading, isSuccess:isLlmDataSuccess, isError:isLlmDataError, error:llmDataError }] = useAddLLMDataMutation();
useEffect(() => {
    if (isLlmDataSuccess && llmData) {
      setFormData(llmData);
      dispatch(showMessage({
        message: 'LLM Data added successfully',
        type: 'info'
      }));
      setFormData({
        llmId: '',
        businessId: user?.id,
        vendorName: '',
        apiKey:'',
        friendlyName: '',
        logoImage: '',
        status: '',
        active: isActive,
      });
      setIsActiveToggleSwitch(false);
      onClose(false);
  }

  if(isSuccess){
    console.log(llmDataList);
  }
}, [llmDataList, isLlmDataSuccess, isSuccess]);

  const addLLMDataPress = async () => {
     addLLMData(formData);
  };

  const handleModalClose = () => {
    setFormData({
          llmId: '',
          businessId: user?.id,
          vendorName: '',
          apiKey:'',
          friendlyName: '',
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

  const toggleSwitch = () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    setFormData(prevState => ({
      ...prevState,
      active: newActiveState
    }));
  };

  // Assuming phoneDataList is passed as a prop

  const handleLlmSelection = (data) => {
        // Return early if no ID provided
        console.log(data)
        setFormData(data);
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
            <Text style={{fontSize:34, fontFamily:'bold',alignSelf:'center'}}>LLM Data</Text>
              
            <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Configured LLM</Text>
                    <View style={styles.pickerContainer}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#0000ff" />
                      </View>
                    ) : isError ? (
                      <Text style={styles.errorText}>Error loading LLM data</Text>
                    ) : (
                      <>
                      <Picker
                            selectedValue={formData.llmId}
                            onValueChange={(value) => {
                              console.log('Selected Value:', value);
                              console.log('LLM Data List:', llmDataList);
                              console.log('Current Form Data:', formData);
                              
                              const selectedLlm = llmDataList.find(llm => {
                                console.log('Comparing:', {
                                  currentLlmId: llm.llmId,
                                  currentLlmIdType: typeof llm.llmId,
                                  selectedValue: value,
                                  selectedValueType: typeof value,
                                  isMatch: String(llm.llmId) === String(value)
                                });
                                return String(llm.llmId) === String(value);  // Convert both to strings for comparison
                              });
                              
                              console.log('Selected LLM:', selectedLlm);
                              if (selectedLlm) {
                                console.log('Updating form with selected LLM:', selectedLlm);
                                setFormData({
                                  ...formData,
                                  ...selectedLlm
                                });
                                setIsActiveToggleSwitch(true);
                              } else {
                                console.log('No matching LLM found for value:', value);
                              }
                            }}
                            style={[
                              styles.picker,
                              errorMessages?.llmId && styles.inputError
                            ]}
                            enabled={!isLoading && llmDataList.length > 0}
                          >
                          <Picker.Item label="Select LLM" value="" />
                          {llmDataList.map((llmData) => (
                            <Picker.Item
                              key={llmData.llmId}
                              label={llmData.friendlyName}
                              value={llmData.llmId}
                            />
                          ))}
                        </Picker>
                        {errorMessages?.firstMessage && (
                          <Text style={styles.errorText}>{errorMessages.firstMessage}</Text>
                        )}
                      </>
                    )}
                  </View>
                  </View>
                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>API Key</Text>
                      <TextInput
                          style={styles.input}
                          placeholder="Api Key"
                          value={formData.apiKey}
                          onChangeText={(text) => handleChange('apiKey', text)}
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
                                            <Picker.Item label="openAi" value="openAi" />

                                          </Picker>
                                    </View>
                  </View>

                  <View style={[styles.inputGroup,{alignSelf:'center'}]}>
                    {isActiveToggleSwitch && <View>
                      <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isActive ? "#007AFF" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleSwitch}
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
                            <Button mode="contained" onPress={() => addLLMDataPress()} >
                                Add LLM
                            </Button>
                        </View>
                </View>
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
};

LlmModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired
};

export default LlmModal;

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