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
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

    const showStartDatePicker = () => {
        setStartDatePickerVisible(true);
    };

    const hideStartDatePicker = () => {
        setStartDatePickerVisible(false);
    };

    const handleStartDateConfirm = (date) => {
        setStartDate(date);
        hideStartDatePicker();
    };

    const showEndDatePicker = () => {
        setEndDatePickerVisible(true);
    };

    const hideEndDatePicker = () => {
        setEndDatePickerVisible(false);
    };

    const handleEndDateConfirm = (date) => {
        setEndDate(date);
        hideEndDatePicker();
    };

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
        return <View><Text>Loading dashboard data...</Text></View>;
    }

    if (isError) {
        return <View><Text>Error loading dashboard data: {error?.message || 'Something went wrong'}</Text></View>;
    }

    return (
        <ScrollView style={styles.tableContainer}>
            <View style={styles.contentWrapper}>
                {/* Picker */}
                <View style={styles.pickerContainer}>
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
                <View style={styles.cardsWrapper}>
                    <ScrollView contentContainerStyle={styles.cardsGrid}>
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardValue}>{data?.totalCall || 0}</Text>
                            <Text style={styles.cardLabel}>Total Calls</Text>
                        </View>
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardValue}>${data?.totalCost?.toFixed(2) || '0.00'}</Text>
                            <Text style={styles.cardLabel}>Total Cost</Text>
                        </View>
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardValue}>{data?.totalToken || 0}</Text>
                            <Text style={styles.cardLabel}>Total Tokens</Text>
                        </View>
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardValue}>{data?.totalLeads || 0}</Text>
                            <Text style={styles.cardLabel}>Total Leads</Text>
                        </View>
                        <View style={styles.cardContainer}>
                            <Text style={styles.cardValue}>{data?.totalCampaigns || 0}</Text>
                            <Text style={styles.cardLabel}>Total Campaigns</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </ScrollView>
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
        height: 300, // Fixed height to limit the scrollable area
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center', // Center the cards horizontally
        alignItems: 'center', // Center the last card vertically
    },
    cardContainer: {
        width: '45%', // Adjust width for better spacing
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
        width: '20%',
        marginTop: 15, // Reduce top margin for compactness
        paddingHorizontal: 8, // Slightly reduce horizontal padding
    },
    picker: {
        height: 45, // Slightly smaller height for compactness
        backgroundColor: 'white', // Softer background for the picker
        borderRadius: 6, // Slightly less rounded corners
        borderWidth: 1, // Add a border for better visibility
        borderColor: '#333', // Match border color with card theme
        paddingHorizontal: 8, // Add padding inside the picker
    },
});

