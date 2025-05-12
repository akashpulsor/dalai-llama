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
  KeyboardAvoidingView,
  useWindowDimensions,
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
  const initialFormState = {
    businessId: user || '',
    agentName: '',
    role: '',
    persona: '',
    voice: ''
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
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  // Add extra margin for Save Agent button in web view and increase modal height
  const fabCenteredStyle = isSmallScreen
    ? styles.fabCentered
    : [styles.fabCentered, { bottom: 30 }]; // Increased bottom space for web

  useEffect(() => {
    if (isAgentDataSuccess && agentData) {
      setFormData(agentData);
      dispatch(showMessage({
        message: 'Agent created successfully',
        type: 'info'
      }));
      setFormData({
        businessId: '',
        agentName: '',
        role: '',
        persona: '',
        voice: ''
      });
      onClose(false);
    }
  }, [isAgentDataSuccess, agentData]);

  const handleModalClose = () => {
    setFormData(initialFormState);
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
        return;
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
    } catch (err) {
      console.error("Agent creation failed:", err);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openModal}
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredView}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard,
            { width: isSmallScreen ? '98%' : 650, minHeight: isSmallScreen ? 600 : 600, paddingBottom: 24 }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create Agent</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <MaterialIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Form */}
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ padding: isSmallScreen ? 12 : 32, paddingBottom: 16 }} // Reduce bottom padding
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ width: '100%' }}>
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
                      errorMessages.persona ? styles.inputError : null,
                      styles.textArea
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
                {isAgentDataError && (
                  <Text style={[styles.label, { color: 'red', fontSize: 12 }]}>
                    {agentDataError}
                  </Text>
                )}
                {isAgentDataLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                )}
              </View>
            </ScrollView>
            {/* Centered Save Button */}
            <TouchableOpacity
              style={fabCenteredStyle}
              onPress={handleSaveAgent}
              disabled={isAgentDataLoading}
            >
              {isAgentDataLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fabText}>Save Agent</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 400,
    maxHeight: '95%',
    width: '98%',
    alignSelf: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  input: {
    width: '100%',
    height: 46,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
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
  loadingContainer: {
    marginVertical: 20,
  },
  fabCentered: {
    position: 'absolute',
    left: '50%',
    bottom: 32,
    transform: [{ translateX: -100 }],
    backgroundColor: '#007AFF',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
