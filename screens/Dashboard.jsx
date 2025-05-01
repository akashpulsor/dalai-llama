// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,TouchableWithoutFeedback, TextInput, Modal, ActivityIndicator,Image, Dimensions, useWindowDimensions } from 'react-native';
import styles from '../styles';
import Button from '../component/Button';
import CreateAgentModal from '../component/CreateAgentModel';
import CreateCampaignModal from '../component/CreateCampaignModal';
import AddLeadModal from '../component/AddLeadModal';
import BusinessDashboard from '../component/BusinessDashboard';
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

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isSmallScreen = screenWidth < 600;

    const saveAgent = (agentData) => {
        // Implement update logic
        setShowCreateAgentModal(false);
    };

    // Responsive action button style
    const actionButtonStyle = {
        flex: isSmallScreen ? undefined : 1,
        minWidth: isSmallScreen ? '95%' : 160,
        marginHorizontal: isSmallScreen ? 0 : 8,
        marginVertical: isSmallScreen ? 6 : 0,
        borderRadius: 10,
 
        alignSelf: isSmallScreen ? 'center' : 'auto',
    };

    // Centered floating action bar for web only
    const floatingActionBar = {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -((screenWidth * 0.7) / 2) }],
        bottom: 32,
        width: '70%',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        zIndex: 50,
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#d3d3d3' }}>
            <View style={{
                width: '100%',
                alignSelf: 'center',
                backgroundColor: '#d3d3d3',
                alignItems: 'center',
                padding: isSmallScreen ? 8 : 24,
                minHeight: screenHeight,
            }}>
                {/* Unified Business Dashboard */}
                <View style={{ width: '100%', marginBottom: 24, position: 'relative', minHeight: 600 }}>
                    <BusinessDashboard navigation={navigation} />
                    {/* Floating Action Bar (center bottom overlay) - only web */}
                    {!isSmallScreen && (
                        <View style={floatingActionBar}>
                            <View style={actionButtonStyle}>
                                <Button mode="contained" onPress={() => setCreateCampaignModal(true)}>
                                    Create Campaign
                                </Button>
                            </View>
                            <View style={actionButtonStyle}>
                                <Button mode="contained" onPress={() => setShowCreateAgentModal(true)}>
                                    Create Agent
                                </Button>
                            </View>
                            <View style={actionButtonStyle}>
                                <Button mode="contained" onPress={() => setShowAddLeadModal(true)}>
                                    Add Lead
                                </Button>
                            </View>
                        </View>
                    )}
                </View>
                {/* Mobile: Action bar below dashboard */}
                {isSmallScreen && (
                    <View style={{
                        width: '100%',
                        backgroundColor: '#d3d3d3',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingVertical: 8,
                        gap: 0,
                        marginTop: 4,
                    }}>
                        <View style={actionButtonStyle}>
                            <Button mode="contained" onPress={() => setCreateCampaignModal(true)}>
                                Create Campaign
                            </Button>
                        </View>
                        <View style={actionButtonStyle}>
                            <Button mode="contained" onPress={() => setShowCreateAgentModal(true)}>
                                Create Agent
                            </Button>
                        </View>
                        <View style={actionButtonStyle}>
                            <Button mode="contained" onPress={() => setShowAddLeadModal(true)}>
                                Add Lead
                            </Button>
                        </View>
                    </View>
                )}

                <CreateAgentModal 
                    openModal={showCreateAgentModal} 
                    onClose={() => setShowCreateAgentModal(false)}
                    onSaveAgent={(agentData) => saveAgent(agentData)}
                    user={user?.id}
                />
                <CreateCampaignModal onClose={setCreateCampaignModal} openModal={showCreateCampaignModal} />
                <AddLeadModal onClose={setShowAddLeadModal} openModal={showAddLeadModal}/>
            </View>
        </View>
    );
};

// Export the component
export default Dashboard;




