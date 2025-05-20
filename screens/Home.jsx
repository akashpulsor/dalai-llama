// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Image, useWindowDimensions, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLoginMutation } from '../component/authApi';
import { emailValidator } from '../helper/emailValidator';
import Button from '../component/Button';
import RegistrationCarousel from '../component/RegistrationCarousel';
import ResetPassword from '../component/ResetPassword';
import InputCode from '../component/InputCode';
import NewPassword from '../component/NewPassword';

// Use a clean, soft static background instead of animated gradient
const Home = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showVerifyCode, setShowVerifyCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showVerificationEmail, setShowVerificationEmail] = useState(false);
  const [loginMutation, { isLoading: isLoginLoading, isError: isLoginError, error: loginError }] = useLoginMutation();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 600;

  useEffect(() => {
    if (isLoginError) {
      setShowError(true);
      setErrorMessage('Login failed. Please try again!');
    }
  }, [isLoginError]);

  const onLoginPress = async () => {
    const emailErr = emailValidator(email);
    if (emailErr) {
      setShowError(true);
      setErrorMessage(emailErr);
      return;
    }
    let body = { userName: email, password };
    await loginMutation(JSON.stringify(body));
  };

  // Playful floating action chips
  const FloatingAction = ({ icon, label, onPress, style }) => (
    <TouchableOpacity style={[styles.fab, style]} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={24} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.fabText}>{label}</Text>
    </TouchableOpacity>
  );

  // Animated mascot bounce
  const mascotAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnim, { toValue: -10, duration: 700, useNativeDriver: true }),
        Animated.timing(mascotAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Back to Landing Page button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('LandingPage')} activeOpacity={0.88}>
        <Text style={styles.backBtnText}>← Home</Text>
      </TouchableOpacity>
      {/* Static, soft background */}
      <View style={styles.softBg} />
      <View style={styles.centeredCard}>
        <Animated.Image
          source={require('../assets/llama-mascot.png')}
          style={[styles.bigMascot, { transform: [{ translateY: mascotAnim }] }]}
        />
        <Text style={styles.title}>Welcome to Dalai Llama <Text style={{fontSize: 32}}>🦙</Text></Text>
        <Text style={styles.subtitle}>AI Outbound Calling Platform</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, showError && emailError ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#b39ddb"
          />
          <TextInput
            style={[styles.input, showError && password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#b39ddb"
          />
          {showError && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>
        <Button mode="contained" onPress={onLoginPress} disabled={isLoginLoading} style={styles.loginBtn}>
          {isLoginLoading ? <ActivityIndicator color="#fff" /> : 'Login'}
        </Button>
        <View style={styles.chipRow}>
          <FloatingAction icon="person-add" label="Register" onPress={() => setModalVisible(true)} style={{ backgroundColor: '#8e24aa' }} />
          <FloatingAction icon="key" label="Forgot Password?" onPress={() => setShowResetPassword(true)} style={{ backgroundColor: '#007AFF' }} />
        </View>
      </View>
      {/* Registration Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCardNew}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="cancel" size={32} color="#8e24aa" />
            </TouchableOpacity>
            <RegistrationCarousel />
          </Animated.View>
        </View>
      </Modal>
      {/* Reset Password Modal */}
      <Modal visible={showResetPassword} animationType="fade" transparent onRequestClose={() => setShowResetPassword(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCardNew}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowResetPassword(false)}>
              <MaterialIcons name="cancel" size={32} color="#007AFF" />
            </TouchableOpacity>
            <ResetPassword onClose={setShowResetPassword} verificationEmail={setShowVerificationEmail} verifyCodeModal={setShowVerifyCode} />
          </Animated.View>
        </View>
      </Modal>
      {/* Code Input Modal */}
      <Modal visible={showVerifyCode} animationType="fade" transparent onRequestClose={() => setShowVerifyCode(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCardNew}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowVerifyCode(false)}>
              <MaterialIcons name="cancel" size={32} color="#007AFF" />
            </TouchableOpacity>
            <InputCode onClose={setShowVerifyCode} verificationEmail={showVerificationEmail} showNewPasswordModal={setShowNewPassword} />
          </Animated.View>
        </View>
      </Modal>
      {/* New Password Modal */}
      <Modal visible={showNewPassword} animationType="fade" transparent onRequestClose={() => setShowNewPassword(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalCardNew}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowNewPassword(false)}>
              <MaterialIcons name="cancel" size={32} color="#8e24aa" />
            </TouchableOpacity>
            <NewPassword onClose={setShowNewPassword} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3', // match LandingPage gray
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 60,
    width: 360,
    maxWidth: '95%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#e3e8fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f8fafd',
  },
  inputError: {
    borderColor: '#ff1744',
    backgroundColor: '#fff0f0',
  },
  errorText: {
    color: '#ff1744',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 14,
    marginBottom: 18,
    backgroundColor: '#7c3aed',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    elevation: 4,
    marginHorizontal: 6,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,0,60,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardNew: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: 32,
    width: 420,
    maxWidth: '98%',
    alignItems: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  bigMascot: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 8,
  },
  softBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d3d3d3', // soft, static, professional
    zIndex: -2,
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(90deg, #f3e7e9 0%, #e3eeff 100%)', // fallback to white if gradient not supported
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 22,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#e3e8fd',
  },
  backBtnText: {
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.3,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default Home;


