import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator ,TouchableOpacity } from 'react-native';
import {  useGetAgentListQuery } from '../component/authApi';
import {selectUser} from '../component/authSlice';
import { useSelector } from 'react-redux';
import AgentForm from '../component/AgentForm';

// Separate component for individual agent item
const AgentItem = ({ item }) => {
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [editAgent, setEditAgent] = useState(false);
  const user =  useSelector(selectUser);

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
              <View style={{flexDirection:'row',justifyContent:'center',marginTop:'1%'}}>
                  <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold",fontSize:16}]}>{item.role} : </Text>
                  <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold",fontSize:16}]}>{item.agentName}</Text> 
              </View>
              <AgentForm openModal={showCreateAgentModal} 
                  onClose={() => setShowCreateAgentModal(false)} item={item}/>
          </View>
      </TouchableOpacity>
  );
};

const Agents = ({navigation}) => {
  const user =  useSelector(selectUser);
  const { data: data, error,isSuccess,isLoading, isError } = useGetAgentListQuery(user?.id);

  useEffect(() => {
 
  }, [user, data]);

  const renderAgentItem = ({ item }) => (
      <AgentItem 
          item={item} 
      />
  );
 
  return (
      <View style={[styles.container, {padding: 0}]}>

{
                  isError &&  <View style={styles.emptyContainer}>
                      <Text style={{margin:"10%",fontFamily:'bold',fontWeight: "bold", fontSize:24}}>Some thing went wrong</Text>
                  </View>
              }
              {
                  isLoading &&  <View style={[styles.emptyContainer,{backgroundColor:'#d3d3d3'}]}>
                      <ActivityIndicator size="large" color="#0000ff" />
                  </View>
              }
              {
               

                    (isSuccess && (!data || data.length === 0)) ?
                          <View style={styles.emptyContainer}>
                              <Text style={{margin:"10%",fontFamily:'bold',fontWeight: "bold", fontSize:24}}>No Agents Created</Text>
                          </View>
                    :
                    isSuccess && <FlatList
                    data={data}
                    renderItem={renderAgentItem}
                    keyExtractor={(item) => item.agentId.toString()}
                    contentContainerStyle={styles.listContainer}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListHeaderComponent={<View style={styles.headerSpace} />}
                    ListFooterComponent={<View style={styles.footerSpace} />}
                />

              }
                     
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
    },
    emptyContainer: {
        flex: 1,
        marginTop:'15%',
        width:'40%',
        height:'50%',
        alignSelf:'center',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10, // White background for empty state
    }
});