import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAddAgentMutation } from './authApi';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';

const CreateAgentModal = ({ 
    onClose, 
    openModal,
    user
}) => {
    // Initialize all form fields with empty strings instead of undefined
    const initialFormState = {
      businessId: user || '',  // Ensure user is never undefined
      agentName: '',
      role: '',
      persona: '',
      voice: ''  // Initialize with empty string
    };

    const [formData, setFormData] = useState(initialFormState);
    const [addAgent, { 
      data: agentData, 
      isLoading: isAgentDataLoading, 
      isSuccess: isAgentDataSuccess, 
      isError: isAgentDataError, 
      error: agentDataError 
    }] = useAddAgentMutation();

    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const [errorMessages, setErrorMessages] = useState({});
    const dispatch = useDispatch();
    useEffect(() => {
        if (isAgentDataSuccess && agentData) {
            setFormData(agentData);
            dispatch(showMessage({
              message: 'Agent created successfully',
              type: 'info'
            }));
            setFormData({
                businessId: '',  // Ensure user is never undefined
                agentName: '',
                role: '',
                persona: '',
                voice: ''  // Initialize with empty string
            });
            onClose(false);

        }
    }, [isAgentDataSuccess, agentData]);

    const handleModalClose = () => {
      setFormData(initialFormState);  // Reset to initial state
      setErrorMessages({});
      onClose(false);
    };

    const handleSaveAgent = async () => {
        try {
            const newFormData = { 
                ...formData, 
                businessId: user
              };
              if (!newFormData.businessId) {
                dispatch(showMessage({
                  message: 'Business Id not present',
                  type: 'error'
                }));
                return; // Early return since businessId is critical
              }
            const errors = {};
            if (!newFormData.agentName) {
                errors.agentName = 'Agent name is required';
            }
            if (!newFormData.role) {
                errors.role = 'Agent Objective is required';
            }
            if (!newFormData.persona) {
                errors.persona = 'Agent Persona is required';
            }
            if (!newFormData.voice) {
                errors.voice = 'Agent voice is required';
            }
        
            setErrorMessages(errors);
            if (Object.keys(errors).length === 0) {
                await addAgent(newFormData);
            }
        } catch(err) {
            console.error("Agent creation failed:", err);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={openModal}
            onRequestClose={handleModalClose}
        >
            <View style={styles.centeredView}>
                <TouchableOpacity
                    style={{ justifyContent: 'center' }}
                    onPress={handleModalClose}
                >
                    <MaterialIcons name="cancel" size={24} color="gray" />
                </TouchableOpacity>
                <View style={styles.modalView}>
                    <Text style={{ fontSize: 34, fontFamily: 'bold' }}>
                        Create Agent
                    </Text>
   
                    {isAgentDataError && (
                        <Text style={[styles.label, { color: 'red', fontSize: 10 }]}>
                            {agentDataError}
                        </Text>
                    )}

                    {isAgentDataLoading &&  <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#0000ff" />
                    </View>}


                    <ScrollView style={styles.container}>
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name of Agent</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errorMessages.agentName ? styles.inputError : null
                                    ]}
                                    value={formData.agentName}
                                    onChangeText={(text) =>
                                        setFormData((prev) => ({ ...prev, agentName: text }))
                                    }
                                    placeholder="Name of Agent"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errorMessages.role ? styles.inputError : null
                                    ]}
                                    value={formData.role}
                                    onChangeText={(text) =>
                                        setFormData((prev) => ({ ...prev, role: text }))
                                    }
                                    placeholder="Role"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Persona of Agent</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errorMessages.persona ? styles.inputError : null
                                    ]}
                                    value={formData.persona}
                                    onChangeText={(text) =>
                                        setFormData((prev) => ({ ...prev, persona: text }))
                                    }
                                    placeholder="Persona of Agent"
                                    multiline={true}
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Voice Type</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.voice}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, voice: value }))
                                        }
                                        style={[
                                            styles.picker,
                                            errorMessages.voice ? styles.inputError : null
                                        ]}
                                    >
                                        <Picker.Item label="Select a voice" value="" />
                                        {voices.map((voice) => (
                                            <Picker.Item
                                                key={voice}
                                                label={voice.charAt(0).toUpperCase() + voice.slice(1)}
                                                value={voice}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <View style={styles.buttonWrapper}>
                            <Button mode="contained" onPress={handleSaveAgent}>
                                Save Agent
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

CreateAgentModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    openModal: PropTypes.bool.isRequired,
    user: PropTypes.string.isRequired
};

export default CreateAgentModal;
  
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 2.5,
    height: '90%',
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
    width: '80%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: Platform.OS === 'ios' ? 15 : 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 8,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0', // Gray out disabled input
    color: '#b0b0b0', // Optional: change text color for disabled fields
  },
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
    zIndex: 1,
    marginTop: '45%',
    alignSelf: 'flex-end',
    alignContent: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    margin: '5%',
  },
  inputError: {
    borderColor: 'red',
  }
});
