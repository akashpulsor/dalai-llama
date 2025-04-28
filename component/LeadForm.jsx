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
    StatusBar,
    useWindowDimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';

import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
import countryData from '../helper/countryData';
import { useInterestMutation } from './publicApi';

const countryCodes = [
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
];

const injectLinkedInScriptWeb = () => {
    if (typeof window === 'undefined') return;
    // Prevent duplicate injection
    if (document.getElementById('linkedin-insight-script')) return;

    // First script
    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.id = 'linkedin-insight-script';
    script1.innerHTML = `
        _linkedin_partner_id = "7164620";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `;
    document.head.appendChild(script1);

    // Second script
    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.async = true;
    script2.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    document.head.appendChild(script2);

    // Noscript fallback (optional, for completeness)
    const noscript = document.createElement('noscript');
    noscript.innerHTML = '<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=7164620&fmt=gif" />';
    document.body.appendChild(noscript);
};

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
    const [showLinkedInPixel, setShowLinkedInPixel] = useState(false);

    const [countryCallingCode, setCountryCallingCode] = useState('+1');
    const [countryCode, setCountryCode] = useState('US');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const dispatch = useDispatch();
    const [interest, { isLoading, error, isSuccess }] = useInterestMutation();

    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

    useEffect(() => {
        if (isSuccess) {
            dispatch(showMessage({
                message: 'We have recieved your interest, Team will get back to you',
                type: 'info'
            }));
        }
    }, [isSuccess, dispatch]);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        // Build the latest payload directly
        const payload = {
            ...formData,
            mobileNumber: phone,
            countryCode: countryCode,
            countryCallingCode: countryCallingCode
        };

        // Validate using the latest payload
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
            if (Platform.OS === 'web') {
                injectLinkedInScriptWeb();
            } else {
                setShowLinkedInPixel(true); // Show the WebView to trigger LinkedIn script
            }
            onClose();
            setSubmitting(false);
        } else {
            setSubmitting(false);
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
                <View style={[
                    styles.modalContainer,
                    isMobile && styles.modalContainerMobile
                ]}>
                    <Text style={[styles.modalTitle, isMobile && styles.modalTitleMobile]}>Schedule a Demo</Text>
                    
                    <ScrollView 
                        contentContainerStyle={styles.formContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isMobile && styles.labelMobile]}>Full Name</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    styles.shadowInput, 
                                    errors.name && styles.errorInput,
                                    isMobile && styles.inputMobile
                                ]}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9ca3af"
                                value={formData.name}
                                onChangeText={(text) => setFormData({...formData, name: text})}
                            />
                            {errors.name && <Text style={[styles.errorText, isMobile && styles.errorTextMobile]}>{errors.name}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isMobile && styles.labelMobile]}>Email</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    styles.shadowInput, 
                                    errors.email && styles.errorInput,
                                    isMobile && styles.inputMobile
                                ]}
                                placeholder="Enter your business email"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                value={formData.email}
                                onChangeText={(text) => setFormData({...formData, email: text})}
                            />
                            {errors.email && <Text style={[styles.errorText, isMobile && styles.errorTextMobile]}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isMobile && styles.labelMobile]}>Mobile Number</Text>
                            <View style={styles.mobileNumberContainer}>
                                <CountryCodeDropdownPicker
                                    onSelectCountry={handleCountrySelect}
                                    value={phone}
                                    onChangeText={setPhone}/>
                            </View>
                        
                    </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isMobile && styles.labelMobile]}>Company Size</Text>
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
                                            formData.companySize === size.value && styles.selectedCompanySize,
                                            isMobile && styles.companySizeOptionMobile
                                        ]}
                                        onPress={() => setFormData({...formData, companySize: size.value})}
                                    >
                                        <Text style={[
                                            styles.companySizeText,
                                            formData.companySize === size.value && styles.selectedCompanySizeText,
                                            isMobile && styles.companySizeTextMobile
                                        ]}>
                                            {size.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {errors.companySize && <Text style={[styles.errorText, isMobile && styles.errorTextMobile]}>{errors.companySize}</Text>}
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={[
                                    styles.submitButton, 
                                    styles.shadowInput, 
                                    submitting && { opacity: 0.5 },
                                    isMobile && styles.submitButtonMobile
                                ]} 
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                <Text style={[styles.submitButtonText, isMobile && styles.submitButtonTextMobile]}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.cancelButton, 
                                    styles.shadowInput,
                                    isMobile && styles.cancelButtonMobile
                                ]} 
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelButtonText, isMobile && styles.cancelButtonTextMobile]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    {showLinkedInPixel && Platform.OS !== 'web' && (
                        <WebView
                            source={{
                                html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                <script type="text/javascript">
                                _linkedin_partner_id = "7164620";
                                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                                </script>
                                <script type="text/javascript">
                                (function(l) {
                                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                                window.lintrk.q=[]}
                                var s = document.getElementsByTagName("script")[0];
                                var b = document.createElement("script");
                                b.type = "text/javascript";b.async = true;
                                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                                s.parentNode.insertBefore(b, s);})(window.lintrk);
                                </script>
                                <noscript>
                                <img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=7164620&fmt=gif" />
                                </noscript>
                                </head>
                                <body></body>
                                </html>
                                `
                            }}
                            style={{ width: 0, height: 0, opacity: 0 }}
                            javaScriptEnabled
                            injectedJavaScript={`true;`}
                            onLoadEnd={() => setTimeout(() => setShowLinkedInPixel(false), 2000)}
                        />
                    )}
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
    modalContainerMobile: {
        width: '95%',
        padding: 10,
        borderRadius: 10,
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
    modalTitleMobile: {
        fontSize: 18,
        marginBottom: 10,
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
    labelMobile: {
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(209, 213, 219, 0.5)',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    inputMobile: {
        fontSize: 14,
        padding: 8,
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    errorTextMobile: {
        fontSize: 10,
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
    companySizeOptionMobile: {
        width: '100%',
        marginBottom: 8,
        padding: 8,
    },
    selectedCompanySize: {
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
    },
    companySizeText: {
        color: '#4b5563',
        fontWeight: 'bold',
    },
    companySizeTextMobile: {
        fontSize: 12,
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
    submitButtonMobile: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 5,
    },
    submitButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    submitButtonTextMobile: {
        fontSize: 14,
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flex: 1,
    },
    cancelButtonMobile: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#4b5563',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButtonTextMobile: {
        fontSize: 14,
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