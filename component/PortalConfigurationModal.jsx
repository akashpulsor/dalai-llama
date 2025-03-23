import React, { useState } from 'react';
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
import {MaterialIcons}  from '@expo/vector-icons';
const PortalConfigurationModal = ({ visible, onClose, portalUrl, onConfigure }) => {
  const [formData, setFormData] = useState({
    username:'',
    password:'',
    description: '',
    intent: '',
    steps: '',
    url:''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);


  const validateForm = () => {
    const newErrors = {};
    if (!formData.intent.trim()) {
      newErrors.intent = 'Intent is required';
    }
    if (!formData.steps.trim()) {
      newErrors.steps = 'Steps are required';
    }
    if (!formData.username.trim()) {
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
      await onConfigure({
        ...formData,
        url: portalUrl,
      });
      onClose();
    } catch (error) {
      console.error('Error configuring portal:', error);
    } finally {
      setIsLoading(false);
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
            <Text style={styles.modalTitle}>Configure Portal</Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website Name</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={portalUrl}
                editable={false}
                placeholder="Website name"
              />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[
                    styles.input, 
                    styles.textArea, 
                    isDisabled && styles.disabledInput
                    ]}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Enter website description"
                    multiline
                    numberOfLines={3}
                    editable={isDisabled}
                    onTouchStart={() => setIsDisabled(true)}
                />
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>User Name</Text>
              <TextInput
                style={[styles.input]}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="User Name"
              />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    />
                    <TouchableOpacity 
                    style={styles.eyeIconContainer} 
                    onPress={() => setShowPassword(!showPassword)}
                    >
                    <MaterialIcons 
                        name={showPassword ? 'visibility-off' : 'visibility'} 
                        size={24} 
                        color="#777"
                    />
                    </TouchableOpacity>
                </View>
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>Intent</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.intent}
                onChangeText={(text) => setFormData({ ...formData, intent: text })}
                placeholder="What do you want to achieve with this portal?"
                multiline
                numberOfLines={3}
              />
              {errors.intent && <Text style={styles.errorText}>{errors.intent}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Steps</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.steps}
                onChangeText={(text) => setFormData({ ...formData, steps: text })}
                placeholder="What steps are required to achieve this?"
                multiline
                numberOfLines={4}
              />
              {errors.steps && <Text style={styles.errorText}>{errors.steps}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            
            <TouchableOpacity
              style={[styles.button, styles.configureButton]}
              onPress={handleConfigure}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Configure</Text>
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
    color: '#666',
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
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    fontSize: 16,
    paddingRight: 50, // Add padding to prevent text from going under the icon
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
  }
});

export default PortalConfigurationModal;