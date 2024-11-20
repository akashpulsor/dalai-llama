import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet,TouchableOpacity } from 'react-native';
import { useLoginMutation, useRegisterMutation } from '../component/authApi';
import CreateAgentModal from '../component/CreateAgentModel';


// Separate component for individual agent item
const AgentItem = ({ item, onEditAgent }) => {
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [editAgent, setEditAgent] = useState(false);

  const handleEditAgent = () => {
      setEditAgent(true);
      setShowCreateAgentModal(true);
  };

  const updateAgent = (agentData, agentId) => {
      // Implement update logic
      setShowCreateAgentModal(false);
  };
  console.log(item);
  return (
      <TouchableOpacity onPress={handleEditAgent}>
          <View style={styles.cardContainer}>
              <CreateAgentModal 
                  openModal={showCreateAgentModal} 
                  onClose={() => setShowCreateAgentModal(false)}
                  agentId={item}
                  onSaveAgent={(agentData, agentId) => updateAgent(agentData, agentId)}
                  createMode={false}
              />
          </View>
      </TouchableOpacity>
  );
};

const Agents = ({navigation}) => {
  const [data, setData] = useState([
      {"agentId":1},
      {"agentId":2},
      {"agentId":3}
  ]);

  const [loginMutation] = useLoginMutation();

  const renderAgentItem = ({ item }) => (
      <AgentItem 
          item={item} 
      />
  );
 
  return (
      <View style={[styles.container, {padding: 0}]}>
          <FlatList
              data={data}
              renderItem={renderAgentItem}
              keyExtractor={(item) => item.agentId.toString()}
              contentContainerStyle={styles.listContainer}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListHeaderComponent={<View style={styles.headerSpace} />}
              ListFooterComponent={<View style={styles.footerSpace} />}
          />           
      </View>
  );
};

export default Agents;


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
    }
});