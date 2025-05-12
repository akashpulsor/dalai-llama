import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { selectUser, selectOnboardingData } from './authSlice';
import { useGetBusinessDataQuery, useLazyGetDashboardDataQuery } from './authApi';
import PhoneModal from './PhoneModal';
import LlmModal from './LlmModal';

const BusinessDashboard = ({ navigation }) => {
  const [PhoneDataModal, setPhoneDataModal] = useState(false);
  const [llmDataModel, setLlmDataModal] = useState(false);
  const user = useSelector(selectUser);
  const onBoardingData = useSelector(selectOnboardingData);
  const { data: businessData, isLoading: isBusinessLoading } = useGetBusinessDataQuery(user?.id);

  const [dashboardData, setDashboardData] = useState(null);
  const [trigger, { data: fetchedDashboard, isLoading: isDashboardLoading, isError, error }] = useLazyGetDashboardDataQuery();
  const [selectedDuration, setSelectedDuration] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 600;

  const fetchDashboard = (bizId) => {
    if (!bizId) return;
    let queryParams = `businessId=${bizId}`;
    if (startDate) queryParams += `&startDate=${moment(startDate).format('YYYY-MM-DD')}`;
    if (endDate) queryParams += `&endDate=${moment(endDate).format('YYYY-MM-DD')}`;
    trigger(queryParams);
  };

  useEffect(() => {
    if (businessData?.id) fetchDashboard(businessData.id);
    const intervalId = setInterval(() => {
      if (businessData?.id) fetchDashboard(businessData.id);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [businessData?.id, startDate, endDate]);

  useEffect(() => {
    if (fetchedDashboard) setDashboardData(fetchedDashboard);
  }, [fetchedDashboard]);

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
        setEndDate(null);
        break;
      default:
        break;
    }
  };

  const openPhoneModal = () => {
    setLlmDataModal(false);
    setPhoneDataModal(true);
  };
  const openLlmModal = () => {
    setPhoneDataModal(false);
    setLlmDataModal(true);
  };

  const tileWidth = isSmallScreen ? '98%' : '48%';
  const tileHeight = isSmallScreen ? undefined : 180;

  if (isBusinessLoading || isDashboardLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
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

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={[
          styles.outerContainer,
          {
            padding: isSmallScreen ? 10 : 24,
            minHeight: isSmallScreen ? screenHeight * 0.7 : 400,
          },
        ]}
      >
        <View style={[styles.pickerContainer, { width: isSmallScreen ? '98%' : 300, alignSelf: 'flex-end', marginBottom: 12 }]}>
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
        <View style={[
          styles.gridContainer,
          { flexDirection: isSmallScreen ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'space-between' }
        ]}>
          <View style={[
            styles.tile,
            {
              width: tileWidth,
              height: tileHeight,
              minHeight: 180,
              alignSelf: 'flex-start',
              marginBottom: isSmallScreen ? 16 : 24,
              flexDirection: isSmallScreen ? 'column' : 'row',
              alignItems: isSmallScreen ? 'flex-start' : 'stretch',
              position: 'relative',
            }
          ]}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={styles.infoSection}>
                <Text style={styles.businessName}>
                  {businessData?.businessName || 'Business Name'}
                </Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email: </Text>
                  <Text style={styles.value}>{businessData?.email || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Inbound: </Text>
                  <Text style={styles.value}>{businessData?.inbound || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Outbound: </Text>
                  <Text style={styles.value}>{businessData?.outbound || '-'}</Text>
                </View>
              </View>
            </View>
            {isSmallScreen ? (
              <View style={[styles.buttonSection, { marginTop: 10, width: '100%' }]}>
                <PhoneModal onClose={setPhoneDataModal} openModal={PhoneDataModal} />
                <LlmModal onClose={setLlmDataModal} openModal={llmDataModel} />
                <TouchableOpacity
                  style={[styles.generateButton, { width: '100%', alignSelf: 'center', marginBottom: 8 }]}
                  onPress={openPhoneModal}
                >
                  <Text style={styles.generateButtonText}>Configure Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.generateButton, { width: '100%', alignSelf: 'center' }]}
                  onPress={openLlmModal}
                >
                  <Text style={styles.generateButtonText}>Configure LLM</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonSectionWeb}>
                <PhoneModal onClose={setPhoneDataModal} openModal={PhoneDataModal} />
                <LlmModal onClose={setLlmDataModal} openModal={llmDataModel} />
                <TouchableOpacity
                  style={[styles.generateButton, { minWidth: 140, marginBottom: 12 }]}
                  onPress={openPhoneModal}
                >
                  <Text style={styles.generateButtonText}>Configure Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.generateButton, { minWidth: 140 }]}
                  onPress={openLlmModal}
                >
                  <Text style={styles.generateButtonText}>Configure LLM</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={[styles.tile, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>
            <Text style={styles.cardValue}>{dashboardData?.totalCall || 0}</Text>
            <Text style={styles.cardLabel}>Total Calls</Text>
          </View>
          <View style={[styles.tile, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>
            <Text style={styles.cardValue}>${dashboardData?.totalCharges?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.cardLabel}>Total Cost</Text>
          </View>
          <View style={[styles.tile, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>
            <Text style={styles.cardValue}>{dashboardData?.totalToken || 0}</Text>
            <Text style={styles.cardLabel}>Total Tokens</Text>
          </View>
          <View style={[styles.tile, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>
            <Text style={styles.cardValue}>{dashboardData?.totalLeads || 0}</Text>
            <Text style={styles.cardLabel}>Total Leads</Text>
          </View>
          <View style={[styles.tile, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>
            <Text style={styles.cardValue}>{dashboardData?.totalCampaigns || 0}</Text>
            <Text style={styles.cardLabel}>Total Campaigns</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default BusinessDashboard;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#d3d3d3',
    width: '100%',
  },
  gridContainer: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  tile: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    marginRight: 0,
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'space-between',
  },
  infoSection: {
    marginBottom: 10,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  buttonSection: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'stretch',
    marginTop: 6,
  },
  buttonSectionWeb: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 16,
    marginRight: 0,
    gap: 8,
    alignSelf: 'stretch',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  pickerContainer: {
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: 8,
    alignSelf: 'flex-end',
  },
  picker: {
    height: 40,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
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
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
