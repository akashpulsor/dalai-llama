import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Modal, 
    ScrollView,
    Platform,
    StatusBar
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
const countryCodes = [
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
];

const LeadForm = ({ visible, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: countryCodes[0],
        mobileNumber: '',
        companySize: '',
        countryCallingCode: ''
    });

    const [errors, setErrors] = useState({});

    const [countryCallingCode, setCountryCallingCode] = useState('+1');
    const [countryCode, setCountryCode] = useState('US');
    const [phone, setPhone] = useState('');

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
        if (!formData.companySize) newErrors.companySize = 'Company size is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            mobileNumber: phone,
            countryCode: countryCode,
            countryCallingCode: countryCallingCode
            }));
        if (validateForm()) {
            onSubmit(formData);
            onClose();
        }
    };

    const handleCountrySelect = (selectedCountryCode) => {
        // Find the selected country from countryData
        const selectedCountry = countryData.find(item => item.code === selectedCountryCode);
        if (selectedCountry) {
            console.log("BBBBBB" + selectedCountry.country);
          setCountryCode(selectedCountry.country);    // Set the country code (e.g., 'US')
          setCountryCallingCode(selectedCountry.code);    // Set the calling code (e.g., '+1')
        }
      };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Schedule a Demo</Text>
                    
                    <ScrollView 
                        contentContainerStyle={styles.formContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    styles.shadowInput, 
                                    errors.name && styles.errorInput
                                ]}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9ca3af"
                                value={formData.name}
                                onChangeText={(text) => setFormData({...formData, name: text})}
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    styles.shadowInput, 
                                    errors.email && styles.errorInput
                                ]}
                                placeholder="Enter your business email"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                value={formData.email}
                                onChangeText={(text) => setFormData({...formData, email: text})}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <View style={styles.mobileNumberContainer}>
                                <CountryCodeDropdownPicker
                                    onSelectCountry={handleCountrySelect}
                                    value={phone}
                                    onChangeText={setPhone}/>
                            </View>
                        
                    </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Company Size</Text>
                            <View style={styles.companySizeContainer}>
                                {[
                                    { label: '0-100', value: '0-100' },
                                    { label: '100-500', value: '100-500' },
                                    { label: '500-1000', value: '500-1000' },
                                    { label: '1000-5000', value: '1000-5000' }
                                ].map((size) => (
                                    <TouchableOpacity
                                        key={size.value}
                                        style={[
                                            styles.companySizeOption,
                                            styles.shadowInput,
                                            formData.companySize === size.value && styles.selectedCompanySize
                                        ]}
                                        onPress={() => setFormData({...formData, companySize: size.value})}
                                    >
                                        <Text style={[
                                            styles.companySizeText,
                                            formData.companySize === size.value && styles.selectedCompanySizeText
                                        ]}>
                                            {size.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.companySize && <Text style={styles.errorText}>{errors.companySize}</Text>}
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={[styles.submitButton, styles.shadowInput]} 
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitButtonText}>Submit Lead</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.cancelButton, styles.shadowInput]} 
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                paddingTop: StatusBar.currentHeight || 0
            }
        })
    },
    modalContainer: {
        width: '50%', // Changed from 90% to 50%
        backgroundColor: '#d3d3d3',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    shadowInput: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#4b5563',
    },
    formContainer: {
        paddingHorizontal: 10,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        marginBottom: 5,
        color: '#4b5563',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    phoneInputContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCodePicker: {
        backgroundColor: 'rgba(243, 244, 246, 0.7)',
        padding: 10,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
    },
    countryCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    flagText: {
        fontSize: 18,
    },
    countryCodeText: {
        color: '#4b5563',
        fontWeight: 'bold',
    },
    dropdownContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'blue',
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderRadius: 8,
        zIndex: -1,
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        
        borderBottomColor: 'rgba(209, 213, 219, 0.5)',
    },
    dropdownItemText: {
        marginLeft: 10,
        color: '#4b5563',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    companySizeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    companySizeOption: {
        width: '48%',
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    selectedCompanySize: {
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
    },
    companySizeText: {
        color: '#4b5563',
        fontWeight: 'bold',
    },
    selectedCompanySizeText: {
        color: 'white',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    submitButton: {
        backgroundColor: '#6b7280',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flex: 1,
        marginRight: 10,
    },
    submitButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flex: 1,
    },
    cancelButtonText: {
        color: '#4b5563',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    mobileNumberContainer: {
        flexDirection: 'row',
        position: 'relative',
        zIndex: 1,
      },
      countryCodePicker: {
        backgroundColor: 'rgba(243, 244, 246, 0.7)',
        padding: 10,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        zIndex: 2,
      },
      countryCodePickerActive: {
        zIndex: 999,
      },
      phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
      dropdownOverlay: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 10000,
      },
      dropdownContainer: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderRadius: 8,
        maxHeight: 200,
        marginTop: 5,
        zIndex: 999,
      },
      dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(209, 213, 219, 0.5)',
      },
      dropdownItemText: {
        marginLeft: 10,
        color: '#4b5563',
      },
});

export default LeadForm;