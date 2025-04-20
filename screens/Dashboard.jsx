// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,TouchableWithoutFeedback, TextInput, ScrollView,Modal, ActivityIndicator,Image } from 'react-native';
import styles from '../styles';
import Button from '../component/Button';
import CreateAgentModal from '../component/CreateAgentModel';
import CreateCampaignModal from '../component/CreateCampaignModal';
import AddLeadModal from '../component/AddLeadModal';
import BusinessDataSnapShot from '../component/BusinessDataSnapshot';
import CallDashBoard from '../component/CallDashBoard';
import {selectUser, selectOnboardingData} from '../component/authSlice';
import { useSelector } from 'react-redux';

import {useGetBusinessDataQuery, useGetOnBoardingDataQuery} from '../component/authApi';
import useEventSource from '../component/useEventSource';

// Create your functional component
const Dashboard = ({navigation}) => {

    const [showCreateCampaignModal, setCreateCampaignModal] = useState(false);
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [editAgent, setEditAgent] = useState(false);
    const user =  useSelector(selectUser);
    const onBoardingData = useSelector(selectOnboardingData);

    // Fetch event source data with proper user ID
    const { callLogs, charges, campaignRuns, status } = useEventSource(user?.id);

    // Debug logging
    useEffect(() => {
        console.log('EventSource Status:', status);
        console.log('User ID:', user?.id);
        console.log('New Events:', { callLogs, charges, campaignRuns });
    }, [status, callLogs, charges, campaignRuns]);

    const saveAgent = (agentData) => {
        // Implement update logic
        setShowCreateAgentModal(false);
    };

    return (
        // Main container with a gray background
        <View style={[styles.container]}>
            <View style={{ width:'100%', height:'30%',alignItems:'center'}}>
                <BusinessDataSnapShot navigation={navigation}/>
            </View>

            <View style={{ width:'100%', height:'70%',alignItems:'center'}}>
                <CallDashBoard  businessId={user.id}/>
            </View>
            <CreateAgentModal 
                openModal={showCreateAgentModal} 
                onClose={() => setShowCreateAgentModal(false)}
                onSaveAgent={(agentData) => saveAgent(agentData)}
                user={user?.id}
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


