// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity,Button,  Modal, ActivityIndicator,Image } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setSignIn } from './authApi';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useLoginMutation, useRegisterMutation } from './authApi';
import { useSelector } from 'react-redux';
import {setToken,setUser} from "./authSlice";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {selectIsLoggedIn} from './authSlice';
// Create your functional component
const DalaiLLamaSearch = ({navigation}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const isLoggedIn =  useSelector(selectIsLoggedIn);
    const [errorFlag, setErrorFlag] = useState(false);
    const dispatch = useDispatch();
    const [loginMutation, { data: authData, isLoading, isSuccess, isError, error }] = useLoginMutation();

    const [registerMutation, { data: registerData, isRegistrationLoading, isRegistrationSuccess, isRegistrationError, registrationError }] = useRegisterMutation();
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [companyNameError, setCompanyNameError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [focused, setFocused] = useState(false);
    const [registerVisible, setRegisterVisible] = useState(false);
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

    const search = () => {
        // Basic email validation regex
        if(!isLoggedIn){
            setModalVisible(true);
            setRegisterVisible(false);
        }
    };

    const showRegisterView = () =>{
        setRegisterVisible(true);
    }

    const isValidPassword = (password) => {
        // Password must contain at least 8 characters, including at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(password);
    };
  return (
    // Main container with a gray background
    <View style={[styles.container,{padding: 0,}]}>

        <View style={[styles.rowContainer,{marginLeft:'30%',marginRight:'30%'}]}>
            <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
            <Text style={{ color:'#ffffff',fontSize: 50, fontWeight: 'bold', alignSelf:'center',shadowColor:"white",
    shadowOffset:3,
    shadowOpacity:10 }}>
                    DALAI LLAMA SEARCH
            </Text>
        </View>
        
        <View style={[styles.rowContainer,{flexDirection:'row',marginLeft: '10%',marginTop:'10%',justifyContent:'center',position: 'relative',justifyContent:'center',
        width: '80%'}]}>
            <TextInput
            style={[styles.BlogTopicInputBox,{marginTop:'5%',alignSelf:'center',height:'50%', borderWidth:2,
                borderTopRightRadius:0, borderBottomRightRadius:0,fontSize: 18, col:'gray'
            }]}
            placeholder="Ask me any thing.."
            onChangeText={(text) => setSearchQuery(text)}
            onFocus={() => setFocused(true)}
            maxLength={100}
            />
        <View style={[styles.BlogTopicInputBox, {marginTop: '5%', width: '5%', alignSelf: 'center', height: '50%', borderWidth: 2, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, justifyContent: 'center'}]}>
        <TouchableOpacity style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}
         hitSlop={{top: 20, bottom: 20, left: 50, right: 50}} onPress={search}>
            <FontAwesome name="arrow-circle-up" size={40} color="white" />
        </TouchableOpacity>
        </View>
        </View>
        <View style={[styles.rowContainer,{marginLeft:'30%',marginRight:'30%',flexDirection:'row',justifyContent: 'space-between',alignContent:'center', alignItems:'center'}]}>
            <TouchableOpacity style={[styles.card,{backgroundColor: '#d3d3d3',height:'40%',paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,borderColor: 'gray',justifyContent: 'center', borderWidth:2}]}>
                  <Text style={{fontSize: 24,fontWeight: 'bold',color:'#ffffff',textAlign: 'center',shadowColor:"white",
    shadowOffset:3,
    shadowOpacity:10}}>UPSC DIGEST</Text>        
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card,{backgroundColor: '#d3d3d3',paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,height:'40%',justifyContent: 'center',borderColor: 'gray', borderWidth:2}]}>
                <Text style={{  fontSize: 24,fontWeight: 'bold',color:'#ffffff',textAlign: 'center',shadowColor:"white",
    shadowOffset:3,
    shadowOpacity:10}}>LAW DIGEST</Text>           
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
                        {
                                                    !registerVisible && <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                                                    <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                                                    <Text style={styles.modalText}>Enter your  credentials:</Text>
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
                                                    <View style={{flexDirection:'row', justifyContent: 'center'}}>
                                                      <View style={{width:'60%', height:'100%', margin:'10%'}}>
                                                      <Button title="Login" onPress={()=>{handleWordPressLogin()}} />
                                                      </View>
                                  
                                                      <View style={{width:'60%', height:'100%',borderRadius:'8', margin:'10%'}}>
                                                      <Button title="Register" onPress={()=>{showRegisterView()}} />
                                                      </View>
                              
                                                    </View>
                                                    
                                                  </View>
                        }

{
                                                    registerVisible && <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                                                    <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                                                    <Text style={styles.modalText}>Register:</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Username"
                                                        value={username}
                                                        onChangeText={setUsername}
                                                    />
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Email"
                                                        value={username}
                                                        onChangeText={setUsername}
                                                    />

                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Number"
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
                                                   
                                                      <View style={{width:'60%', height:'100%',borderRadius:'8', margin:'10%'}}>
                                                      <Button title="Register" onPress={()=>{showRegisterView()}} />
                                                      </View>
                                                    
                                                  </View>
                        }

                      </View>
                    </Modal>
    </View>
  );
};

// Export the component
export default DalaiLLamaSearch;
