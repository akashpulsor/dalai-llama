// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity,TouchableWithoutFeedback,Button,  Modal, ActivityIndicator,Image } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { setSignIn } from './authApi';
import CountryCodeDropdownPicker from 'react-native-dropdown-country-picker';
import { useLoginMutation, useRegisterMutation } from './authApi';
import { useSelector } from 'react-redux';
import {setToken,setUser} from "./authSlice";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {selectIsLoggedIn} from './authSlice';
import Toast from 'react-native-toast-message';
// Create your functional component
const DalaiLLamaSearch = ({navigation}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
   
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const isLoggedIn =  useSelector(selectIsLoggedIn);
    const [errorFlag, setErrorFlag] = useState(false);
    const [selected, setSelected] = useState('+91');
    const [country, setCountry] = useState('');
    const [phone, setPhone] = useState('');
    const dispatch = useDispatch();
    const [loginMutation, { data: authData, isLoading, isSuccess, isError, error }] = useLoginMutation();

    const [registerMutation, { data: registerData, isRegistrationLoading, isRegistrationSuccess, isRegistrationError, registrationError }] = useRegisterMutation();
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [companyNameError, setCompanyNameError] = useState('');
    const [usernameError, setUsernameError] = useState('');

    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [focused, setFocused] = useState(false);
    const [registerVisible, setRegisterVisible] = useState(false);

    const [globalError, setGlobalError] = useState('');

    useEffect(() => {
        if (globalError) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: globalError,
            position: 'bottom',
            bottomOffset:'80%',
            backgroundColor: 'red',
            text1Style: { color: 'white' }, // Change the text color here
            text2Style: { color: 'white' },// Change the text color here
          });
        }
      }, [globalError]);
    const handleLogin = async  () => {
        validateEmail();
        validatePassword();
        await loginMutation({ email, password });
      };
      
      const handleRegister = async () => {
        validateName();
        validateEmail();
        validatePhone();
        validatePassword();
        if (nameError || emailError || phoneError || passwordError) {
            setGlobalError('Please fix the errors');
        } else {
            showRegisterView();
        }
        await registerMutation({email,
            name,
            phone,
            password});
      };
 
    const validateEmail = () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          setEmailError('Invalid email address');
        } else {
          setEmailError(null);
        }
    };

    const validatePhone = () => {
        if (phone.length < 9) {
          setPhoneError('Phone number must be at least 10 digits long');
        } else {
          setPhoneError(null);
        }
    };

    const validatePassword = () => {
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
        } else {
            setPasswordError(null);
        }
    };

    const search =() =>{
        if(!isLoggedIn){
            setModalVisible(true);
        }
    };

    const showRegisterView = () =>{
        setRegisterVisible(true);
    }

    const validateName = () => {
        if (name.length < 3) {
          setNameError('Name must be at least 3 characters long');
        } else {
          setNameError(null);
        }
    };

    const handleModalClose =() =>{
        setModalVisible(false);
    }

  return (
    // Main container with a gray background
    <View style={[styles.container,{padding: 0,}]}>
        
        <View style={[styles.rowContainer,{marginLeft:'30%',marginRight:'30%'}]}>
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
        </View>
        
        <View style={[styles.rowContainer,{flexDirection:'row',marginLeft: '10%',marginTop:'10%',
        justifyContent:'center',position: 'relative',justifyContent:'center',
        width: '80%'}]}>
            <TextInput
            style={[styles.BlogTopicInputBox,{marginTop:'5%',alignSelf:'center',height:'50%', borderWidth:2,
                borderRightWidth:0,
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
                 {isLoggedIn && <TouchableOpacity onPress={search} style={{ backgroundColor: '#0092ca',alignSelf:'center',width:'40%', padding: 10, borderRadius: 10, height: 40 }}>
                    <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Upsc Digest</Text>
                </TouchableOpacity>
                }

                {isLoggedIn && <TouchableOpacity onPress={search} style={{ backgroundColor: '#0092ca',alignSelf:'center',width:'40%', padding: 10, borderRadius: 10, height: 40 }}>
                <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Law Digest</Text>
                </TouchableOpacity>
                }
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
                        {
                                                    !registerVisible && <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                                                    <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                                                    <Text style={styles.modalText}>Enter your  credentials:</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Email"
                                                        value={setEmail}
                                                        onChangeText={setEmail}
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
                                                      <Button title="Login" onPress={()=>{handleLogin()}} />
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
                                                    <View style={{width:'100%'}}>
                                                    {nameError && (
            <Text style={{ color: 'red' }}>{nameError}</Text>
          )}
                                                    <TextInput
                                                      style={styles.input}
                                                      placeholder="Name"
                                                      value={name}
                                                      onChangeText={(text) => {
                                                        setName(text);
                                                        validateName();
                                                      }}
                                                      error={nameError}
                                                    >
                                                    
                                                    </TextInput>
            
                                                    </View>
                                                    
                                                    <View style={{width:'100%'}}>
                                                    {emailError && (
            <Text style={{ color: 'red' }}>{emailError}</Text>
          )}
                                                    <TextInput
                                                      style={styles.input}
                                                      placeholder="Email"
                                                      value={email}
                                                      onChangeText={(text) => {
                                                        setEmail(text);
                                                        validateEmail();
                                                      }}
                                                      error={emailError}
                                                       
                                                    >
                                                    
                                                        </TextInput>
            
                                                    </View>
                                                    
                                                    <View style={{width:'100%'}}>
                                                    {phoneError && (
            <Text style={{ color: 'red' }}>{phoneError}</Text>
          )}
                                                    <TextInput
                                                      style={styles.input}
                                                      placeholder="Phone"
                                                      value={phone}
                                                      onChangeText={(text) => {
                                                        setPhone(text);
                                                        validatePhone();
                                                      }}
                                                      error={phoneError}
                                                    >
                                                    
                                                        </TextInput>

                                                                    
                                                    </View>

                                                    <View style={{width:'100%'}}>
                                                    {passwordError && (
                                                            <Text style={{ color: 'red' }}>{passwordError}</Text>
                                                    )}

                                                    <TextInput
                                                      style={styles.input}
                                                      placeholder="Password"
                                                      value={password}
                                                      onChangeText={(text) => {
                                                        setPassword(text);
                                                        validatePassword();
                                                      }}
                                                      error={passwordError}
                                                      secureTextEntry={true}
                                                    >
                                                    
                                                    </TextInput>
                                                    </View>

                                                    <View style={{ width: '60%', height: '100%', borderRadius: '8', margin: '10%' }}>
                                                      <Button title="Register" onPress={() => { handleRegister() }} />
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
