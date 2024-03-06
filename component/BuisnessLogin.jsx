// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Button, Modal, ActivityIndicator } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import { setSignIn } from './authApi';
import { useLoginMutation, useRegisterMutation } from './authApi';
import {setToken,setUser} from "./authSlice";
// Create your functional component
const BuisnessLogin = ({navigation}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    
    const [errorFlag, setErrorFlag] = useState(false);
    const dispatch = useDispatch();
    const [loginMutation, { data: authData, isLoading, isSuccess, isError, error }] = useLoginMutation();

    const [registerMutation, { data: registerData, isRegistrationLoading, isRegistrationSuccess, isRegistrationError, registrationError }] = useRegisterMutation();
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [companyNameError, setCompanyNameError] = useState('');
    const [usernameError, setUsernameError] = useState('');

    const handleLogin = async  () => {
        // Perform actions with username and password, such as logging in to WordPress
        // Reset errors
        setEmailError('');
        setPasswordError('');

        if (!email) {
            setEmailError('Email is required');
            return;
        }

        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email');
            return;
        }

        if (!password) {
            setPasswordError('Password is required');
            return;
        }

        if (!isValidPassword(password)) {
            setPasswordError('Password must contain at least 8 characters,\n including at least one letter and one number');
            return;
        }
        await loginMutation({ email, password });
      };
      
      const sinUp = () => {
        // Perform actions with username and password, such as logging in to WordPress
        // Close the modal
          // Reset errors
          setEmailError('');
          setPasswordError('');
          setCompanyNameError('');
          setUsernameError('');

          let isValid = true;

          if (!username) {
              setUsernameError('Username is required');
              isValid = false;
          }

          if (!password) {
              setPasswordError('Password is required');
              isValid = false;
          }

          if (!isValidEmail(email)) {
              setEmailError('Please enter a valid email');
              isValid = false;
          }

          if (!isValidPassword(password)) {
              setPasswordError('Password:at least 8 characters, one letter and one number');
              isValid = false;
          }
          if (!email) {
              setEmailError('Email is required');
              isValid = false;
          }

          if (!companyName) {
              setCompanyNameError('Company name is required');
              isValid = false;
          }

          if (!isValid) {
              return;
          }
        registerMutation({email,
            username,
            password,
            companyName});
      };
    const isValidEmail = (email) => {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password) => {
        // Password must contain at least 8 characters, including at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(password);
    };
  return (
    // Main container with a gray background
    <View style={styles.container}>
        <View style={styles.rowContainer}>
        <View style={[styles.rowItem1,{marginTop:150,marginBottom:150}]}>
                <Text style={{ fontSize: 50, fontWeight: 'bold', marginBottom: 20 }}>
                    DALAI LLAMA BUSINESS 
                </Text>
            </View>
        </View>
        <View style={styles.rowContainer}>
            {
         
              isLoading?<ActivityIndicator color={'blue'}/>:isError?<Text>{error.toString()}</Text>:<View/>
            }
            <View style={[styles.rowItem1,{marginTop:100}]}>
                <View style={styles.LoginInputFlex}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Email..."
                        onChangeText={setEmail}
                        onFocus={()=>{setEmailError('')}}
                    />

                </View>
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
                <View style={styles.LoginInput}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Password..."
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        onFocus={()=>{setPasswordError('')}}
                    />
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                <View style={styles.LoginButtonFlex}>
                    <View style={{height: 40,width: 350,
    justifyContent: 'flex-end',
    alignItems: 'flex-end', marginRight:5, zIndex : 1}}>
                        <TouchableOpacity style={styles.LoginButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.buttonText}>SignUp</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{height: 40,width: 350,
    justifyContent: 'flex-start',
    alignItems: 'flex-start', marginLeft:5}}>
                        <TouchableOpacity style={styles.LoginButton} onPress={() => {handleLogin()}}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                    </View>

                    <Modal
                            animationType="slide"
                            transparent={true}
                            visible={modalVisible}
                            onRequestClose={() => {
                              setModalVisible(false);
                            }}
                    >
                        <View style={styles.centeredView}>
                          <View style={styles.modalView}>
                            <Text style={styles.modalText}>Sign Up</Text>
                              {
                                  isRegistrationLoading && <ActivityIndicator color={'blue'}/>

                              }
                            <TextInput
                              style={styles.input}
                              placeholder="Username"
                              value={username}
                              onChangeText={setUsername}
                              onFocus={()=>{setUsernameError('')}}
                            />
                              {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
                            <TextInput
                              style={styles.input}
                              placeholder="Password"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={true}
                              onFocus={()=>{setPasswordError('')}}
                            />
                              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                            <TextInput
                              style={styles.input}
                              placeholder="Email"
                              value={email}
                              onChangeText={setEmail}
                              onFocus={()=>{setEmailError('')}}
                            />
                              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
                              <TextInput
                                  style={styles.input}
                                  placeholder="Company Name"
                                  value={companyName}
                                  onChangeText={setCompanyName}
                                  onFocus={()=>{setCompanyNameError('')}}
                              />
                              {!!companyNameError && <Text style={styles.errorText}>{companyNameError}</Text>}
                            <Button title="signUp" onPress={sinUp} />
                          </View>
                        </View>
                    </Modal>                  
                </View>
            </View>    
        </View>
        <View style={styles.rowContainer}>
            
        </View>

    </View>
  );
};

// Export the component
export default BuisnessLogin;
