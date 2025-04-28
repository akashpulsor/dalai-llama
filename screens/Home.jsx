// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, TextInput, Modal, ActivityIndicator, Image, useWindowDimensions, StyleSheet } from 'react-native';
import styles from '../styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useLoginMutation, useRegisterMutation } from '../component/authApi';
import { emailValidator } from '../helper/emailValidator';
import Button from '../component/Button';
import RegistrationCarousel from '../component/RegistrationCarousel';
import ResetPassword from '../component/ResetPassword';
import InputCode from '../component/InputCode';
import NewPassword from '../component/NewPassword';

// Create your functional component
const Home = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showVerifyCode, setShowVerifyCode] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showVerificationEmail, setShowVerificationEmail] = useState(false);
    const [loginMutation, { data: loginData, isLoading: isLoginLoading, isSuccess: isLoginSuccess, isError: isLoginError, error: loginError }] = useLoginMutation();

    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

    useEffect(() => {
        if (isLoginError) {
            setShowError(true);
            setErrorMessage(showError || 'Please try again after sometime.');
        }
    }, [isLoginLoading, isLoginSuccess, isLoginError, loginError, errorMessage, showError]);

    const onLoginPress = async () => {
        const emailError = emailValidator(email);
        if (emailError) {
            setShowError(true);
            setErrorMessage(emailError);
            return;
        }
        let body = { "userName": email, "password": password };
        body = JSON.stringify(body);
        console.log(body);
        await loginMutation(body);
    };

    const handleModalClose = () => {
        setModalVisible(false);
    };

    const handleRegisterPress = () => {
        setModalVisible(true);
    };

    const handleResetPasswordPress = () => {
        setShowResetPassword(true);
    };

    const handleResetPasswordModalClose = () => {
        setShowResetPassword(false);
    };

    const handleVerifyCodeModalClose = () => {
        setShowVerifyCode(false);
    };

    const handleNewPasswordModalClose = () => {
        setShowNewPassword(false);
    };

    const goToHome = () => {
        navigation.navigate('LandingPage');
    };

    return (
        <View style={[
            styles.container,
            { padding: 0 },
            isMobile && responsiveStyles.containerMobile
        ]}>
            <View style={[
                { justifyContent: 'center', marginTop: isMobile ? 10 : '3%' },
                isMobile && responsiveStyles.topNavMobile
            ]}>
                <TouchableOpacity onPress={() => goToHome()}>
                    <Text style={[
                        { fontSize: 20, color: 'blue' },
                        isMobile && responsiveStyles.homeLinkMobile
                    ]}>Home</Text>
                </TouchableOpacity>
            </View>
            <View style={[
                { alignItems: 'center', marginTop: isMobile ? 0 : 30, marginBottom: isMobile ? 0 : 16 },
                isMobile && responsiveStyles.logoHeadingContainerMobile
            ]}>
                <Image
                    source={require('../assets/search-logo.png')}
                    style={[
                        styles.Searchlogo,
                        {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        },
                        isMobile && responsiveStyles.logoMobile
                    ]}
                />
                <Text style={[
                    { color: '#ffffff', fontSize: 50, fontWeight: 'bold', alignSelf: 'center', marginTop: isMobile ? 4 : 8 },
                    isMobile && responsiveStyles.titleMobile
                ]}>
                    DALAI LLAMA
                </Text>
            </View>
            <View style={[
                { width: isMobile ? '95%' : '50%', marginLeft: isMobile ? 0 : '25%', alignItems: 'center', marginTop: isMobile ? 8 : 0 },
                isMobile && responsiveStyles.formContainerMobile
            ]}>
                <View style={[
                    { width: '100%', marginBottom: isMobile ? 6 : 16 },
                    isMobile && responsiveStyles.inputGroupMobile
                ]}>
                    {/* Add label for email */}
                    <Text style={isMobile ? responsiveStyles.labelMobile : { fontSize: 16, marginBottom: 4, color: '#4b5563', fontWeight: 'bold' }}>Email</Text>
                    <TextInput
                        style={[
                            styles.input,
                            { width: '100%', height: 44 },
                            emailError ? styles.inputError : null,
                            isMobile && responsiveStyles.inputMobile
                        ]}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                        }}
                        placeholder="Registered Email"
                        editable={!isLoginLoading}
                    />
                    {showError && emailError ? (
                        <Text style={[
                            styles.errorText,
                            isMobile && responsiveStyles.errorTextMobile
                        ]}>
                            {emailError.split(' ').reduce((acc, word, index) => {
                                if (index > 0 && index % 3 === 0) {
                                    acc.push(<Text key={index}>{`${word} `}</Text>);
                                } else {
                                    acc.push(<Text key={index}>{`${word} `}</Text>);
                                }
                                return acc;
                            }, [])}
                        </Text>
                    ) : null}
                </View>
                <View style={[
                    { width: '100%', marginBottom: isMobile ? 6 : 16 },
                    isMobile && responsiveStyles.inputGroupMobile
                ]}>
                    {/* Add label for password */}
                    <Text style={isMobile ? responsiveStyles.labelMobile : { fontSize: 16, marginBottom: 4, color: '#4b5563', fontWeight: 'bold' }}>Password</Text>
                    <TextInput
                        style={[
                            styles.input,
                            { width: '100%', height: 44 },
                            passwordError ? styles.inputError : null,
                            isMobile && responsiveStyles.inputMobile
                        ]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry
                        editable={!isLoginLoading}
                    />
                </View>
                <View style={[
                    { flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', width: '100%' },
                    isMobile && responsiveStyles.buttonRowMobile
                ]}>
                    <View style={[
                        { width: '100%', margin: 0 },
                        isMobile && responsiveStyles.buttonContainerMobile
                    ]}>
                        <Button mode="contained" onPress={onLoginPress} disabled={isLoginLoading}>
                            Login
                        </Button>
                    </View>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleModalClose}
            >
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => handleModalClose()}>
                        <MaterialIcons name="cancel" size={24} color="gray" />
                    </TouchableOpacity>

                    <View style={[styles.modalView, { backgroundColor: '#d3d3d3' }]}>
                        <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                        <RegistrationCarousel />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showResetPassword}
                onRequestClose={handleResetPasswordModalClose}
            >
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => handleResetPasswordModalClose()}>
                        <MaterialIcons name="cancel" size={24} color="gray" />
                    </TouchableOpacity>

                    <View style={[styles.modalView, { backgroundColor: '#d3d3d3' }]}>
                        <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                        <ResetPassword onClose={handleResetPasswordModalClose} verificationEmail={setShowVerificationEmail} verifyCodeModal={setShowVerifyCode} />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showVerifyCode}
                onRequestClose={handleVerifyCodeModalClose}
            >
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => handleVerifyCodeModalClose()}>
                        <MaterialIcons name="cancel" size={24} color="gray" />
                    </TouchableOpacity>

                    <View style={[styles.modalView, { backgroundColor: '#d3d3d3' }]}>
                        <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                        <InputCode onClose={handleVerifyCodeModalClose} verificationEmail={showVerificationEmail} showNewPasswordModal={setShowNewPassword} />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showNewPassword}
                onRequestClose={handleNewPasswordModalClose}
            >
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => handleNewPasswordModalClose()}>
                        <MaterialIcons name="cancel" size={24} color="gray" />
                    </TouchableOpacity>

                    <View style={[styles.modalView, { backgroundColor: '#d3d3d3' }]}>
                        <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                        <NewPassword onClose={handleNewPasswordModalClose} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Responsive styles
