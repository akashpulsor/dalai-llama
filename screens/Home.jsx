// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,TouchableWithoutFeedback,  Modal, ActivityIndicator,Image } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setSignIn } from '../component/authApi';
import CountryCodeDropdownPicker from 'react-native-dropdown-country-picker';
import { useLoginMutation, useRegisterMutation } from '../component/authApi';
import { useSelector } from 'react-redux';
import {setToken,setUser} from "../component/authSlice";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {selectIsLoggedIn} from '../component/authSlice';
import Toast from 'react-native-toast-message';
import TextInput from '../component/TextInput';
import { emailValidator } from '../helper/emailValidator'
import { passwordValidator } from '../helper/passwordValidator'
import Button from '../component/Button';
import RegistrationCarousel from '../component/RegistrationCarousel';
import ResetPassword from '../component/ResetPassword';
import PhoneInput from "react-native-phone-number-input";
import InputCode from '../component/InputCode';
import NewPassword from '../component/NewPassword';

const ProgressBar = ({ progress }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: progress === 100 ? '#34C759' : '#007AFF' }]} />
  </View>
);

// Create your functional component
const Home = ({navigation}) => {

    const [email, setEmail] = useState({ value: '', error: '' })
    const [password, setPassword] = useState({ value: '', error: '' })
    const [modalVisible, setModalVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
  
      countryCode: 'US',
      countryCallingCode: '1',
  
      companyName: '',
      companySize: '',
      activityDescription:'',
  
      password: '',
      confirmPassword: '',
    });




    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showVerifyCode, setShowVerifyCode] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);


    const onLoginPressed = () => {
      const emailError = emailValidator(email.value)
      const passwordError = passwordValidator(password.value)
      if (emailError || passwordError) {
        setEmail({ ...email, error: emailError })
        setPassword({ ...password, error: passwordError })
        return
      }
      /**
       * 
       * add login mutation
       */
    }

    const handleModalClose = () => {
      setModalVisible(false);
    }

    const handleRegisterPress = () => {
      setModalVisible(true);
    }

    const handleResetPasswordPress = () => {
      setShowResetPassword(true);
    }

    const handleResetPasswordModalClose = () => {
      setShowResetPassword(false);
    }

    const handleVerifyCodeModalClose = () => {
      setShowVerifyCode(false);
    }

    const handleNewPasswordModalClose = () => {
      setShowNewPassword(false);
    }




   

  return (
    // Main container with a gray background
    <View style={[styles.container,{padding: 0,}]}>
       
      <Image source={require('../assets/search-logo.png')} style={[styles.Searchlogo,{shadowColor:"white",
                shadowOffset:3,
                shadowOpacity:10,    shadowColor: '#000',
                shadowOffset: {
                width: 0,
                height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,}]} />
            <Text style={{ color:'#ffffff',fontSize: 50, fontWeight: 'bold', alignSelf:'center' }}>
                    DALAI LLAMA
            </Text>
            <View style={{ width:'50%', marginLeft:'25%',}}>
                  <TextInput
                      label="Email"
                      returnKeyType="next"
                      value={email.value}
                      onChangeText={(text) => setEmail({ value: text, error: '' })}
                      error={!!email.error}
                      errorText={email.error}
                      autoCapitalize="none"
                      autoCompleteType="email"
                      textContentType="emailAddress"
                      keyboardType="email-address"
                />
                <TextInput
                    label="Password"
                    returnKeyType="done"
                    value={password.value}
                    onChangeText={(text) => setPassword({ value: text, error: '' })}
                    error={!!password.error}
                    errorText={password.error}
                    secureTextEntry
                /> 
            </View>    
            
        <View style={[{flexDirection:'row', alignItems:'center',marginLeft:'30%'}]}>

           <View style={{ width:'20%',margin:'5%',height:'90%'}}>
              <Button mode="contained" onPress={onLoginPressed}>
                Login
              </Button>
            </View>          

                
            <View style={{width:'20%',margin:'5%',height:'90%'}}>
              <Button mode="contained" onPress={handleRegisterPress}>
                Register
              </Button>
            </View>

                  <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={handleModalClose}
                    >
                       <View style={styles.centeredView}>
                          <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleModalClose()}>
                              <MaterialIcons name="cancel" size={24} color="gray" />
                          </TouchableOpacity>

                          <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                          <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />   
                          <RegistrationCarousel/>
                                                      
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
                          <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleResetPasswordModalClose()}>
                              <MaterialIcons name="cancel" size={24} color="gray" />
                          </TouchableOpacity>

                          <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                          <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />   
                              <ResetPassword onClose={handleResetPasswordModalClose} verifyCodeModal={setShowVerifyCode}/>
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
                          <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleVerifyCodeModalClose()}>
                              <MaterialIcons name="cancel" size={24} color="gray" />
                          </TouchableOpacity>

                          <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                          <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />   
                              <InputCode onClose={handleVerifyCodeModalClose} showNewPasswordModal={setShowNewPassword}/>
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
                          <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleNewPasswordModalClose()}>
                              <MaterialIcons name="cancel" size={24} color="gray" />
                          </TouchableOpacity>

                          <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                          <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />   
                              <NewPassword onClose={handleNewPasswordModalClose}/>
                        </View>
                      </View>
                      
                  </Modal>
                  <View style={{justifyContent:'center'}}>
                    <TouchableOpacity onPress={() =>  handleResetPasswordPress()}>
                        <Text style={{ fontSize: 10, color: 'blue' }}>Reset Password</Text>
                    </TouchableOpacity>
                      
                  </View>
                  
        </View>


                    
    </View>
  );
};


// Export the component
export default Home;
