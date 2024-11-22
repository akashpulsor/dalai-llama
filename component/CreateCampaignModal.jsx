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
import { Picker } from '@react-native-picker/picker';
import { useVerificationCodeMutation } from './authApi';


const CreateCampaignModal = ({ onClose, openModal, 
  campaignId = null, 
  onSaveAgent,
  createMode = false  }) => {
  const [isEditable, setIsEditable] = useState(createMode); 
  const [showEditButton, setShowEditButton] = useState(!createMode); 
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    description: '',
    firstMessage: '',
    language: '',
    duration: 0
  });

  useEffect(() => {

  }, []);

  const onCreateCampaignPress = async () => {
    handleModalClose();
  };

  const handleModalClose = () => {
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
                    <Text style={{fontSize:34, fontFamily:'bold'}}> Campaign Model</Text>
                    <ScrollView style={{width:'100%', borderRadius:8}}>
                        <View style={styles.container}>
                          <View style={styles.formContainer}>
                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Name of Campaign</Text>
                                  <TextInput
                                    style={styles.input}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter campaign name"
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Objective of Campaign</Text>
                                  <TextInput
                                    style={styles.input}
                                    value={formData.objective}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, objective: text }))}
                                    placeholder="Enter campaign objective"
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Campaign Description</Text>
                                  <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                    placeholder="Enter campaign description"
                                    multiline={true}
                                    numberOfLines={4}
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                    <Text style={styles.label}>First Message</Text>
                                    <TextInput
                                      style={[styles.input, styles.textArea]}
                                      value={formData.firstMessage}
                                      onChangeText={(text) => setFormData(prev => ({ ...prev, firstMessage: text }))}
                                      placeholder="Enter first message"
                                      multiline={true}
                                      numberOfLines={4}
                                    />
                              </View>

                              <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Language</Text>
                                    <View style={styles.pickerContainer}>
                                          <Picker
                                            selectedValue={formData.language}
                                            onValueChange={(value) =>
                                              setFormData(prev => ({ ...prev, language: value }))
                                            }
                                            style={styles.picker}
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
                                      style={styles.input}
                                      value={formData.duration.toString()}
                                      onChangeText={(text) =>
                                        setFormData(prev => ({
                                          ...prev,
                                          duration: Math.min(parseInt(text) || 0, 5)
                                        }))
                                      }
                                      placeholder="Enter duration (max 5 minutes)"
                                      keyboardType="numeric"
                                    />
                              </View>
                          </View>
                        </View>
                    </ScrollView>
                    <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                        <View style={{margin:'5%'}}>
                            <Button mode="contained" onPress={() => setIsEditable(false)} >
                                Add Campaign
                            </Button>
                        </View>

                        <View style={{margin:'5%'}}>
                            <Button mode="contained" onPress={() => setIsEditable(true)} >
                                Edit Campaign
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
    </Modal>

  );
};

CreateCampaignModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal : PropTypes.bool.isRequired
};

export default CreateCampaignModal;

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
    backgroundColor: '#d3d3d3',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    height: 100,
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
  }
});