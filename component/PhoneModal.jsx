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
import { selectUser } from '../component/authSlice';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import { useGetPhoneDataListQuery, useAddPhoneDataMutation } from './authApi';

const PhoneModal = ({ onClose, openModal }) => {
  const user = useSelector(selectUser);
  const [errorMessages, setErrorMessages] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [isActiveToggleSwitch, setIsActiveToggleSwitch] = useState(false);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    phoneId: '',
    businessId: user?.id,
    vendorName: '',
    accountAuthToken: '',
    accountSid: '',
    friendlyName: '',
    businessNumber: '',
    callSecret: '',
    logoImage: '',
    status: '',
    active: isActive,
  });

  const { data: phoneDataList, error, isSuccess, isLoading, isError } = useGetPhoneDataListQuery({ businessId: user?.id });

  const [addPhoneData, { data: phoneData, isLoading: isPhoneDataLoading, isSuccess: isPhoneDataSuccess, isError: isPhoneDataError, error: phoneDataError }] = useAddPhoneDataMutation();

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  useEffect(() => {
    if (isPhoneDataSuccess && phoneData) {
      setFormData(phoneData);
      dispatch(showMessage({
        message: 'Phone Data added successfully',
        type: 'info'
      }));
      setFormData({
        phoneId: '',
        businessId: user?.id,
        vendorName: '',
        accountAuthToken: '',
        accountSid: '',
        friendlyName: '',
        businessNumber: '',
        callSecret: '',
        logoImage: '',
        status: '',
        active: isActive,
      });
      setIsActiveToggleSwitch(false);
      onClose(false);
    }
  }, [phoneDataList, isPhoneDataSuccess, isSuccess]);

  const addPhoneDataPress = async () => {
    addPhoneData(formData);
  };

  const handleModalClose = () => {
    setFormData({
      phoneId: '',
      businessId: user?.id,
      vendorName: '',
      accountAuthToken: '',
      accountSid: '',
      friendlyName: '',
      businessNumber: '',
      callSecret: '',
      logoImage: '',
      status: '',
      phoneNumberSid:'',
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

  const handlePhoneSelection = (businessNumber) => {
    const selectedPhone = phoneDataList.find(phone => phone.businessNumber === businessNumber);
    if (selectedPhone) {
      setFormData({
        phoneId: selectedPhone.phoneId,
        businessId: selectedPhone.businessId,
        vendorName: selectedPhone.vendorName,
        accountAuthToken: selectedPhone.accountAuthToken,
        accountSid: selectedPhone.accountSid,
        friendlyName: selectedPhone.friendlyName,
        businessNumber: selectedPhone.businessNumber,
        callSecret: selectedPhone.callSecret,
        logoImage: selectedPhone.logoImage,
        status: selectedPhone.status,
        active: selectedPhone.active,
        phoneNumberSid: selectedPhone.phoneNumberSid
      });
      setIsActiveToggleSwitch(true);
    }
  };

  // Responsive button style
  const fabCenteredStyle = isSmallScreen
    ? [
        styles.fabCentered,
        {
          left: '60%',
          transform: [{ translateX: -100 }],
          paddingHorizontal: 18,
          minWidth: 140,
          justifyContent: 'center',
          alignItems: 'center',
        }
      ]
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
              <Text style={styles.headerTitle}>Phone Data</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <MaterialIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* Form */}
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={{ padding: isSmallScreen ? 12 : 32, paddingBottom: 80 }} // Add extra bottom padding for button
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ width: '100%' }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Configured Phone</Text>
                  <View style={styles.pickerContainer}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                      </View>
                    ) : isError ? (
                      <Text style={styles.errorText}>Error loading phone data</Text>
                    ) : (
                      <Picker
                        selectedValue={formData.businessNumber}
                        onValueChange={handlePhoneSelection}
                        style={[
                          styles.picker,
                          errorMessages?.firstMessage ? styles.inputError : null
                        ]}
                      >
                        <Picker.Item label="Select Business Number" value="" />
                        {Array.isArray(phoneDataList) && phoneDataList.map((phone) => (
                          <Picker.Item
                            key={phone.phoneId}
                            label={phone.businessNumber}
                            value={phone.businessNumber}
                          />
                        ))}
                      </Picker>
                    )}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Auth Token</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Account Auth Token"
                    value={formData.accountAuthToken}
                    onChangeText={(text) => handleChange('accountAuthToken', text)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Sid</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Account Sid"
                    value={formData.accountSid}
                    onChangeText={(text) => handleChange('accountSid', text)}
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
                  <Text style={styles.label}>Call Secret</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Call Secret"
                    value={formData.callSecret}
                    onChangeText={(text) => handleChange('callSecret', text)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Business Number"
                    value={formData.businessNumber}
                    onChangeText={(text) => handleChange('businessNumber', text)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Sid</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone SID"
                    value={formData.phoneNumberSid}
                    onChangeText={(text) => handleChange('phoneNumberSid', text)}
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
                      <Picker.Item label="twilio" value="twilio" />
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
                {isPhoneDataError && (
                  <Text style={[styles.label, { color: 'red', fontSize: 12 }]}>
                    {phoneDataError}
                  </Text>
                )}
                {isPhoneDataLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                )}
              </View>
            </ScrollView>
            {/* Centered Add Phone Button (always at the bottom) */}
            <TouchableOpacity
              style={fabCenteredStyle}
              onPress={addPhoneDataPress}
              disabled={isPhoneDataLoading}
            >
              {isPhoneDataLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.fabText} numberOfLines={1}>Add Phone</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

PhoneModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal: PropTypes.bool.isRequired
};

export default PhoneModal;

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