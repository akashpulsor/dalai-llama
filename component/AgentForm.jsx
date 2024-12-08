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
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAddAgentMutation } from './authApi';

const AgentForm = ({ 
     onClose, openModal,
     item
 }) => {
  const [formData, setFormData] = useState(item);

  const [addAgent, { 
    data: agentData, 
    isLoading: isAgentDataLoading, 
    isSuccess: isAgentDataSuccess, 
    isError: isAgentDataError, 
    error: agentDataError 
  }] = useAddAgentMutation();

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const [errorMessages, setErrorMessages] = useState({});
  const [enabled, setEnabled] = useState(false);

  const handleSaveAgent = async () => {
    try {
        const errors = {};
        if (!formData.agentName) {
            errors.agentName = 'Agent name is required';
        }
        if (!formData.role) {
            errors.role = 'Agent Objective is required';
        }
        if (!formData.persona) {
            errors.persona = 'Agent Persona is required';
        }
        if (!formData.voice) {
            errors.voice = 'Agent voice is required';
        }
    
        setErrorMessages(errors);
        if (Object.keys(errors).length === 0) {
            await addAgent(formData);
        }
    } catch(err) {
        console.error("Agent creation failed:", err);
    }
  };

  const handleModalClose = () => {
    onClose(false);
  };

  useEffect(() => {
    console.log(item);
    if (isAgentDataSuccess && agentData) {
        setFormData(agentData);
        onClose(false);
    }
  }, [isAgentDataSuccess, agentData]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={openModal}
      onRequestClose={handleModalClose}
    >
      <View style={[styles.modalView]}>
            <TouchableOpacity
                style={{ justifyContent: 'center' }}
                onPress={handleModalClose}
            >
                <MaterialIcons name="cancel" size={24} color="gray" />
            </TouchableOpacity>
            <Text style={{ fontSize: 34, fontFamily: 'bold' }}>
                Edit Agent
            </Text>
            {isAgentDataLoading && (
                <ActivityIndicator size="large" color="#0000ff" />
            )}
            {isAgentDataError && (
                <Text style={[styles.label, { color: 'red', fontSize: 10 }]}>
                    {agentDataError}
                </Text>
            )}
            {isAgentDataSuccess && (
                <Text style={[styles.label, { color: 'green', fontSize: 12 }]}>
                    Agent saved successfully
                </Text>
            )}
          <View style={styles.centeredView}>
              <View style={styles.container}>
                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Name of Agent</Text>
                      <TextInput
                          style={[
                              styles.input,
                              !enabled && styles.disabledInput,
                              errorMessages.agentName && styles.inputError
                          ]}
                          value={formData.agentName}
                          onChangeText={(text) =>
                              setFormData((prev) => ({ ...prev, agentName: text }))
                          }
                          editable={enabled}
                          placeholder="Name of Agent"
                          placeholderTextColor={enabled ? '#666' : '#999'}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Role</Text>
                      <TextInput
                          style={[
                              styles.input,
                              !enabled && styles.disabledInput,
                              errorMessages.role && styles.inputError
                          ]}
                          value={formData.role}
                          onChangeText={(text) =>
                              setFormData((prev) => ({ ...prev, role: text }))
                          }
                          editable={enabled}
                          placeholder="Role"
                          placeholderTextColor={enabled ? '#666' : '#999'}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Persona of Agent</Text>
                      <TextInput
                          style={[
                              styles.input,
                              !enabled && styles.disabledInput,
                              errorMessages.persona && styles.inputError,
                              styles.textArea
                          ]}
                          value={formData.persona}
                          onChangeText={(text) =>
                              setFormData((prev) => ({ ...prev, persona: text }))
                          }
                          placeholder="Persona of Agent"
                          placeholderTextColor={enabled ? '#666' : '#999'}
                          multiline={true}
                          numberOfLines={8}
                          editable={enabled}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Voice Type</Text>
                      <View style={[
                          styles.pickerContainer,
                          !enabled && styles.disabledInput
                      ]}>
                          <Picker
                              selectedValue={formData.voice}
                              onValueChange={(value) =>
                                  setFormData((prev) => ({ ...prev, voice: value }))
                              }
                              style={[
                                  styles.picker,
                                  errorMessages.voice && styles.inputError,
                              ]}
                              enabled={enabled}
                          >
                              <Picker.Item 
                                label="Select a voice" 
                                value="" 
                                color={enabled ? '#000' : '#999'}
                              />
                              {voices.map((voice) => (
                                  <Picker.Item
                                      key={voice}
                                      label={voice.charAt(0).toUpperCase() + voice.slice(1)}
                                      value={voice}
                                      color={enabled ? '#000' : '#999'}
                                  />
                              ))}
                          </Picker>
                      </View>
                  </View>

                  <View style={[styles.inputGroup,{marginTop:'10%',width:'20%',alignSelf:'center'}]}>
                      {!enabled ? (
                        <Button mode="contained" onPress={() => setEnabled(true)}>
                          Edit Agent
                        </Button>
                      ) : (
                        <Button mode="contained" onPress={handleSaveAgent}>
                          Save Agent
                        </Button>
                      )}
                  </View>
              </View>
          </View>
      </View>
    </Modal>
  );
};

AgentForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    openModal : PropTypes.bool.isRequired,
    item: PropTypes.element.Object,
};

export default AgentForm;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width:'100%',
  },
  modalView: {
    marginTop:'2%',
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
    width: '50%',
    alignSelf:'center'
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
    color: '#000',
  },
  textArea: {
    height: 150,
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
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    width: '100%',
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