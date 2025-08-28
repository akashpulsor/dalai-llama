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
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAddCampaignMutation } from './authApi';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../component/authSlice';
import { showMessage } from './flashMessageSlice';

const CreateCampaignModal = ({ onClose, openModal }) => {
  const user = useSelector(selectUser);
  const [addCampaign, { data: campaignData, isLoading: isCampaignDataLoading, isSuccess: isCampaignDataSuccess, isError: isCampaignDataError, error: campaignDataError }] = useAddCampaignMutation();
  const [errorMessages, setErrorMessages] = useState({});
  const [formData, setFormData] = useState({
    businessId: '',
    campaignImgUrl: '',
    campaignName: '',
    campaignAim: '',
    conversationGuideLines: '',
    campaignDesc: '',
    firstMessage: '',
    handlingFaq: '',
    placingOrder: '',
    language: '',
    duration: 2,
    campaignType: 'OUT_BOUND'
  });
  const dispatch = useDispatch();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  useEffect(() => {
    if (isCampaignDataSuccess) {
      setFormData(campaignData);
      dispatch(showMessage({
        message: 'Campaign created successfully',
        type: 'info'
      }));
      setFormData({
        businessId: '',
        campaignImgUrl: '',
        campaignName: '',
        campaignAim: '',
        conversationGuideLines: '',
        campaignDesc: '',
        firstMessage: '',
        handlingFaq: '',
        placingOrder: '',
        language: '',
        duration: 2,
        campaignType: 'OUT_BOUND'
      });
      onClose(false);
    }
  }, [isCampaignDataSuccess]);

  const onCreateCampaignPress = async () => {
    try {
      const newFormData = {
        ...formData,
        businessId: user?.id
      };
      if (!newFormData.businessId) {
        dispatch(showMessage({
          message: 'Business Id not present',
          type: 'error'
        }));
        return;
      }
      const errors = {};
      if (!newFormData.campaignName) {
        errors.campaignName = 'Campaign name is required';
      }
      if (!newFormData.campaignAim) {
        errors.campaignAim = 'Campaign Objective is required';
      }
      if (!newFormData.conversationGuideLines) {
        errors.conversationGuideLines = 'Conversation Guidelines is required';
      }
      if (!newFormData.campaignDesc) {
        errors.campaignDesc = 'Campaign Description is required';
      }
      if (!newFormData.firstMessage) {
        errors.firstMessage = 'First Message is required';
      }
      if (!newFormData.language) {
        errors.language = 'Language is required';
      }
      if (!newFormData.duration) {
        errors.duration = 'Duration is required and should be between 2 and 5';
      }
      setErrorMessages(errors);
      if (Object.keys(errors).length === 0) {
        addCampaign(newFormData);
      }
    } catch (err) {
      console.log('Error submitting campaign:', err);
    }
  };

  const handleModalClose = () => {
    setFormData({
      businessId: '',
      campaignImgUrl: '',
      campaignName: '',
      campaignAim: '',
      conversationGuideLines: '',
      campaignDesc: '',
      firstMessage: '',
      handlingFaq: '',
      placingOrder: '',
      language: '',
      duration: 2,
      campaignType: 'OUT_BOUND'
    });
    setErrorMessages({});
    onClose(false);
  };

  // Responsive button style
  const fabCenteredStyle = isSmallScreen
    ? [styles.fabCentered, { paddingHorizontal: 18, minWidth: 140 }]
    : [styles.fabCentered, { bottom: 24 }];

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
              <Text style={styles.headerTitle}>Create Campaign</Text>
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
                  <Text style={styles.label}>Name of Campaign</Text>
                  <TextInput
                    style={[styles.input, errorMessages.campaignName ? styles.inputError : null]}
                    value={formData.campaignName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignName: text }))}
                    placeholder="Enter campaign name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Objective of Campaign</Text>
                  <TextInput
                    style={[styles.input, errorMessages.campaignAim ? styles.inputError : null]}
                    value={formData.campaignAim}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignAim: text }))}
                    placeholder="Enter campaign objective"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Campaign Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errorMessages.campaignDesc ? styles.inputError : null]}
                    value={formData.campaignDesc}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignDesc: text }))}
                    placeholder="Enter campaign description"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Conversation GuideLines</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errorMessages.conversationGuideLines ? styles.inputError : null]}
                    value={formData.conversationGuideLines}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, conversationGuideLines: text }))}
                    placeholder="Enter Conversation Guidelines"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errorMessages.firstMessage ? styles.inputError : null]}
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
                      style={[styles.picker, errorMessages.language ? styles.inputError : null]}
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
                  <Text style={styles.label}>Campaign Type</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.campaignType}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, campaignType: value }))
                      }
                      style={[styles.picker, errorMessages.language ? styles.inputError : null]}
                    >
                      <Picker.Item label="Select a campaign type" value="" />
                      <Picker.Item label="OUT_BOUND" value="OUT_BOUND" />
                      <Picker.Item label="IN_BOUND" value="IN_BOUND" />
                  
                    </Picker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Duration (minutes)</Text>
                  <TextInput
                    style={[styles.input, errorMessages.duration ? styles.inputError : null]}
                    value={formData.duration.toString()}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        duration: Math.min(parseInt(text) || 2, 5)
                      }))
                    }
                    placeholder="Enter duration (max 5 minutes)"
                    keyboardType="numeric"
                  />
                </View>
                {isCampaignDataError && (
                  <Text style={[styles.label, { color: 'red', fontSize: 12 }]}>
                    {campaignDataError}
                  </Text>
                )}
                {isCampaignDataLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                )}
              </View>
            </ScrollView>
            {/* Centered Add Campaign Button */}
            <TouchableOpacity
              style={fabCenteredStyle}
              onPress={onCreateCampaignPress}
              disabled={isCampaignDataLoading}
            >
              {isCampaignDataLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fabText} numberOfLines={1}>Add Campaign</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

CreateCampaignModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired
};

export default CreateCampaignModal;

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