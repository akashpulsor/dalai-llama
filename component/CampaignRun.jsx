import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import CheckBox from '@react-native-community/checkbox';
import Button from './Button';
import CampaignForm from './CampaignForm';

const CampaignRun = ({ onClose, openModal, campaignId }) => {
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    description: '',
    firstMessage: '',
    language: '',
    duration: 0,
  });
  const [enabled, setEnabled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isUserEnabled, setIsUserEnabled] = useState(true);
  const [playCampaign, setPlayCampaign] = useState(false);
  const toggleSwitch = () => setIsUserEnabled(previousState => !previousState);
  const handleFormSubmit = () => {
    console.log('Form data:', formData);
    // Process the form data further
    setEnabled(false);
  };

  const handleModalClose = () => {
    onClose(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleStartCampaign = () => {
        setPlayCampaign(true);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={openModal}
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleModalClose}
          >
            <MaterialIcons name="cancel" size={24} color="gray" />
          </TouchableOpacity>
          <Text style={{ fontSize: 34, fontFamily: 'bold', alignSelf:'center' }}>
              RUN CAMPAIGN
            </Text>
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
            <View style={[styles.inputGroup]}>
                <Text style={{fontSize: 16,fontWeight: 'bold',marginBottom: 8,alignSelf: 'flex-start'}}>Campaign</Text>
                <CampaignForm  
                    enabled={enabled}
                    formData={formData}
                    setFormData={setFormData}
                />
            </View>
              
              <View style={[styles.inputGroup,{width:'20%'}]}>
                {!enabled ? (
                  <Button mode="contained" onPress={() => setEnabled(true)}>
                    Edit Campaign
                  </Button>
                ) : (
                  <Button mode="contained" onPress={handleFormSubmit}>
                    Save Campaign
                  </Button>
                )}
              </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Agent</Text>
                    <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.language}
                        onValueChange={(text) => handleFormChange('language', text)}
                        style={styles.picker}
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
                    <Text style={styles.label}>User</Text>

                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isUserEnabled ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch}
                        value={isUserEnabled}
                        style={styles.switch}
                    />
                  <Pressable onPress={toggleSwitch}>
                    <Text style={styles.label}>Select All User</Text>
                  </Pressable>
                </View>
                <View style={[styles.inputGroup,{width:'20%'}]}>
                    {!playCampaign?<Button mode="contained" onPress={() => handleStartCampaign()}>
                        Start Campaign
                    </Button>:
                    <Button mode="contained" onPress={() => handleStartCampaign}>
                    Play Campaign
                </Button>
                    }
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#d3d3d3',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    alignSelf:'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '50%',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 12,
  }
});

export default CampaignRun;