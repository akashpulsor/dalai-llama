import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
import WorldwideAddressPicker from './WorldwideAddressPicker';

const BusinessForm = ({ 
  enabled, 
  formData, 
  onUpdateForm 
}) => {
    const [documents, setDocuments] = useState({
        pan: null,
        adhaar: null,
        udyam_certificate: null,
      });
    
      const handleFormChange = (field, value) => {
        onUpdateForm({
          businessDetails: {
            ...formData.businessDetails,
            [field]: value
          }
        });
      };
    
      const handleBankDetailsChange = (field, value) => {
        onUpdateForm({
          bankDetails: {
            ...formData.bankDetails,
            [field]: value
          }
        });
      };
    

  const handleAddressChange = (address) => {
    onUpdateForm({
      address: address
    });
  };

  const handleCountrySelect = (selectedCountryCode) => {
    handleFormChange('countryCode', selectedCountryCode);
  };

  const handlePhoneChange = (phone) => {
    handleFormChange('phone', phone);
  };





  return (
    <View style={styles.modalView}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Udyam Registration Number</Text>
        <TextInput
          style={[styles.input, !enabled && styles.disabledInput]}
          placeholder="Udyam Registration Number"
          value={formData.businessDetails.udyamRegistrationNumber}
          onChangeText={(text) => handleFormChange('udyamRegistrationNumber', text)}
          editable={enabled}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PAN</Text>
        <TextInput
          style={[styles.input, !enabled && styles.disabledInput]}
          placeholder="Permanent Account Number"
          value={formData.businessDetails.pan}
          onChangeText={(text) => handleFormChange('pan', text)}
          editable={enabled}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adhaar Number</Text>
        <TextInput
          style={[styles.input, !enabled && styles.disabledInput]}
          value={formData.businessDetails.adhaarNumber}
          onChangeText={(text) => handleFormChange('adhaarNumber', text)}
          placeholder="Adhaar Number"
          editable={enabled}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={[styles.input, !enabled && styles.disabledInput]}
          placeholder="GST Number"
          value={formData.businessDetails.gstNumber}
          onChangeText={(text) => handleFormChange('gstNumber', text)}
          editable={enabled}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Country Phone</Text>
        <CountryCodeDropdownPicker
          onSelectCountry={handleCountrySelect}
          value={formData.businessDetails.phone}
          onChangeText={handlePhoneChange}
          enabled={enabled}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <WorldwideAddressPicker
          isEditMode={enabled}
          initialAddress={formData.address}
          onAddressChange={handleAddressChange}
          onSubmit={handleAddressChange}
        />
      </View>

      <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
      </View>

      <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={[styles.input, !enabled && styles.disabledInput]}
            placeholder="Account Holder Name"
            value={formData.bankDetails?.accountHolderName}
            onChangeText={(text) => handleBankDetailsChange('accountHolderName', text)}
            editable={enabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={[styles.input, !enabled && styles.disabledInput]}
            placeholder="Account Number"
            value={formData.bankDetails?.accountNumber}
            onChangeText={(text) => handleBankDetailsChange('accountNumber', text)}
            keyboardType="numeric"
            editable={enabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={[styles.input, !enabled && styles.disabledInput]}
            placeholder="IFSC Code"
            value={formData.bankDetails?.ifscCode}
            onChangeText={(text) => handleBankDetailsChange('ifscCode', text)}
            autoCapitalize="characters"
            editable={enabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={[styles.input, !enabled && styles.disabledInput]}
            placeholder="Bank Name"
            value={formData.bankDetails?.bankName}
            onChangeText={(text) => handleBankDetailsChange('bankName', text)}
            editable={enabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branch Name</Text>
          <TextInput
            style={[styles.input, !enabled && styles.disabledInput]}
            placeholder="Branch Name"
            value={formData.bankDetails?.branchName}
            onChangeText={(text) => handleBankDetailsChange('branchName', text)}
            editable={enabled}
          />
        </View>
    </View>
  );
};

BusinessForm.propTypes = {
  enabled: PropTypes.bool.isRequired,
  formData: PropTypes.shape({
    businessDetails: PropTypes.object.isRequired,
    bankDetails: PropTypes.object,
    address: PropTypes.object
  }).isRequired,
  onUpdateForm: PropTypes.func.isRequired
};

export default BusinessForm;

// Styles remain the same as in your original code


  const styles = StyleSheet.create({
        modalView: {
            width:'100%',
            height:'90%',
            borderRadius: 20,
            alignItems: 'center',
        },
        inputGroup: {
            marginBottom: 20,
            width:'60%',
        },
        label: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 8,
        },
        input: {
            backgroundColor: '#F5F5F5',
            borderRadius: 5,
            padding: 10,
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#DDDDDD',
        },
        pickerContainer: {
            backgroundColor: '#F5F5F5',
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#DDDDDD',
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
        sectionHeader: {
            width: '60%',
            marginTop: 20,
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#DDDDDD',
          },
          sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
          },
          documentUploadContainer: {
            width: '60%',
            marginBottom: 20,
          },
          uploadButton: {
            backgroundColor: '#007AFF',
            padding: 12,
            borderRadius: 5,
            alignItems: 'center',
          },
          uploadButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '500',
          },
          fileName: {
            marginTop: 8,
            fontSize: 14,
            color: '#666666',
          },
          disabledButton: {
            backgroundColor: '#CCCCCC',
          }
});