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
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import PropTypes from 'prop-types';
import { MaterialIcons } from '@expo/vector-icons';
import { useAddLeadMutation } from './authApi';
import { Picker } from '@react-native-picker/picker';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../component/authSlice';
import { showMessage } from './flashMessageSlice';
import WorldwideAddressPicker from './WorldwideAddressPicker';
import {
  isValidEmail,
  isValidPhone,
  cleanContactData,
} from '../helper/utils';


const AddLeadModal = ({ onClose, openModal }) => {
  const user = useSelector(selectUser);
  const [addLead, { isLoading: isLeadDataLoading, isSuccess: isLeadDataSuccess, isError: isLeadDataError, error: LeadDataError }] = useAddLeadMutation();
  const [errorMessages, setErrorMessages] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCountryCode: '+91',
    test: false,
    whatsapp: '',
    whatsappCountryCode: '+91',
    gender: '',
    address: {
      country: { name: '', code: '', flag: '' },
      streetAddress: '',
      apartment: '',
      postalCode: '',
      formattedAddress: ''
    }
  });
  const dispatch = useDispatch();
  const [isTestEnabled, setIsTestEnabled] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  useEffect(() => {
    if (isLeadDataSuccess) {
      dispatch(showMessage({
        message: 'Lead created successfully',
        type: 'info'
      }));
      resetForm();
      onClose(false);
    }
    // eslint-disable-next-line
  }, [isLeadDataSuccess]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      phoneCountryCode: '+91',
      whatsapp: '',
      whatsappCountryCode: '+91',
      gender: '',
      address: {
        country: { name: '', code: '', flag: '' },
        streetAddress: '',
        apartment: '',
        postalCode: '',
        formattedAddress: ''
      }
    });
    setErrorMessages({});
  };

  const validatePhoneNumber = (phone, countryCode) => {
    try {
      return isValidPhone(countryCode + phone);
    } catch {
      return false;
    }
  };

  const onAddLeadPress = async () => {
    const newFormData = {
      ...formData,
      businessId: user?.id,
      test: isTestEnabled
    };

    if (!newFormData.businessId) {
      dispatch(showMessage({
        message: 'Business Id not present',
        type: 'error'
      }));
      return;
    }

    const errors = {};
    if (!newFormData.phone) {
      errors.phone = 'Phone is required';
    } else if (!validatePhoneNumber(newFormData.phone, newFormData.phoneCountryCode)) {
      errors.phone = 'Please enter a valid phone number (e.g., +1234567890)';
    }
    if (!newFormData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(newFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (newFormData.whatsapp && !validatePhoneNumber(newFormData.whatsapp, newFormData.whatsappCountryCode)) {
      errors.whatsapp = 'Please enter a valid WhatsApp number with country code (e.g., +1234567890)';
    }
    ['phone', 'email', 'whatsapp'].forEach(field => {
      if (newFormData[field] && newFormData[field].trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`;
      }
    });

    setErrorMessages(errors);

    if (Object.keys(errors).length === 0) {
      const cleanedFormData = cleanContactData(newFormData);
      addLead(cleanedFormData);
    }
  };

  const handleModalClose = () => {
    resetForm();
    onClose(false);
  };

  const handleChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePhoneChange = (text, field) => {
    handleChange(field, text);
    if (errorMessages[field]) {
      setErrorMessages(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddressChange = (address) => {
    handleChange("address", address);
  };

  const handleCountrySelect = (field, country) => {
    handleChange(field, country.code);
  };

  // Responsive layout: 2 columns on large screens, 1 column on mobile
  const formRowStyle = isSmallScreen
    ? { flexDirection: 'column', gap: 0 }
    : { flexDirection: 'row', gap: 16, alignItems: 'flex-start' };

  const formColStyle = isSmallScreen
    ? { width: '100%' }
    : { width: '48%' };

  const addressColStyle = isSmallScreen
    ? { width: '100%' }
    : { width: '48%', marginLeft: 8 };

  // Add extra margin for test lead and button in web view
  const testLeadRowStyle = isSmallScreen
    ? {}
    : { marginTop: 40 };

  const fabCenteredStyle = isSmallScreen
    ? styles.fabCentered
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
            { width: isSmallScreen ? '98%' : 650 } // Decreased width for web
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Lead</Text>
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
              <View style={[formRowStyle, { width: '100%' }]}>
                {/* Left Column */}
                <View style={formColStyle}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name of Lead</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
                      value={formData.name}
                      onChangeText={(text) => handleChange('name', text)}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={[styles.input, errorMessages.email && styles.inputError]}
                      placeholder="Email"
                      keyboardType="email-address"
                      value={formData.email}
                      onChangeText={(text) => handleChange('email', text)}
                    />
                    {errorMessages.email && (
                      <Text style={styles.errorText}>{errorMessages.email}</Text>
                    )}
                  </View>
                  {/* Simple Phone Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <View style={styles.simplePhoneRow}>
                      <TextInput
                        style={styles.countryCodeInput}
                        value={formData.phoneCountryCode}
                        onChangeText={(text) => handleChange('phoneCountryCode', text)}
                        placeholder="+91"
                        maxLength={4}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          errorMessages.phone && styles.inputError,
                          { flex: 1, marginLeft: 8 }
                        ]}
                        placeholder="234 567 8900"
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(text) => handlePhoneChange(text, 'phone')}
                      />
                    </View>
                    {errorMessages.phone && (
                      <Text style={styles.errorText}>{errorMessages.phone}</Text>
                    )}
                  </View>
                  {/* Simple WhatsApp Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>WhatsApp</Text>
                    <View style={styles.simplePhoneRow}>
                      <TextInput
                        style={styles.countryCodeInput}
                        value={formData.whatsappCountryCode}
                        onChangeText={(text) => handleChange('whatsappCountryCode', text)}
                        placeholder="+91"
                        maxLength={4}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          errorMessages.whatsapp && styles.inputError,
                          { flex: 1, marginLeft: 8 }
                        ]}
                        placeholder="234 567 8900"
                        keyboardType="phone-pad"
                        value={formData.whatsapp}
                        onChangeText={(text) => handlePhoneChange(text, 'whatsapp')}
                      />
                    </View>
                    {errorMessages.whatsapp && (
                      <Text style={styles.errorText}>{errorMessages.whatsapp}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.gender}
                        onValueChange={(value) =>
                          setFormData(prev => ({ ...prev, gender: value }))
                        }
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                        <Picker.Item label="Prefer Not to Say" value="prefer-not-to-say" />
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={[styles.switchRow, testLeadRowStyle]}>
                      <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isTestEnabled ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => setIsTestEnabled(prev => !prev)}
                        value={isTestEnabled}
                        style={styles.switch}
                      />
                      <Pressable onPress={() => setIsTestEnabled(prev => !prev)}>
                        <Text style={styles.label}>Test User</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                {/* Right Column */}
                <View style={addressColStyle}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <WorldwideAddressPicker
                      isEditMode={true}
                      initialAddress={formData.address}
                      onAddressChange={handleAddressChange}
                      onSubmit={handleAddressChange}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
            {/* Floating Action Button */}
            <TouchableOpacity
              style={fabCenteredStyle}
              onPress={onAddLeadPress}
              disabled={isLeadDataLoading}
            >
              {isLeadDataLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fabText}>Add Lead</Text>
              )}
            </TouchableOpacity>
            {isLeadDataError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>
                  {LeadDataError?.data?.message || 'Failed to add lead.'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

AddLeadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired,
};

export default AddLeadModal;

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
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#ffeaea',
    padding: 10,
    borderRadius: 8,
    margin: 12,
    alignItems: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  pickerContainer: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginTop: 2,
  },
  picker: {
    height: 46,
    borderRadius: 8,
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
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
  simplePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 0,
  },
  countryCodeInput: {
    width: 56,
    height: 46,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});