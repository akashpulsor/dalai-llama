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
import { useVerificationCodeMutation } from './authApi'; // Assuming this is your API call hook

const CreateAgentModal = ({ 
    onClose, 
    openModal, 
    agentId = null, 
    onSaveAgent,
    createMode = false 
  }) => {
    const [formData, setFormData] = useState({
      name: '',
      role: '',
      persona: '',
      voice: ''
    });
    const [loading, setLoading] = useState(false);
    const [isEditable, setIsEditable] = useState(createMode);
    const [showEditButton, setShowEditButton] = useState(!createMode);
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  
    // Fetch agent data when in edit mode
    useEffect(() => {
  
    }, [agentId]);
  
    // Fetch agent data
    const fetchAgentData = async (id) => {
      //setLoading(true);

    };
  
    // Reset form and close modal
    const handleModalClose = () => {
      setFormData({
        name: '',
        role: '',
        persona: '',
        voice: ''
      });
      setIsEditable(false);
      setShowEditButton(true);
      onClose(false);
    };
  
    // Enable editing
    const handleEditAgent = () => {
        setIsEditable(true);
        if(!createMode){
            setShowEditButton(false);
        }
        
    };
  
    // Save agent (create or update)
    const handleSaveAgent = () => {
        onSaveAgent(formData, agentId!=null ? agentId : null);
        setIsEditable(false);
        handleModalClose();
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
              {createMode ? 'Create Agent' : 'Edit Agent'}
            </Text>
            <ScrollView style={styles.container}>
              <View style={styles.formContainer}>
                {loading ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Name of Agent</Text>
                      <TextInput
                        style={[styles.input, !isEditable && styles.disabledInput]}
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, name: text }))
                        }
                        placeholder="Name of Agent"
                        editable={isEditable}
                      />
                    </View>
  
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Role</Text>
                      <TextInput
                        style={[styles.input, !isEditable && styles.disabledInput]}
                        value={formData.role}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, role: text }))
                        }
                        placeholder="Role"
                        editable={isEditable}
                      />
                    </View>
  
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Persona of Agent</Text>
                      <TextInput
                        style={[styles.input, styles.textArea, !isEditable && styles.disabledInput]}
                        value={formData.persona}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, persona: text }))
                        }
                        placeholder="Persona of Agent"
                        multiline={true}
                        numberOfLines={4}
                        editable={isEditable}
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
                          style={styles.picker}
                          enabled={isEditable}
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
                  </>
                )}
              </View>
            </ScrollView>
  
            <View style={styles.buttonContainer}>
              <View style={styles.buttonWrapper}>
                {(!createMode) ? (
                  showEditButton ? <Button mode="contained" onPress={handleEditAgent}>
                    Edit Agent
                  </Button> :   <Button mode="contained" onPress={handleSaveAgent}>
                    Save Agent
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
  
  CreateAgentModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    openModal: PropTypes.bool.isRequired,
    agentId: PropTypes.string,
    onSaveAgent: PropTypes.func.isRequired,
    createMode: PropTypes.bool,
    
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
});
