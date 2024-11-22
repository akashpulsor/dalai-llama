// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity,StyleSheet,  ActivityIndicator ,FlatList } from 'react-native';

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
import CreateCampaignModal from '../component/CreateCampaignModal';
import CampaignRun from '../component/CampaignRun';

// Separate component for individual agent item
const CampaignItem = ({ item , onBlur}) => {
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

  useEffect(() => {
    onBlur(showCreateAgentModal);
  }, [showCreateAgentModal]);

  const handleEditAgent = () => {
      
      setShowCreateAgentModal(true);
      onBlur(true);
  };

  const updateAgent = (agentData, agentId) => {
      // Implement update logic
      setShowCreateAgentModal(false);
  };



  return (
      <TouchableOpacity onPress={handleEditAgent}>
          <View style={styles.cardContainer}>
              <CampaignRun onClose={setShowCreateAgentModal} openModal={showCreateAgentModal} campaignId={item} />
          </View>
      </TouchableOpacity>
  );
};

// Create your functional component
const Campaigns = ({navigation}) => {
    const [data, setData] = useState([
        {"campaignId":1},
        {"campaignId":2},
        {"campaignId":3}
    ]);

    const [blur, setBlur] = useState(false);
    const [loginMutation] = useLoginMutation();

    const renderAgentItem = ({ item }) => (
        <CampaignItem 
            item={item} 
            onBlur={setBlur}
        />
    );

    return (
        <View style={[styles.container, {padding: 0}]}>
            <View style={[
                styles.listContainer, 
                blur && styles.blurContainer
            ]}>
                <FlatList
                    data={data}
                    renderItem={renderAgentItem}
                    keyExtractor={(item) => item.campaignId.toString()}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListHeaderComponent={<View style={styles.headerSpace} />}
                    ListFooterComponent={<View style={styles.footerSpace} />}
                />
            </View>
            
            {/* Optional: Overlay to capture touches when blurred */}
            {blur && (
                <TouchableOpacity 
                    style={styles.blurOverlay} 
                    activeOpacity={1} 
                    onPress={() => setBlur(false)}
                />
            )}
        </View>
    );
};


// Export the component
export default Campaigns;


const styles = StyleSheet.create({
  agentText: {
      fontSize: 16,
      fontWeight: 'bold',
  },
  container: {
      flex: 1,
      backgroundColor:'#d3d3d3'
  },
  listContainer: {
      paddingHorizontal: 10, // Minimal horizontal padding
      paddingVertical: 0, // Remove vertical padding
  },
  headerSpace: {

      height: 10, // Minimal top spacing
  },
  footerSpace: {

      height: 10, // Minimal bottom spacing
  },
  separator: {
      margin:'1%',
      height: 5, // Minimal space between items
  },
  cardContainer: {
      width: '100%',
      height: 50, // Fixed height instead of percentage
      backgroundColor: 'white',
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 10,
  },
  absoluteFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      zIndex: 999,  // Ensure blur is on top
  },
  blurContainer: {
    opacity: 0.3,  // Reduces opacity to create blur-like effect
  },
  blurOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',  // Semi-transparent overlay
      zIndex: 10,
  },
});