const responsiveStyles = StyleSheet.create({
    containerMobile: {
        padding: 0,
        backgroundColor: '#d3d3d3',
    },
    topNavMobile: {
        marginTop: 10,
        alignItems: 'flex-start',
    },
    homeLinkMobile: {
        fontSize: 16,
    },
    logoHeadingContainerMobile: {
        marginTop: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    logoMobile: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginVertical: 0,
        marginBottom: 12,
    },
    titleMobile: {
        fontSize: 24,
        marginTop: 4,
        marginBottom: 0,
    },
    loaderContainerMobile: {
        width: '100%',
        marginLeft: 0,
        position: 'relative',
        alignItems: 'center',
    },
    formContainerMobile: {
        width: '95%',
        marginLeft: 0,
        alignItems: 'center',
        marginTop: 0,
    },
    inputGroupMobile: {
        width: '100%',
        marginBottom: 8,
    },
    inputMobile: {
        fontSize: 14,
        padding: 8,
        height: 40,
    },
    errorTextMobile: {
        fontSize: 10,
    },
    buttonRowMobile: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },
    buttonContainerMobile: {
        width: '100%',
        margin: 0,
    },
    labelMobile: {
        fontSize: 13,
        marginBottom: 2,
        color: '#4b5563',
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
});

export default Home;


