import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    FlatList,
    Dimensions
} from 'react-native';
import { useLoginMutation, useGetCampaignListQuery } from '../component/authApi';
import CampaignRun from '../component/CampaignRun';
import { selectUser } from '../component/authSlice';
import { useSelector } from 'react-redux';

// Get device height for better layout calculations
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CampaignItem = ({ item, onBlur }) => {
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

    useEffect(() => {
        onBlur(showCreateAgentModal);
    }, [showCreateAgentModal]);

    const handleEditAgent = () => {
        setShowCreateAgentModal(true);
        onBlur(true);
    };

    const updateAgent = (agentData, agentId) => {
        // Ensure modal state is explicitly set to false after updating
        setShowCreateAgentModal(false);
        onBlur(false); // Reset blur state
    };

    return (
        <TouchableOpacity onPress={handleEditAgent}>
            <View style={styles.cardContainer}>
                <View style={{flexDirection:'row',justifyContent:'center',marginTop:'1%'}}>
                  <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold",fontSize:16}]}>{item.campaignName} : </Text>
                  <Text style={[styles.label,{fontFamily:'bold',fontWeight: "bold",fontSize:16}]}>{item.campaignAim}</Text> 
                </View>
               
                <CampaignRun 
                    onClose={() => {
                        setShowCreateAgentModal(false); // Ensure modal closes properly
                        onBlur(false); // Reset blur state
                    }} 
                    openModal={showCreateAgentModal} 
                    campaignData={item} 
                />
            </View>
        </TouchableOpacity>
    );
};

const Campaigns = ({ navigation }) => {
    const user = useSelector(selectUser);
    const { 
        data, 
        error, 
        isSuccess, 
        isLoading, 
        isError 
    } = useGetCampaignListQuery(user?.id);
    const [blur, setBlur] = useState(false);

    const renderAgentItem = ({ item }) => (
        
        <CampaignItem 
            item={item} 
            onBlur={setBlur}
        />
    );

    const renderContent = () => {
        if (isError) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.errorText}>
                        Something went wrong
                    </Text>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            );
        }

        if (isSuccess && (!data || data.length === 0)) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No campaign Created
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={renderAgentItem}
                keyExtractor={(item) => item.campaignId.toString()}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={<View style={styles.headerSpace} />}
                ListFooterComponent={<View style={styles.footerSpace} />}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                bounces={true}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={[
                styles.listContainer,
                blur && styles.blurContainer
            ]}>
                {renderContent()}
            </View>
            
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d3d3d3',
    },
    listContainer: {
        flex: 1, // Important for scrolling
        paddingHorizontal: 10,
    },
    listContent: {
        flexGrow: 1, // Important for scrolling
        paddingBottom: 20, // Add some bottom padding for better scrolling
    },
    headerSpace: {
        height: 10,
    },
    footerSpace: {
        height: 10,
    },
    separator: {
        height: 30,
    },
    cardContainer: {
        width: '100%',
        height: 50,
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
    blurContainer: {
        opacity: 0.3,
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    emptyContainer: {
        flex: 1,
        marginTop: '15%',
        width: '40%',
        height: SCREEN_HEIGHT * 0.5, // Use screen height for better proportions
        alignSelf: 'center',
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
        elevation: 10,
    },
    loadingContainer: {
        flex: 1,
        marginTop: '15%',
        width: '40%',
        height: '50%',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#d3d3d3'
    },
    errorText: {
        margin: '10%',
        fontFamily: 'bold',
        fontWeight: 'bold',
        fontSize: 24
    },
    emptyText: {
        margin: '10%',
        fontFamily: 'bold',
        fontWeight: 'bold',
        fontSize: 24
    }
});

export default Campaigns;