import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    FlatList, 
    Dimensions, 
    Modal 
} from 'react-native';
import { useGetCampaignListQuery, useGetCampaignRunLogsQuery,useGetCallLogsQuery } from '../component/authApi';
import { selectUser } from '../component/authSlice';
import { useSelector } from 'react-redux';

// Get device height for better layout calculations
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CampaignLogItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress}>
            <View style={styles.cardContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                    <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                        Campaign ID: 
                    </Text>
                    <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                        {item.campaignId}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                    <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                        Name: 
                    </Text>
                    <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                        {item.campaignName}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const CampaignLogs = ({ navigation }) => {
    const user = useSelector(selectUser);
    const { 
        data, 
        error, 
        isSuccess, 
        isLoading, 
        isError 
    } = useGetCampaignListQuery(user?.id);

    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [page, setPage] = useState(0);
    const [callLogsModalVisible, setCallLogsModalVisible] = useState(false);
    const [selectedRunLog, setSelectedRunLog] = useState(null);
    const [callLogsPage, setCallLogsPage] = useState(0);
    const [runLogContent, setRunLogContent] = useState([]);

    const { 
        data: runLogs, 
        isLoading: isRunLogsLoading, 
        isError: isRunLogsError 
    } = useGetCampaignRunLogsQuery({ campaignId: selectedCampaign?.campaignId,businessId:user?.id,page: page }, { skip: !selectedCampaign });

    const { 
        data: callLogsData, 
        isLoading: isCallLogsLoading, 
        isError: isCallLogsError 
    } = useGetCallLogsQuery(
        { campaignRunId: selectedRunLog?.campaignRunId, page: callLogsPage }, 
        { skip: !selectedRunLog }
    );

    React.useEffect(() => {
        if (runLogs?.content) {
            setRunLogContent(prev => {
                if (page === 0) return runLogs.content;
                return [...prev, ...runLogs.content];
            });
        }
    }, [runLogs?.content]);

    const renderLogItem = ({ item }) => (
        <CampaignLogItem 
            item={item} 
            onPress={() => {
                setSelectedCampaign(item);
                setModalVisible(true);
            }} 
        />
    );

    const renderRunLogItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.cardContainer} 
            onPress={() => {
                setSelectedRunLog(item);
                setCallLogsModalVisible(true);
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Campaign Run ID: 
                </Text>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    {item.campaignRunId}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Language: 
                </Text>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    {item.language}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Status: 
                </Text>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    {item.status}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Call SID: 
                </Text>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    {item.callSId || 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const loadMoreLogs = () => {
        console.log("Loading more logs, current page:", page);
        if (!runLogs?.last) {
            setPage((prevPage) => {
                const nextPage = prevPage + 1;
                console.log("Loading next page:", nextPage);
                return nextPage;
            });
        }
    };

    const loadMoreCallLogs = () => {
        if (!callLogsData?.last) {
            setCallLogsPage((prevPage) => prevPage + 1);
        }
    };

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
                        No campaign logs available
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={renderLogItem}
                keyExtractor={(item) => item.campaignId.toString()}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={<View style={styles.headerSpace} />}
                onEndReached={({ distanceFromEnd }) => {
                    if (distanceFromEnd < 0) return;
                    if (!isLoading && !data?.last) {
                        loadMoreLogs();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoading ? (
                        <ActivityIndicator size="small" color="#0000ff" />
                    ) : null
                }
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                bounces={true}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                {renderContent()}
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setModalVisible(false);
                    setSelectedCampaign(null);
                    setPage(0);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Campaign ID: {selectedCampaign?.campaignId}
                        </Text>
                        {isRunLogsLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : isRunLogsError ? (
                            <Text style={styles.errorText}>Failed to load logs</Text>
                        ) : (
                            <FlatList
                                data={runLogContent}
                                renderItem={renderRunLogItem}
                                keyExtractor={(item) => item.campaignRunId.toString()}
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) return;
                                    if (!isRunLogsLoading && !runLogs?.last) {
                                        loadMoreLogs();
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListFooterComponent={
                                    isRunLogsLoading ? (
                                        <ActivityIndicator size="small" color="#0000ff" />
                                    ) : null
                                }
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setModalVisible(false);
                                setSelectedCampaign(null);
                                setPage(0);
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={callLogsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setCallLogsModalVisible(false);
                    setSelectedRunLog(null);
                    setCallLogsPage(0);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Call Logs for Run ID: {selectedRunLog?.campaignRunId}
                        </Text>
                        {isCallLogsLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : isCallLogsError ? (
                            <Text style={styles.errorText}>Failed to load call logs</Text>
                        ) : (
                            <FlatList
                                data={callLogsData?.content || []}
                                renderItem={({ item }) => (
                                    <View style={styles.cardContainer}>
                                        <Text style={styles.label}>Call ID: {item.callId}</Text>
                                        <Text style={styles.label}>Duration: {item.duration}</Text>
                                        <Text style={styles.label}>Status: {item.status}</Text>
                                    </View>
                                )}
                                keyExtractor={(item) => item.callId.toString()}
                                onEndReached={loadMoreCallLogs}
                                onEndReachedThreshold={0.5}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListFooterComponent={
                                    callLogsData?.hasNextPage ? (
                                        isCallLogsLoading && <ActivityIndicator size="small" color="#0000ff" />
                                    ) : null
                                }
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setCallLogsModalVisible(false);
                                setSelectedRunLog(null);
                                setCallLogsPage(0);
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d3d3d3',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 10,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 20,
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
        flexDirection: 'row',
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#d3d3d3',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#0000ff',
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        marginTop: '15%',
        width: '40%',
        height: SCREEN_HEIGHT * 0.5,
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
        backgroundColor: '#d3d3d3',
    },
    errorText: {
        margin: '10%',
        fontFamily: 'bold',
        fontWeight: 'bold',
        fontSize: 24,
    },
    emptyText: {
        margin: '10%',
        fontFamily: 'bold',
        fontWeight: 'bold',
        fontSize: 24,
    },
    label: {
        marginHorizontal: 5,
    },
});

export default CampaignLogs;


