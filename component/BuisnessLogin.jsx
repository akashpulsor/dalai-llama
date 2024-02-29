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


    const handleLogin = async  () => {
        // Perform actions with username and password, such as logging in to WordPress
        await loginMutation({ email, password });
      };
      
      const sinUp = () => {
        // Perform actions with username and password, such as logging in to WordPress
        // Close the modal
        registerMutation({email: email,
            userName: username,
            password:password,
            companyName:companyName});
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
                    />
                </View>
                
                <View style={styles.LoginInput}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Password..."
                        onChangeText={setPassword}
                        secureTextEntry={true}
                    />                    
                </View>

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
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Password"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={true}
                            />
                            
                            <TextInput
                              style={styles.input}
                              placeholder="Ema:wil"
                              value={email}
                              onChangeText={setEmail}

                            />

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
