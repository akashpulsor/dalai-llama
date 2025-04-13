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
import { MaterialIcons } from '@expo/vector-icons'; // Add this import
import { useGetCampaignListQuery, useGetCampaignRunLogsQuery, useGetCallLogsQuery, useLazyGetCallLogByCallIdQuery } from '../component/authApi';
import { selectUser } from '../component/authSlice';
import { useSelector } from 'react-redux';
import { useSubscribeCampaignRunQuery } from '../component/websocketApi'; // Add WebSocket subscription import

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
    const [selectedCallId, setSelectedCallId] = useState(null);
    const [callDetailModalVisible, setCallDetailModalVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [allRunLogContent, setAllRunLogContent] = useState({});
    const [expandedCallLogs, setExpandedCallLogs] = useState({});

    const { 
        data: runLogs, 
        isLoading: isRunLogsLoading, 
        isError: isRunLogsError 
    } = useGetCampaignRunLogsQuery({ campaignId: selectedCampaign?.campaignId,businessId:user?.id,page: currentPage }, { skip: !selectedCampaign });

    const { 
        data: callLogsData, 
        isLoading: isCallLogsLoading, 
        isError: isCallLogsError 
    } = useGetCallLogsQuery(
        { campaignRunId: selectedRunLog?.campaignRunId, page: callLogsPage }, 
        { skip: !selectedRunLog }
    );

    const [getCallLogById, { 
        data: callLogDetail, 
        isLoading: isCallLogDetailLoading,
        isError: isCallLogDetailError,
        error: callLogDetailError 
    }] = useLazyGetCallLogByCallIdQuery({
        fixedCacheKey: `call-log-details-${selectedCampaign?.campaignId}`,
    });

    // Add WebSocket subscription for campaign runs
    const { data: wsData } = useSubscribeCampaignRunQuery(
        { 
            businessId: user?.id, 
            campaignId: selectedCampaign?.campaignId 
        },
        { skip: !selectedCampaign }
    );

    React.useEffect(() => {
        if (runLogs?.content) {
            const sortedContent = [...runLogs.content].sort((a, b) => b.campaignRunId - a.campaignRunId);
            setAllRunLogContent(prev => ({
                ...prev,
                [currentPage]: sortedContent
            }));
        }

        // Handle WebSocket updates with the new response structure
        if (wsData) {
            const newRunLog = {
                campaignRunId: wsData.campaignRunId,
                businessId: wsData.businessId,
                campaignId: wsData.campaignId,
                all: wsData.all,
                agentId: wsData.agentId,
                language: wsData.language,
                status: wsData.status,
                llmId: wsData.llmId,
                phoneId: wsData.phoneId,
                callSId: wsData.callSId,
                createdAt: wsData.createdAt,
                updatedAt: wsData.updatedAt
            };

            setAllRunLogContent(prev => {
                const firstPageContent = prev[0] || [];
                // Add new log at the beginning of the first page
                const updatedFirstPage = [newRunLog, ...firstPageContent];
                return {
                    ...prev,
                    0: updatedFirstPage
                };
            });
        }
    }, [runLogs?.content, currentPage, wsData]);

    const getAllContent = () => {
        const pages = Object.keys(allRunLogContent).sort((a, b) => Number(a) - Number(b));
        const allContent = pages.reduce((acc, pageNum) => {
            return [...acc, ...allRunLogContent[pageNum]];
        }, []);
        
        // Sort by campaignRunId in descending order
        return allContent.sort((a, b) => b.campaignRunId - a.campaignRunId);
    };

    const handleScroll = ({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        
        if (isEndReached && !isRunLogsLoading && !runLogs?.last) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

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
                    Run ID: {item.campaignRunId}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Language: {item.language}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Status: {item.status}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: '1%' }}>
                <Text style={[styles.label, { fontFamily: 'bold', fontWeight: "bold", fontSize: 16 }]}>
                    Created: {new Date(item.createdAt).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const toggleCallLogExpansion = async (callLogId) => {
        try {
            // Check if we already have the data
            if (!expandedCallLogs[callLogId]) {
                const response = await getCallLogById(callLogId);
                if (response?.data) {
                    setExpandedCallLogs(prev => ({
                        ...prev,
                        [callLogId]: response.data
                    }));
                }
            } else {
                // Toggle visibility if we already have data
                setExpandedCallLogs(prev => ({
                    ...prev,
                    [callLogId]: null
                }));
            }
        } catch (error) {
            console.error('Error fetching call log:', error);
        }
    };

    const renderCallLogItem = ({ item }) => {
        const isExpanded = !!expandedCallLogs[item?.callLogId];
        const usageData = expandedCallLogs[item?.callLogId];

        return (
            <View style={[styles.cardContainer, { 
                minHeight: 60,
                height: 'auto',
                paddingVertical: 10,
                flexDirection: 'column',
            }]}>
                <TouchableOpacity 
                    style={styles.callLogHeader}
                    onPress={() => toggleCallLogExpansion(item?.callLogId)}
                >
                    <View style={styles.callLogBasicInfo}>
                        <View style={styles.callLogHeaderRow}>
                            <Text style={styles.callLogText}>Call ID: {item?.callLogId || 'N/A'}</Text>
                            <MaterialIcons 
                                name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                                size={24} 
                                color="#333"
                                style={styles.expandIcon}
                            />
                        </View>
                        <Text style={styles.callLogText}>From: {item?.fromNumber || 'N/A'}</Text>
                        <Text style={styles.callLogText}>
                            Duration: {usageData ? `${usageData.totalCallTime}s` : 'Loading...'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {isExpanded && usageData && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.sectionTitle}>Status History:</Text>
                        {item?.statusHistory?.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                            .map((status, index) => (
                                <Text key={`${item.callLogId}-status-${index}-${status.timestamp}`} 
                                    style={styles.statusText}>
                                    {new Date(status.timestamp).toLocaleString()} - {status.status}
                                </Text>
                            ))
                        }
                        <Text style={styles.sectionTitle}>Usage Details:</Text>
                        <View style={styles.usageGrid}>
                            <View style={styles.usageRow}>
                                <Text style={styles.usageLabel}>Total Charges:</Text>
                                <Text style={styles.usageValue}>${usageData.totalCharges?.toFixed(2) || '0.00'}</Text>
                            </View>
                            <View style={styles.usageRow}>
                                <Text style={styles.usageLabel}>Service Charges:</Text>
                                <Text style={styles.usageValue}>${usageData.totalServiceCharges?.toFixed(2) || '0.00'}</Text>
                            </View>
                            <View style={styles.usageRow}>
                                <Text style={styles.usageLabel}>Model Charges:</Text>
                                <Text style={styles.usageValue}>${usageData.totalModelCharges?.toFixed(2) || '0.00'}</Text>
                            </View>
                            <View style={styles.usageRow}>
                                <Text style={styles.usageLabel}>Total Tokens:</Text>
                                <Text style={styles.usageValue}>{usageData.totalToken || 0}</Text>
                            </View>
                            <View style={styles.usageRow}>
                                <Text style={styles.usageLabel}>Input/Output:</Text>
                                <Text style={styles.usageValue}>
                                    {usageData.totalInputToken || 0} / {usageData.totalOutputToken || 0}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const processCallLogs = (logs) => {
        if (!logs) return [];
        
        // Create a Map to store unique entries using callLogId as key
        const uniqueLogs = new Map();
        
        logs.forEach(log => {
            uniqueLogs.set(log.callLogId, log);
        });
        
        // Convert back to array and sort by timestamp in descending order
        return Array.from(uniqueLogs.values())
            .sort((a, b) => {
                const timeA = a.statusHistory?.[0]?.timestamp || 0;
                const timeB = b.statusHistory?.[0]?.timestamp || 0;
                return new Date(timeB) - new Date(timeA);
            });
    };

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
                keyExtractor={(item, index) => `campaign-${item.campaignId}-${index}`}
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
                    setCurrentPage(0);
                    setAllRunLogContent({});
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
                                data={getAllContent()}
                                renderItem={renderRunLogItem}
                                keyExtractor={(item, index) => `run-${item.campaignRunId}-${index}`}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListFooterComponent={
                                    isRunLogsLoading ? (
                                        <ActivityIndicator size="small" color="#0000ff" />
                                    ) : null
                                }
                                onEndReachedThreshold={0.2}
                                maintainVisibleContentPosition={{
                                    minIndexForVisible: 0,
                                    autoscrollToTopThreshold: 10,
                                }}
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setModalVisible(false);
                                setSelectedCampaign(null);
                                setCurrentPage(0);
                                setAllRunLogContent({});
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
                    <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.8 }]}>
                        <Text style={styles.modalTitle}>
                            Call Logs for Run ID: {selectedRunLog?.campaignRunId}
                        </Text>
                        {isCallLogsLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : isCallLogsError ? (
                            <Text style={styles.errorText}>Failed to load call logs</Text>
                        ) : !callLogsData?.content?.length ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No call logs found</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={processCallLogs(callLogsData?.content)}
                                renderItem={renderCallLogItem}
                                keyExtractor={(item) => `call-${item.callLogId}`}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                contentContainerStyle={styles.callLogsContent}
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

            <Modal
                visible={callDetailModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setCallDetailModalVisible(false);
                    setSelectedCallId(null);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Call Details</Text>
                        {isCallLogDetailLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : isCallLogDetailError ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.errorText}>
                                    {callLogDetailError?.data?.message || 'Failed to load call Usage data'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.detailContainer}>
                                <Text style={styles.detailText}>Call ID: {callLogDetail?.callId}</Text>
                                <Text style={styles.detailText}>Duration: {callLogDetail?.duration || '0'} seconds</Text>
                                <Text style={styles.detailText}>Status: {callLogDetail?.status}</Text>
                                <Text style={styles.detailText}>Start Time: {callLogDetail?.startTime}</Text>
                                <Text style={styles.detailText}>End Time: {callLogDetail?.endTime}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setCallDetailModalVisible(false);
                                setSelectedCallId(null);
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        margin: 10,
        minHeight: 100,
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
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    label: {
        marginHorizontal: 5,
    },
    detailContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    detailText: {
        fontSize: 16,
        marginVertical: 5,
        color: '#333',
    },
    callLogContent: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-around',
    },
    callLogText: {
        fontSize: 14,
        color: '#333',
        marginVertical: 2,
    },
    statusText: {
        marginLeft: 20,
        fontSize: 13,
        color: '#666',
    },
    usageDataContainer: {
        marginTop: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
    },
    callLogHeader: {
        flexDirection: 'column',
        width: '100%',
    },
    callLogHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 10,
    },
    callLogBasicInfo: {
        padding: 10,
        flexDirection:'column'
    },
    expandIcon: {
        position: 'absolute',
        right: 0,
        top: '50%',
        marginTop: -12,
    },
    expandedContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 10,
    },
    callLogsContent: {
        flexGrow: 1,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    usageGrid: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
        marginTop: 5,
    },
    usageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    usageLabel: {
        fontSize: 14,
        color: '#333',
    },
    usageValue: {
        fontSize: 14,
        color: '#333',
    },
});

export default CampaignLogs;


