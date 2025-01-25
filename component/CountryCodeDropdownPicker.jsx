import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, Dimensions } from 'react-native';
import countryData from '../helper/countryData';

const { width, height } = Dimensions.get('window');

const CountryCodeInputPicker = ({ onSelectCountry, onChangeText, value }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryData[0]);
  const [searchText, setSearchText] = useState('');

  const filteredCountries = countryData.filter(
    item => 
      item.country.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.includes(searchText)
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    onSelectCountry(country.code);
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.country}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Input Container */}
      <View style={styles.inputContainer}>
        {/* Country Code Button */}
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectedCountry}>
            {selectedCountry.flag} {selectedCountry.code}
          </Text>
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          placeholder="Enter phone number"
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
        />
      </View>

      {/* Country Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryButton: {
    padding: 15,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: 'white',
    justifyContent: 'center',
    minWidth: 100,
  },
  phoneInput: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  selectedCountry: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.5,
    maxHeight: height * 0.6,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  flag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#666',
  },
});

export default CountryCodeInputPicker;