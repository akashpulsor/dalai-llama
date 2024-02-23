// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Button, Modal } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import { setSignIn } from './authSlice';
// Create your functional component
const BuisnessLogin = ({navigation}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [errorFlag, setErrorFlag] = useState(false);
    const dispatch = useDispatch();     
    const handleLogin = () => {
        // Perform actions with username and password, such as logging in to WordPress
        console.log('Username:', username);
        console.log('Password:', password);
        console.log('Company Name:', companyName);
        console.log('email:', companyName);
        console.log('Password:', password);
        const user = {
          isLoggedIn: true,
          email: email,
          userName: username,
          password:password,
          companyName:companyName
        }
        // Close the modal
        setModalVisible(false);
        dispatch(setSignIn(user));
      };
      
      const sinUp = () => {
        // Perform actions with username and password, such as logging in to WordPress
        console.log('Username:', username);
        console.log('Password:', password);
        console.log('Company Name:', companyName);
        console.log('email:', companyName);
        console.log('Password:', password);
        const user = {
          isLoggedIn: true,
          email: email,
          userName: username,
          password:password,
          companyName:companyName
        }
        // Close the modal
        setModalVisible(false);

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

            <View style={[styles.rowItem1,{marginTop:100}]}>
                <View style={styles.LoginInputFlex}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Email..."
                    />
                </View>

                <View style={styles.LoginInput}>
                    <TextInput
                        style={styles.LoginInput}
                        placeholder=" Password..."
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
                              placeholder="Email"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={true}
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
