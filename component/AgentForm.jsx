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
      <View style={styles.glassBg}>
        <View style={styles.glassCard}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleModalClose}
          >
            <MaterialIcons name="cancel" size={28} color="#8e24aa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Agent</Text>
          {isAgentDataLoading && (
            <ActivityIndicator size="large" color="#7c3aed" />
          )}
          {isAgentDataError && (
            <Text style={[styles.label, { color: 'red', fontSize: 12 }]}> {agentDataError} </Text>
          )}
          {isAgentDataSuccess && (
            <Text style={[styles.label, { color: 'green', fontSize: 13 }]}> Agent saved successfully </Text>
          )}
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name of Agent</Text>
              <TextInput
                style={[
                  styles.input,
                  !enabled && styles.disabledInput,
                  errorMessages.agentName && styles.inputError
                ]}
                value={formData.agentName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, agentName: text }))}
                editable={enabled}
                placeholder="Name of Agent"
                placeholderTextColor={enabled ? '#666' : '#bbb'}
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
                onChangeText={(text) => setFormData((prev) => ({ ...prev, role: text }))}
                editable={enabled}
                placeholder="Role"
                placeholderTextColor={enabled ? '#666' : '#bbb'}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Persona of Agent</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  !enabled && styles.disabledInput,
                  errorMessages.persona && styles.inputError
                ]}
                value={formData.persona}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, persona: text }))}
                placeholder="Persona of Agent"
                placeholderTextColor={enabled ? '#666' : '#bbb'}
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, voice: value }))}
                  style={[
                    styles.picker,
                    errorMessages.voice && styles.inputError,
                  ]}
                  enabled={enabled}
                >
                  <Picker.Item label="Select a voice" value="" color={enabled ? '#000' : '#bbb'} />
                  {voices.map((voice) => (
                    <Picker.Item
                      key={voice}
                      label={voice.charAt(0).toUpperCase() + voice.slice(1)}
                      value={voice}
                      color={enabled ? '#000' : '#bbb'}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.buttonRow}>
              {!enabled ? (
                <Button mode="contained" onPress={() => setEnabled(true)} style={styles.actionBtn}>
                  Edit Agent
                </Button>
              ) : (
                <Button mode="contained" onPress={handleSaveAgent} style={styles.actionBtn}>
                  Save Agent
                </Button>
              )}
            </View>
          </ScrollView>
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
  glassBg: {
    flex: 1,
    backgroundColor: 'rgba(30,0,60,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: 32,
    width: 420,
    maxWidth: '98%',
    alignItems: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#8e24aa',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  formScroll: {
    width: '100%',
    paddingBottom: 18,
  },
  inputGroup: {
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#7c3aed',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafd',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e3e8fd',
    color: '#222',
    marginBottom: 2,
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e3e8fd',
    overflow: 'hidden',
    marginBottom: 2,
  },
  picker: {
    height: 50,
    borderRadius: 8,
    color: '#222',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#bbb',
  },
  inputError: {
    borderColor: '#ff1744',
    backgroundColor: '#fff0f0',
  },
  buttonRow: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    width: '80%',
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignSelf: 'center',
    marginTop: 8,
  },
});