import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import countryData from '../helper/countryData';

const AddressField = ({
  label,
  value,
  onPress,
  editable = true,
  error = null,
  touched = false,
  required = false,
  style = {},
}) => (
  <TouchableOpacity
    onPress={editable ? onPress : null}
    activeOpacity={editable ? 0.7 : 1}
    style={[
      styles.field,
      !editable && styles.fieldDisabled,
      touched && error && styles.fieldError,
      style,
    ]}
  >
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.requiredRemark}> (required)</Text>}
    </Text>
    <Text style={styles.fieldValue}>{value || `Select ${label}`}</Text>
    {touched && error && <Text style={styles.errorText}>{error}</Text>}
  </TouchableOpacity>
);

const SearchableList = ({
  data,
  visible,
  onClose,
  onSelect,
  title,
  keyExtractor,
  displayExtractor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter((item) =>
    displayExtractor(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView style={styles.listContainer}>
            {filteredData.map((item) => (
              <TouchableOpacity
                key={keyExtractor(item)}
                style={styles.listItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.listItemText}>{displayExtractor(item)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const WorldwideAddressPicker = ({ onAddressChange }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    country: false,
    street: false,
  });

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  // Validate address fields
  const validateAddress = () => {
    const newErrors = {};
    if (!selectedCountry) newErrors.country = 'Country is required';
    if (!streetAddress.trim()) newErrors.street = 'Street address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle address updates
  useEffect(() => {
    // Only validate on submit/touch, not on every keystroke
    if (touched.country || touched.street) {
      validateAddress();
    }
    // eslint-disable-next-line
  }, [selectedCountry, streetAddress]);

  // Format address as a string
  const formatAddress = () => {
    const parts = [];
    if (streetAddress) parts.push(streetAddress);
    if (apartment) parts.push(apartment);
    if (postalCode) parts.push(postalCode);
    if (selectedCountry) parts.push(selectedCountry.country);
    return parts.join(', ');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[
        styles.card,
        !isSmallScreen && { maxWidth: 340 }
      ]}>
        
        {/* Vertically stacked fields for all screen sizes */}
        <View style={styles.textInputContainer}>
          <AddressField
            label="Country"
            value={
              selectedCountry
                ? `${selectedCountry.flag || ''} ${selectedCountry.country}`
                : ''
            }
            onPress={() => {
              setTouched(t => ({ ...t, country: true }));
              setCountryModalVisible(true);
            }}
            error={errors.country}
            touched={touched.country}
            required={true}
          />
        </View>
        <View style={styles.textInputContainer}>
          <Text style={styles.label}>
            Street Address
            <Text style={styles.requiredRemark}> (required)</Text>
          </Text>
          <TextInput
            style={[
              styles.textInput,
              touched.street && errors.street && styles.inputError,
            ]}
            value={streetAddress}
            onChangeText={text => {
              setStreetAddress(text);
              if (!touched.street) setTouched(t => ({ ...t, street: true }));
            }}
            placeholder="Enter street address"
            onBlur={() => setTouched(t => ({ ...t, street: true }))}
          />
          {touched.street && errors.street && (
            <Text style={styles.errorText}>{errors.street}</Text>
          )}
        </View>
        <View style={styles.textInputContainer}>
          <Text style={styles.label}>Postal/ZIP Code</Text>
          <TextInput
            style={styles.textInput}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Enter postal/ZIP code"
          />
        </View>
        <View style={styles.textInputContainer}>
          <Text style={styles.label}>Apartment/Suite/Unit (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={apartment}
            onChangeText={setApartment}
            placeholder="Enter apartment/suite/unit"
          />
        </View>
        <SearchableList
          data={countryData}
          visible={countryModalVisible}
          onClose={() => setCountryModalVisible(false)}
          onSelect={setSelectedCountry}
          title="Select Country"
          keyExtractor={(item) => item.code + item.country}
          displayExtractor={(item) =>
            `${item.flag ? item.flag + ' ' : ''}${item.country} (${item.code})`
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  textInputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '70%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    color: '#fff',
    fontSize: 16,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  listItemText: {
    fontSize: 16,
    color: '#222',
  },
  field: {
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fieldDisabled: {
    opacity: 0.7,
  },
  fieldError: {
    borderColor: '#ff4444',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  requiredRemark: {
    color: '#222',
    fontSize: 12,
    fontWeight: '400',
  },
});

export default WorldwideAddressPicker;