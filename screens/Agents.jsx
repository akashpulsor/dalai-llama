import React, { useState, useEffect, useRef,lazy, Suspense } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator ,TouchableOpacity } from 'react-native';
import {  useGetAgentListQuery } from '../component/authApi';
import {selectUser} from '../component/authSlice';
import { useSelector } from 'react-redux';

const CreateAgentModal = lazy(() => import('../component/CreateAgentModel'));
const AgentForm = lazy(() => import('../component/AgentForm'));

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
          <View style={{
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 18,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#7c3aed',
    flexDirection: 'row',
    justifyContent: 'space-between',
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        backgroundColor: '#ede7f6',
        borderRadius: 16,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 22, color: '#7c3aed', fontWeight: 'bold' }}>{item.role?.[0] || '?'}</Text>
      </View>
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2 }}>{item.agentName}</Text>
        <Text style={{ fontSize: 14, color: '#333', fontWeight: '600', letterSpacing: 0.2 }}>{item.role}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={handleEditAgent} style={{ backgroundColor: '#ede9fe', borderRadius: 50, padding: 8, marginLeft: 8 }}>
      <Text style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
    </TouchableOpacity>
    <AgentForm openModal={showCreateAgentModal} onClose={() => setShowCreateAgentModal(false)} item={item}/>
  </View>
      </View>
      </TouchableOpacity>
  );
};

const Agents = ({navigation}) => {
  const user =  useSelector(selectUser);
  const { data: data, error,isSuccess,isLoading, isError, refetch } = useGetAgentListQuery(user?.id);
  const [visibleAgents, setVisibleAgents] = useState(10);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

  useEffect(() => {
 
  }, [user, data]);

  const handleAgentCreated = () => {
    setShowCreateAgentModal(false);
    refetch();
  };

  const renderAgentItem = ({ item, index }) => (
    <AgentItem 
        item={item} 
    />
  );

  const handleEndReached = () => {
    if (data && visibleAgents < data.length) {
        setVisibleAgents(prev => Math.min(prev + 10, data.length));
    }
};

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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
    <View style={[
      styles.emptyContainer,
      {
        backgroundColor: '#f5f3ff',
        borderWidth: 2,
        borderColor: '#7c3aed',
        borderStyle: 'dashed',


        marginBottom: '40%', // Add bottom margin
      }
    ]}> 
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#7c3aed', marginBottom: 12, letterSpacing: 1 }}>No Agents Created</Text>
      <Text style={{ fontSize: 16, color: '#7c3aed', marginBottom: 18, textAlign: 'center', opacity: 0.7 }}>Tap the + button below to add your first agent and get started!</Text>
      <TouchableOpacity onPress={() => setShowCreateAgentModal(true)} style={{ backgroundColor: '#7c3aed', borderRadius: 50, padding: 18, marginTop: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 28 }}>+</Text>
      </TouchableOpacity>
    </View>
    <Suspense fallback={null}>
      {showCreateAgentModal && (
        <CreateAgentModal 
          openModal={showCreateAgentModal} 
          onClose={() => setShowCreateAgentModal(false)}
          onSaveAgent={handleAgentCreated}
          user={user?.id}
        />
      )}
    </Suspense>
  </View>
                    :
                    isSuccess && (
                        <FlatList
                            data={data.slice(0, visibleAgents)}
                            renderItem={renderAgentItem}
                            keyExtractor={(item) => item.agentId.toString()}
                            contentContainerStyle={styles.listContainer}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListHeaderComponent={<View style={styles.headerSpace} />}
                            ListFooterComponent={<View style={styles.footerSpace} />}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.5}
                        />
                    )

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