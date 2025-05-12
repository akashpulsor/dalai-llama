import React from 'react';
import { View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import CountryPicker from './CountryPicker';

const PhoneInputRow = ({
  label,
  value,
  countryCode,
  onCountryChange,
  onChangeText,
  error,
  placeholder = '234 567 8900',
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 700;

  // Custom render for country picker button: flag + code only
  const renderCountryButton = (country) => (
    <View style={styles.codeButton}>
      <Text style={styles.flagText}>{country.flag}</Text>
      <Text style={styles.codeText}>{country.code}</Text>
    </View>
  );

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {isSmallScreen ? (
        <>
          <View style={styles.countryPickerWrapMobile}>
            <CountryPicker
              onSelect={onCountryChange}
              defaultCountryCode={countryCode || "+1"}
              buttonStyle={styles.codeButton}
              containerStyle={{ width: 90 }}
              dropdownStyle={{ maxHeight: 250, backgroundColor: "#fff" }}
              renderButton={renderCountryButton}
            />
          </View>
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              { width: '100%', marginTop: 8 }
            ]}
            placeholder={placeholder}
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChangeText}
          />
        </>
      ) : (
        <View style={styles.rowWeb}>
          <View style={styles.countryPickerWrapWeb}>
            <CountryPicker
              onSelect={onCountryChange}
              defaultCountryCode={countryCode || "+1"}
              buttonStyle={styles.codeButton}
              containerStyle={{ width: 90 }}
              dropdownStyle={{ maxHeight: 250, backgroundColor: "#fff" }}
              renderButton={renderCountryButton}
            />
          </View>
          <View style={styles.inputWrapWeb}>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                { width: '100%' }
              ]}
              placeholder={placeholder}
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChangeText}
            />
          </View>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
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
  rowWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: 0,
  },
  countryPickerWrapWeb: {
    width: 90,
    minWidth: 70,
    maxWidth: 100,
    marginRight: 12,
  },
  inputWrapWeb: {
    flex: 1,
  },
  countryPickerWrapMobile: {
    width: 90,
    alignSelf: 'flex-start',
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 18,
    marginRight: 4,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  input: {
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
});

export default PhoneInputRow;
