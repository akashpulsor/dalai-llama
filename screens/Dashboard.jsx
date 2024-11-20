// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,TouchableWithoutFeedback, TextInput, ScrollView,Modal, ActivityIndicator,Image } from 'react-native';
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
import CreateAgentModal from '../component/CreateAgentModel';
import CreateCampaignModal from '../component/CreateCampaignModal';
import AddLeadModal from '../component/AddLeadModal';
import BusinessDataSnapShot from '../component/BusinessDataSnapshot';
import CallDashBoard from '../component/CallDashBoard';



// Create your functional component
const Dashboard = ({navigation}) => {

    const [showCreateCampaignModal, setCreateCampaignModal] = useState(false);
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [editAgent, setEditAgent] = useState(false);

    useEffect(() => {

    }, []);

    const onCreateCampaignPress = async () => {
      ;
    }

   





   
  const saveAgent = (agentData) => {
      // Implement update logic
      setShowCreateAgentModal(false);
  };
  return (
    // Main container with a gray background
    <View style={[styles.container]}>
       
            <View style={{ width:'100%', height:'30%',alignItems:'center'}}>
                    <BusinessDataSnapShot businessId={ 1}/>
            </View>

            <View style={{ width:'100%', height:'70%',alignItems:'center'}}>
                    <CallDashBoard  businessId={ 1}/>
            </View>
            <CreateAgentModal 
                  openModal={showCreateAgentModal} 
                  onClose={() => setShowCreateAgentModal(false)}
                  onSaveAgent={(agentData) => saveAgent(agentData)}
                  createMode={true}
              />

            <CreateCampaignModal onClose={setCreateCampaignModal} openModal={showCreateCampaignModal} />
            <AddLeadModal onClose={setShowAddLeadModal} openModal = {showAddLeadModal}/>

            <View style={{ width:'100%', height:'30%', marginTop:'40%',alignItems:'center',justifyContent:'center',position:'absolute', flexDirection:'row'}}>
                  <View style={{ width:'20%',margin:'5%',height:'90%'}}>
                    <Button mode="contained" onPress={() => setCreateCampaignModal(true)} >
                      Create Campaign
                    </Button>
                  </View>          

                      
                  <View style={{width:'20%',margin:'5%',height:'90%'}}>
                    <Button mode="contained" onPress={() => setShowCreateAgentModal(true)} >
                        Create Agent
                    </Button>
                  </View>

                  <View style={{width:'20%',margin:'5%',height:'90%'}}>
                    <Button mode="contained" onPress={() => setShowAddLeadModal(true)} >
                      Add Lead
                    </Button>
                  </View>
            
                      
            </View>
    </View>

  );
};


// Export the component
export default Dashboard;


