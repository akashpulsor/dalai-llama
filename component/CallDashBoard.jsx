import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PropTypes from 'prop-types';

import moment from 'moment';  

import { useLazyGetDashboardDataQuery } from './authApi'; 

const CallDashBoard = ({ businessId }) => {
    const [data, setData] = useState(null);
    const [trigger, { data: dashboardData, isLoading, isError, error }] = useLazyGetDashboardDataQuery();
    const [selectedDuration, setSelectedDuration] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const { width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenWidth < 600;

    const fetchData = () => {
        let queryParams = `businessId=${businessId}`;
        if (startDate) {
            queryParams += `&startDate=${moment(startDate).format('YYYY-MM-DD')}`;
        }
        if (endDate) {
            queryParams += `&endDate=${moment(endDate).format('YYYY-MM-DD')}`;
        }
        trigger(queryParams);
    };

    useEffect(() => {
        console.log("TTTTTT - ", businessId);
        fetchData(); // Initial fetch on component mount

        const intervalId = setInterval(() => {
            fetchData(); // Call every 60 seconds
        }, 60000);

        return () => clearInterval(intervalId); // Clean up interval on unmount
    }, [businessId, trigger, startDate, endDate]); // Re-run effect on these dependencies

    useEffect(() => {
        if (dashboardData) {
            setData(dashboardData);
        }
    }, [dashboardData]);

    const handleDurationChange = (value) => {
        setSelectedDuration(value);
        setStartDate(null);
        setEndDate(null);
        const now = moment();
        switch (value) {
            case 'month':
                setStartDate(now.clone().subtract(1, 'month').startOf('day').toDate());
                setEndDate(now.clone().endOf('day').toDate());
                break;
            case 'six_month':
                setStartDate(now.clone().subtract(6, 'month').startOf('day').toDate());
                setEndDate(now.clone().endOf('day').toDate());
                break;
            case 'all':
                setStartDate(null);
                setEndDate(null); // Or set to a very early/far future date if needed
                break;
            default:
                // No duration selected, rely on manual date pickers or default in API
                break;
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading dashboard data...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorCard}>
                    <Text style={styles.errorMessage}>
                        {error?.message || 'Something went wrong while loading dashboard data'}
                    </Text>
                </View>
            </View>
        );
    }

    // Responsive card width
    const cardWidth = isSmallScreen ? '95%' : '45%';
    const pickerWidth = isSmallScreen ? '90%' : '20%';

    return (
        <View style={styles.tableContainer}>
            <View style={styles.contentWrapper}>
                {/* Picker */}
                <View style={[styles.pickerContainer, { width: pickerWidth }]}>
                    <Picker
                        style={styles.picker}
                        selectedValue={selectedDuration}
                        onValueChange={handleDurationChange}
                    >
                        <Picker.Item label="Duration" value="" />
                        <Picker.Item label="Past Month" value="month" />
                        <Picker.Item label="Past Six Month" value="six_month" />
                        <Picker.Item label="All Time" value="all" />
                        <Picker.Item label="Custom" value="custom" />
                    </Picker>
                </View>

                {/* Cards Grid */}
                <View style={[styles.cardsWrapper, { height: isSmallScreen ? undefined : 300 }]}>
                    <ScrollView contentContainerStyle={[
                        styles.cardsGrid,
                        { flexDirection: isSmallScreen ? 'column' : 'row' }
                    ]}>
                        <View style={[styles.cardContainer, { width: cardWidth }]}>
                            <Text style={styles.cardValue}>{data?.totalCall || 0}</Text>
                            <Text style={styles.cardLabel}>Total Calls</Text>
                        </View>
                        <View style={[styles.cardContainer, { width: cardWidth }]}>
                            <Text style={styles.cardValue}>${data?.totalCharges?.toFixed(2) || '0.00'}</Text>
                            <Text style={styles.cardLabel}>Total Cost</Text>
                        </View>
                        <View style={[styles.cardContainer, { width: cardWidth }]}>
                            <Text style={styles.cardValue}>{data?.totalToken || 0}</Text>
                            <Text style={styles.cardLabel}>Total Tokens</Text>
                        </View>
                        <View style={[styles.cardContainer, { width: cardWidth }]}>
                            <Text style={styles.cardValue}>{data?.totalLeads || 0}</Text>
                            <Text style={styles.cardLabel}>Total Leads</Text>
                        </View>
                        <View style={[styles.cardContainer, { width: cardWidth }]}>
                            <Text style={styles.cardValue}>{data?.totalCampaigns || 0}</Text>
                            <Text style={styles.cardLabel}>Total Campaigns</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );

}

export default CallDashBoard;

CallDashBoard.propTypes = {
    businessId : PropTypes.number.isRequired
};

const styles = StyleSheet.create({
    tableContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#d3d3d3', // Add a white background for better contrast
    },
    contentWrapper: {
        flex: 1,
        padding: 10, // Slightly reduce padding for compactness
    },
    cardsWrapper: {
        // height set dynamically
    },
    cardsGrid: {
        flexWrap: 'wrap',
        justifyContent: 'center', // Center the cards horizontally
        alignItems: 'center', // Center the last card vertically
    },
    cardContainer: {
        aspectRatio: 1.5,
        backgroundColor: 'white',
        borderRadius: 8,
        margin: 8, // Adjust margin for spacing
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 20, // Smaller font size for the label
        fontWeight: '500',
        color: '#333', // Use a color that matches the card background
        marginBottom: 4, // Adjust spacing
        textAlign: 'center',
    },
    cardValue: {
        fontSize: 40, // Larger font size for the value
        fontWeight: 'bold',
        color: '#333', // Darker shade for better contrast
        textAlign: 'center',
    },
    pickerContainer: {
        marginTop: 15, // Reduce top margin for compactness
        paddingHorizontal: 8, // Slightly reduce horizontal padding
        alignSelf: 'center',
    },
    picker: {
        height: 45, // Slightly smaller height for compactness
        backgroundColor: 'white', // Softer background for the picker
        borderRadius: 6, // Slightly less rounded corners
        borderWidth: 1, // Add a border for better visibility
        borderColor: '#333', // Match border color with card theme
        paddingHorizontal: 8, // Add padding inside the picker
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: '90%',
        maxWidth: 400,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ff0000',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

