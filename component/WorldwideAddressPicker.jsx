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
} from 'react-native';




const AddressField = ({ 
  label, 
  value, 
  onPress, 
  editable = true,
  error = null 
}) => (
  <TouchableOpacity 
    onPress={editable ? onPress : null}
    style={[
      styles.field,
      !editable && styles.fieldDisabled,
      error && styles.fieldError
    ]}
  >
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>
      {value || `Select ${label}`}
    </Text>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </TouchableOpacity>
);

const SearchableList = ({
  data,
  visible,
  onClose,
  onSelect,
  title,
  keyExtractor,
  displayExtractor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = data.filter(item =>
    displayExtractor(item)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      avoidKeyboard
    >
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
          {filteredData.map(item => (
            <TouchableOpacity
              key={keyExtractor(item)}
              style={styles.listItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.listItemText}>
                {displayExtractor(item)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const WorldwideAddressPicker = ({ onAddressChange }) => {
  // State management
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');

  // Modal visibility states
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});

  // Data states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load initial country data
  const countries = Country.getAllCountries();

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const statesList = State.getStatesOfCountry(selectedCountry.isoCode);
      setStates(statesList);
      setSelectedState(null);
      setSelectedCity(null);
      setPostalCode('');
    }
  }, [selectedCountry]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const citiesList = City.getCitiesOfState(
        selectedCountry.isoCode,
        selectedState.isoCode
      );
      setCities(citiesList);
      setSelectedCity(null);
    }
  }, [selectedState]);

  // Validate postal code based on country
  const validatePostalCode = (code, country) => {
    if (!code || !country) return true;
    return validate(country.isoCode, code);
  };

  // Handle address validation
  const validateAddress = () => {
    const newErrors = {};

    if (!selectedCountry) {
      newErrors.country = 'Country is required';
    }

    if (!streetAddress.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (postalCode && selectedCountry) {
      if (!validatePostalCode(postalCode, selectedCountry)) {
        newErrors.postalCode = 'Invalid postal code format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle address updates
  useEffect(() => {
    const isValid = validateAddress();
    if (isValid) {
      onAddressChange({
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        postalCode,
        streetAddress,
        apartment,
        formattedAddress: formatAddress()
      });
    }
  }, [
    selectedCountry,
    selectedState,
    selectedCity,
    postalCode,
    streetAddress,
    apartment
  ]);

  // Format address based on country conventions
  const formatAddress = () => {
    const parts = [];
    
    if (streetAddress) {
      parts.push(streetAddress);
    }
    
    if (apartment) {
      parts.push(apartment);
    }
    
    if (selectedCity) {
      parts.push(selectedCity.name);
    }
    
    if (selectedState) {
      parts.push(selectedState.name);
    }
    
    if (postalCode) {
      parts.push(postalCode);
    }
    
    if (selectedCountry) {
      parts.push(selectedCountry.name);
    }
    
    return parts.join(', ');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <AddressField
              label="Country"
              value={selectedCountry?.name}
              onPress={() => setCountryModalVisible(true)}
              error={errors.country}
            />

            <AddressField
              label="State/Province"
              value={selectedState?.name}
              onPress={() => setStateModalVisible(true)}
              editable={!!selectedCountry}
              error={errors.state}
            />

            <AddressField
              label="City"
              value={selectedCity?.name}
              onPress={() => setCityModalVisible(true)}
              editable={!!selectedState}
              error={errors.city}
            />

            <View style={styles.textInputContainer}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={[styles.textInput, errors.street && styles.inputError]}
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="Enter street address"
              />
              {errors.street && (
                <Text style={styles.errorText}>{errors.street}</Text>
              )}
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

            <View style={styles.textInputContainer}>
              <Text style={styles.label}>Postal/ZIP Code</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.postalCode && styles.inputError
                ]}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Enter postal/ZIP code"
              />
              {errors.postalCode && (
                <Text style={styles.errorText}>{errors.postalCode}</Text>
              )}
            </View>

            <SearchableList
              data={countries}
              visible={countryModalVisible}
              onClose={() => setCountryModalVisible(false)}
              onSelect={setSelectedCountry}
              title="Select Country"
              keyExtractor={item => item.isoCode}
              displayExtractor={item => item.name}
            />

            <SearchableList
              data={states}
              visible={stateModalVisible}
              onClose={() => setStateModalVisible(false)}
              onSelect={setSelectedState}
              title="Select State/Province"
              keyExtractor={item => item.isoCode}
              displayExtractor={item => item.name}
            />

            <SearchableList
              data={cities}
              visible={cityModalVisible}
              onClose={() => setCityModalVisible(false)}
              onSelect={setSelectedCity}
              title="Select City"
              keyExtractor={item => item.name}
              displayExtractor={item => item.name}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius:12
  },
  field: {
    marginBottom: 16,
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
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  textInputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    width:'40%',
    alignSelf:'center',
    backgroundColor: '#d3d3d3',
    borderRadius: 16,
    borderRadius: 16,
    maxHeight: '60%',
    marginBottom:'10%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
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
    maxHeight: '70%',
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listItemText: {
    fontSize: 16,
  },
});

export default WorldwideAddressPicker;