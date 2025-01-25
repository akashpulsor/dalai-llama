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
  containerWidth = '100%',
  onSelect,
  defaultCountryCode = '+1',
  containerStyle,
  buttonStyle,
  dropdownStyle,
  textStyle,
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
      duration: 300,
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
      <Text style={[styles.countryName, textStyle]}>{item.country}</Text>
      <Text style={[styles.countryCode, textStyle]}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { width: containerWidth }, containerStyle]}>
      <TouchableOpacity
        style={[styles.pickerButton, buttonStyle]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.flag}>{selectedCountry.flag}</Text>
        <Text style={[styles.selectedText, textStyle]}>
          {selectedCountry.country} ({selectedCountry.code})
        </Text>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.dropdownContainer,
          dropdownStyle,
          { maxHeight: dropdownHeight }
        ]}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
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
          keyExtractor={item => item.code}
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
    width: '100%',
    position: 'relative',
    zIndex: 1000,
  },
  pickerButton: {
    flexDirection: 'row',
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  dropdownContainer: {
    width: '100%',
    backgroundColor: '',
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
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
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

export default CountryPicker;