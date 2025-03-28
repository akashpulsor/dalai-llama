import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectUser } from './authSlice';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { useGetLlmDataListQuery, useGenerateContextMutation, useAddPortalMutation } from './authApi';
import { Picker } from '@react-native-picker/picker';


const PortalRunModal = ({ visible, onClose, portalData, onConfigure, onUpdate }) => {
  const [formData, setFormData] = useState({
    portalId: portalData.portalId,
    userName: portalData.userName,
    password: portalData.password,
    portalName: portalData.portalName,
    portalDescription: portalData.portalDescription,
    intent: portalData.intents.find(intent => intent.intentName === "ROOT")?.description || null,
    campaignId: '',
    steps: [...portalData.intents]
      .sort((a, b) => a.intentId - b.intentId)
      .map(intent => intent.description)
      .join(' | '),
    baseUrl: portalData.baseUrl,
    llmId: ''
  });
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLlmId, setSelectedLlmId] = useState(null);

  const { data: llmDataList, isSuccess: isLlmDataListSuccess, error: llmDataListError, isLoading: isLlmDataListLoading, isError: isLlmDataListError } = useGetLlmDataListQuery({
    businessId: user?.id,
  });



  const validateForm = () => {
    const newErrors = {};
    if (!formData.intent.trim()) {
      newErrors.intent = 'Intent is required';
    }
    if (!formData.steps.trim()) {
      newErrors.steps = 'Steps are required';
    }
    if (!formData.userName.trim()) {
      newErrors.username = 'User name is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigure = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await addPortal({
        ...formData,
        businessId: user?.id,
        baseUrl: portalUrl
      });
      onClose();
    } catch (error) {
      console.error('Error configuring portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickerSelect = (itemValue) => {
    // Update the state with the selected LLM ID
    setSelectedLlmId(itemValue);
    {(text) => setFormData({ ...formData, llmId: itemValue })}
    if (itemValue) {
      // Call your specific function when a valid multimodal LLM is selected
       generateContext({llmId:itemValue, url: portalUrl})
      
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="cancel" size={24} color="gray" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Run Portal</Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Large Language Model</Text>
              <View style={styles.pickerContainer}>
                {isLlmDataListLoading ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : isLlmDataListError ? (
                  <Text style={styles.errorText}>Error loading LLM</Text>
                ) : (
                  <Picker
                    selectedValue={formData.llmId}
                    onValueChange={(itemValue) => {
                      setFormData({ ...formData, llmId: itemValue });
                      setIsFormEnabled(true);
                      if (itemValue) {
                        //generateContext({ businessId: user?.id,llmId: itemValue, portalUrl: portalUrl });
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select an LLM" value="" />
                    {llmDataList?.filter(llmData => llmData.multiModal === true).map((llmData) => (
                        //TODO fix thi later
                      <Picker.Item
                        key={llmData.llmId}
                        label={`${llmData.friendlyName} - ${llmData.modelName}`}
                        value={llmData.llmId}
                      />
                    ))}
                  </Picker>
                )}
              </View>
              {!isFormEnabled && formData.llmId === '' && (
                <Text style={styles.helperText}>Please select an LLM to enable the form</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website Url</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.baseUrl}
                editable={false}
                placeholder="Website Url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website Name</Text>
              <TextInput
                style={[styles.input,  styles.disabledInput]}
                value={formData.portalName}
                onChangeText={(text) => setFormData({ ...formData, portalName: text })}
                editable={false}
                placeholder="Enter name Website name, you can personalize .."
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                   styles.disabledInput
                ]}
                value={formData.portalDescription}
                onChangeText={(text) => setFormData({ ...formData, portalDescription: text })}
                placeholder="Enter website description"
                multiline
                numberOfLines={3}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Campaign Id</Text>
              <TextInput
                style={[styles.input, !isFormEnabled && styles.disabledInput]}
                value={formData.campaignId}
                onChangeText={(text) => setFormData({ ...formData, campaignId: text })}
                placeholder="Add campaign id, you can get it from campaign Dashboard"
                editable={isFormEnabled}
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Intent</Text>
              <TextInput
                style={[styles.input, styles.textArea,  styles.disabledInput]}
                value={formData.intent}
                onChangeText={(text) => setFormData({ ...formData, intent: text })}
                placeholder="What do you want to achieve with this portal?"
                multiline
                numberOfLines={3}
                editable={false}
              />
              {errors.intent && <Text style={styles.errorText}>{errors.intent}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Steps</Text>
              <TextInput
                style={[styles.input, styles.textArea,  styles.disabledInput]}
                value={formData.steps}
                onChangeText={(text) => setFormData({ ...formData, steps: text })}
                placeholder="What steps are required to achieve this?"
                multiline
                numberOfLines={4}
                editable={false}
              />
              {errors.steps && <Text style={styles.errorText}>{errors.steps}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.configureButton,
                (!isFormEnabled || isLoading) && styles.disabledButton
              ]}
              onPress={handleConfigure}
              disabled={!isFormEnabled || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Initialize</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#d3d3d3',
    borderRadius: 12,
    width: '50%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#aaa',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  disabledBorder: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  configureButton: {
    backgroundColor: '#4285f4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    position: 'relative',
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
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
  }
});

export default PortalRunModal;