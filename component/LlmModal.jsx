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
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import { selectUser } from './authSlice';
import { useGetLlmDataListQuery, useAddLLMDataMutation } from './authApi';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';

const LlmModal = ({ onClose, openModal }) => {
  const user = useSelector(selectUser);
  const [errorMessages, setErrorMessages] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [isMulitModal, setIsMulitModal] = useState(true);
  const [isActiveToggleSwitch, setIsActiveToggleSwitch] = useState(false);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    llmId: '',
    businessId: user?.id,
    vendorName: '',
    apiKey: '',
    multiModal: false,
    modelName: '',
    modelUrl: '',
    friendlyName: '',
    logoImage: '',
    status: '',
    active: isActive,
  });

  const { data: llmDataList, error, isSuccess, isLoading, isError } = useGetLlmDataListQuery({ businessId: user?.id });
  const [addLLMData, { data: llmData, isLoading: isLlmDataLoading, isSuccess: isLlmDataSuccess, isError: isLlmDataError, error: llmDataError }] = useAddLLMDataMutation();

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

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
        multiModal: false,
        modelName: '',
        modelUrl: '',
        apiKey: '',
        friendlyName: '',
        logoImage: '',
        status: '',
        active: isActive,
      });
      setIsActiveToggleSwitch(false);
      onClose(false);
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
      apiKey: '',
      friendlyName: '',
      logoImage: '',
      multiModal: false,
      modelName: '',
      modelUrl: '',
      status: '',
      active: isActive,
    });
    setErrorMessages({});
    onClose(false);
  };

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

  const multiModalSwitch = () => {
    const newActiveState = !formData.multiModal;
    setFormData(prevState => ({
      ...prevState,
      multiModal: newActiveState
    }));
  };

  const models = [
    { label: 'OpenAI o3-mini', value: 'openai_o3_mini' },
    { label: 'OpenAI gpt-4o', value: 'gpt-4o' },
    { label: 'gpt-4o-realtime', value: 'gpt-4o-realtime-preview-2024-10-01' },
    { label: 'Google Gemini 2.0 Pro', value: 'google_gemini_2' },
    { label: 'DeepSeek R1', value: 'deepseek_r1' },
    { label: "Alibaba's Qwen 2.5 Max", value: 'alibaba_qwen_2_5_max' },
    { label: "Anthropic's Claude 3.7", value: 'anthropic_claude_3_7' },
    { label: 'Perplexity AI', value: 'perplexity_ai' },
    { label: "xAI's Grok 3", value: 'xai_grok_3' },
    { label: "Meta's Llama", value: 'meta_llama' },
    { label: "Tencent's Hunyuan Turbo S", value: 'tencent_hunyuan_turbo_s' },
  ];

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
            { width: isSmallScreen ? '98%' : 650 }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>LLM Data</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <MaterialIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Form */}
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ padding: isSmallScreen ? 12 : 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ width: '100%' }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Configured LLM</Text>
                  <View style={styles.pickerContainer}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                      </View>
                    ) : isError ? (
                      <Text style={styles.errorText}>Error loading LLM data</Text>
                    ) : (
                      <>
                        <Picker
                          selectedValue={formData.llmId}
                          onValueChange={(value) => {
                            if (value === "") {
                              setFormData({
                                llmId: '',
                                businessId: user?.id,
                                vendorName: '',
                                apiKey: '',
                                multiModal: false,
                                modelName: '',
                                modelUrl: '',
                                friendlyName: '',
                                logoImage: '',
                                status: '',
                                active: isActive,
                              });
                              setIsActiveToggleSwitch(false);
                              return;
                            }
                            const selectedLlm = llmDataList.find(llm => String(llm.llmId) === String(value));
                            if (selectedLlm) {
                              setFormData({
                                ...formData,
                                ...selectedLlm
                              });
                              setIsActiveToggleSwitch(true);
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
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Friendly Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Friendly Name"
                    value={formData.friendlyName}
                    onChangeText={(text) => handleChange('friendlyName', text)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Model Name</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.modelName}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, modelName: value }))
                      }
                      style={[
                        styles.picker,
                        errorMessages.firstMessage ? styles.inputError : null,
                      ]}
                    >
                      {models.map((model, index) => (
                        <Picker.Item key={index} label={model.label} value={model.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Model Url</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Model Url"
                    value={formData.modelUrl}
                    onChangeText={(text) => handleChange('modelUrl', text)}
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
                <View style={[styles.inputGroup, { alignSelf: 'center' }]}>
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
                <View style={[styles.inputGroup, { alignSelf: 'center' }]}>
                  <View>
                    <Switch
                      trackColor={{ false: "#767577", true: "#81b0ff" }}
                      thumbColor={isMulitModal ? "#007AFF" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={multiModalSwitch}
                      value={formData.multiModal}
                      style={styles.switch}
                    />
                    <Pressable onPress={multiModalSwitch}>
                      <Text style={styles.label}>MultiModal</Text>
                    </Pressable>
                  </View>
                </View>
                {isLlmDataError && (
                  <Text style={[styles.label, { color: 'red', fontSize: 12 }]}>
                    {llmDataError}
                  </Text>
                )}
                {isLlmDataLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                )}
              </View>
            </ScrollView>
            {/* Centered Add LLM Button */}
            <TouchableOpacity
              style={
                isSmallScreen
                  ? [styles.fabCentered, { paddingHorizontal: 18, minWidth: 140 }]
                  : [styles.fabCentered, { bottom: 24 }]
              }
              onPress={addLLMDataPress}
              disabled={isLlmDataLoading}
            >
              {isLlmDataLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fabText} numberOfLines={1}>Add LLM</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

LlmModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired
};

export default LlmModal;

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