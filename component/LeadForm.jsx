import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Platform,
    useWindowDimensions,
    KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
import countryData from '../helper/countryData';
import { useInterestMutation } from './publicApi';

const companySizes = [
    { label: '0-100', value: '0-100' },
    { label: '100-500', value: '100-500' },
    { label: '500-1000', value: '500-1000' },
    { label: '1000-5000', value: '1000-5000' }
];

const LeadForm = ({ visible, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: '+1',
        mobileNumber: '',
        companySize: ''
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const dispatch = useDispatch();
    const [interest, { isLoading, error, isSuccess }] = useInterestMutation();
    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

    useEffect(() => {
        if (isSuccess) {
            dispatch(showMessage({
                message: 'We have received your interest, Team will get back to you',
                type: 'info'
            }));
        }
    }, [isSuccess, dispatch]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            // Defer analytics/tracking scripts to after first render
            const injectScripts = () => {
                // Google Analytics 4
                if (!document.getElementById('ga4-script')) {
                    const gaScript = document.createElement('script');
                    gaScript.id = 'ga4-script';
                    gaScript.async = true;
                    gaScript.defer = true;
                    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with your GA4 ID
                    document.head.appendChild(gaScript);
                    const gaInit = document.createElement('script');
                    gaInit.defer = true;
                    gaInit.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-XXXXXXXXXX');`;
                    document.head.appendChild(gaInit);
                }
                // Microsoft Clarity
                if (!document.getElementById('clarity-script')) {
                    const clarityScript = document.createElement('script');
                    clarityScript.id = 'clarity-script';
                    clarityScript.type = 'text/javascript';
                    clarityScript.async = true;
                    clarityScript.defer = true;
                    clarityScript.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/XXXXXXXXXX";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "XXXXXXXXXX");`;
                    document.head.appendChild(clarityScript);
                }
            };
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(injectScripts);
            } else {
                setTimeout(injectScripts, 1200);
            }
        }
    }, []);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const payload = { ...formData };
        const newErrors = {};
        if (!payload.name.trim()) newErrors.name = 'Name is required';
        if (!payload.email.trim()) newErrors.email = 'Email is required';
        if (!payload.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
        if (!payload.companySize) newErrors.companySize = 'Company size is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (payload.email && !emailRegex.test(payload.email)) {
            newErrors.email = 'Invalid email format';
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            await interest(payload);
            onClose();
            setSubmitting(false);
        } else {
            setSubmitting(false);
        }
    };

    const handleCountrySelect = (selectedCountryCode) => {
        setFormData(prev => ({
            ...prev,
            countryCode: selectedCountryCode
        }));
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.centeredView}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.card,
                        isMobile && styles.cardMobile
                    ]}>
                        <Text style={styles.title}>Schedule a Demo</Text>
                        <Text style={styles.subtitle}>Let us know your details and our team will reach out to you.</Text>
                        <ScrollView
                            style={{ width: '100%' }}
                            contentContainerStyle={{ paddingVertical: 8 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.name && styles.inputError,
                                        isMobile && styles.inputMobile
                                    ]}
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChangeText={text => setFormData({ ...formData, name: text })}
                                />
                                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.email && styles.inputError,
                                        isMobile && styles.inputMobile
                                    ]}
                                    placeholder="Enter your business email"
                                    keyboardType="email-address"
                                    value={formData.email}
                                    onChangeText={text => setFormData({ ...formData, email: text })}
                                />
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <View style={styles.phoneRow}>
                                    <CountryCodeDropdownPicker
                                        onSelectCountry={handleCountrySelect}
                                        value={formData.mobileNumber}
                                        onChangeText={text => setFormData({ ...formData, mobileNumber: text })}
                                        selectedCountryCode={formData.countryCode}
                                    />
                                </View>
                                {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Company Size</Text>
                                <View style={styles.companySizeRow}>
                                    {companySizes.map(size => (
                                        <TouchableOpacity
                                            key={size.value}
                                            style={[
                                                styles.companySizeOption,
                                                formData.companySize === size.value && styles.companySizeOptionSelected,
                                                isMobile && styles.companySizeOptionMobile
                                            ]}
                                            onPress={() => setFormData({ ...formData, companySize: size.value })}
                                        >
                                            <Text style={[
                                                styles.companySizeText,
                                                formData.companySize === size.value && styles.companySizeTextSelected
                                            ]}>
                                                {size.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.companySize && <Text style={styles.errorText}>{errors.companySize}</Text>}
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                submitting && { opacity: 0.7 },
                                isMobile && styles.submitButtonMobile
                            ]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(30,30,30,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 36,
        width: 420,
        maxWidth: '98%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
        alignItems: 'center',
    },
    cardMobile: {
        width: '98%',
        padding: 16,
        borderRadius: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 6,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#555',
        marginBottom: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
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
    input: {
        width: '100%',
        height: 46,
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
    },
    inputMobile: {
        fontSize: 15,
        height: 40,
        paddingHorizontal: 10,
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 13,
        marginTop: 4,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    companySizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
        width: '100%',
    },
    companySizeOption: {
        flex: 1,
        minWidth: 90,
        maxWidth: '48%',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    companySizeOptionMobile: {
        minWidth: '100%',
        maxWidth: '100%',
        marginBottom: 8,
        paddingVertical: 8,
    },
    companySizeOptionSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    companySizeText: {
        color: '#222',
        fontWeight: 'bold',
        fontSize: 15,
    },
    companySizeTextSelected: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 48,
        marginTop: 10,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 180,
        width: '100%',
    },
    submitButtonMobile: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        minWidth: '100%',
    },
    submitButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 30,
        marginTop: 2,
        alignItems: 'center',
        width: '100%',
    },
    cancelButtonText: {
        color: '#4b5563',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default LeadForm;