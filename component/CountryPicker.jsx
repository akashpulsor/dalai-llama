import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

import countryData from '../helper/countryData';

const CountryPicker = ({
  containerWidth = 90,
  onSelect,
  defaultCountryCode = '+1',
  containerStyle,
  buttonStyle,
  dropdownStyle,
  textStyle,
  renderButton,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(
    countryData.find(item => item.code === defaultCountryCode) || countryData[0]
  );
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  const filteredCountries = countryData.filter(item =>
    item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery)
  );

  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: isOpen ? 300 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    onSelect?.(country);
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleSelectCountry(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  // Only show flag + code in the picker button
  const defaultRenderButton = (country) => (
    <View style={styles.codeButton}>
      <Text style={styles.flag}>{country.flag}</Text>
      <Text style={styles.countryCode}>{country.code}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { width: containerWidth }, containerStyle]}>
      <TouchableOpacity
        style={[styles.pickerButton, buttonStyle]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        {renderButton
          ? renderButton(selectedCountry)
          : defaultRenderButton(selectedCountry)}
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.dropdownContainer,
          dropdownStyle,
          { maxHeight: dropdownHeight, width: '100%' }
        ]}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <FlatList
          data={filteredCountries}
          renderItem={renderCountryItem}
          keyExtractor={item => item.code + item.country}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={2}
          keyboardShouldPersistTaps="handled"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    position: 'relative',
    zIndex: 1000,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  dropdownContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
  },
  searchInput: {
    height: 36,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    fontSize: 15,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default CountryPicker;