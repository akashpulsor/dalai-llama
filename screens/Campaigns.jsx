// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,TouchableWithoutFeedback, TextInput, Modal, ActivityIndicator,Image } from 'react-native';
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

import { emailValidator } from '../helper/emailValidator'
import { passwordValidator } from '../helper/passwordValidator'
import Button from '../component/Button';
import RegistrationCarousel from '../component/RegistrationCarousel';
import ResetPassword from '../component/ResetPassword';
import PhoneInput from "react-native-phone-number-input";
import InputCode from '../component/InputCode';
import NewPassword from '../component/NewPassword';



// Create your functional component
const Campaigns = ({navigation}) => {

    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showVerifyCode, setShowVerifyCode] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showVerificationEmail, setShowVerificationEmail] = useState(false);
    const [loginMutation, { data: loginData, isLoading:isLoginLoading, isSuccess:isLoginSuccess, isError:isLoginError, error:loginError }] = useLoginMutation();

    useEffect(() => {
     if (isLoginError) {
        setShowError(true);
        setErrorMessage(showError || 'Please try again after sometime.');
      }
    }, [isLoginLoading, isLoginSuccess, isLoginError,loginError, errorMessage, showError]);

    const onLoginPress = async () => {
      const emailError = emailValidator(email)
      if (emailError) {
        setShowError(true);
        setErrorMessage(emailError)
        return
      }
      let body = {"userName": email, "password": password};
      body = JSON.stringify(body);
      console.log(body);
      await loginMutation(body);
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
       


            <View style={{ width:'50%', height:'30%', marginLeft:'25%',alignItems:'center'}}>
                  <View style={{ width:'90%', height:'35%', margin:'1%'}}>
                          <TextInput
                          style={[styles.input,{width:'100%',height:'100%'}, emailError ? styles.inputError : null]}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                          }}
                          placeholder="Registered Email"
                          editable={!isLoginLoading}
                      />
                      {showError && emailError ? (
                        <Text style={styles.errorText}>
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

                  <View style={{ width:'90%', height:'35%', margin:'1%'}}>
                        <TextInput
                                  style={[styles.input,{width:'100%',height:'100%'}, passwordError ? styles.inputError : null]}
                                  value={password}
                                  onChangeText={setPassword}
                                  placeholder="Password"
                                  secureTextEntry
                                  editable={!isLoginLoading}
                              />
                  </View>
                  <View style={[{flexDirection:'row', alignItems:'center',marginRight:'10%'}]}>

                      <View style={{ width:'50%',margin:'5%',height:'90%'}}>
                        <Button mode="contained" onPress={onLoginPress} disabled={isLoginLoading}>
                          Create
                        </Button>
                      </View>          

                          
                      <View style={{width:'50%',margin:'5%',height:'90%'}}>
                        <Button mode="contained" onPress={handleRegisterPress} disabled={isLoginLoading}>
                          Register
                        </Button>
                      </View>

                      <View style={{justifyContent:'center', marginTop:'3%'}}>
  
                      </View>
                  </View>
                     
            </View>



      
            
        
           
            


                  



                    
    </View>
  );
};


// Export the component
export default Campaigns;


