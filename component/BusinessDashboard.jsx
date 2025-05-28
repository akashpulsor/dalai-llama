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
      {/* Exotic Gradient Background */}
      <View style={styles.gradientBg} />
      <View
        style={[
          styles.outerContainer,
          {
            padding: isSmallScreen ? 10 : 24,
            minHeight: isSmallScreen ? screenHeight * 0.7 : 400,
          },
        ]}
      >
        {/* Business Info Card with Avatar and Glassmorphism */}
        <View style={styles.infoCardGlass}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(businessData?.businessName?.[0] || 'B').toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.businessNameBig}>{businessData?.businessName || 'Business Name'}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email: </Text>
                <Text style={styles.value}>{businessData?.email || '-'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[
          styles.gridContainer,
          { flexDirection: isSmallScreen ? 'column' : 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 18 }
        ]}>
          {/* Metric Tiles with Icons, Accent Colors, Glassmorphism, and Animation */}
          <View style={[styles.metricTile, styles.tileCalls, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>  
            <View style={styles.iconCircleCalls}><Text style={styles.metricIcon}>📞</Text></View>
            <Text style={styles.cardValue}>{dashboardData?.totalCall || 0}</Text>
            <Text style={styles.cardLabel}>Total Calls</Text>
          </View>
          <View style={[styles.metricTile, styles.tileCost, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>  
            <View style={styles.iconCircleCost}><Text style={styles.metricIcon}>💸</Text></View>
            <Text style={styles.cardValue}>${dashboardData?.totalCharges?.toFixed(4) || '0.00'}</Text>
            <Text style={styles.cardLabel}>Total Cost</Text>
          </View>
          <View style={[styles.metricTile, styles.tileTokens, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>  
            <View style={styles.iconCircleTokens}><Text style={styles.metricIcon}>🪙</Text></View>
            <Text style={styles.cardValue}>{dashboardData?.totalToken || 0}</Text>
            <Text style={styles.cardLabel}>Total Tokens</Text>
          </View>
          <View style={[styles.metricTile, styles.tileLeads, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>  
            <View style={styles.iconCircleLeads}><Text style={styles.metricIcon}>👥</Text></View>
            <Text style={styles.cardValue}>{dashboardData?.totalLeads || 0}</Text>
            <Text style={styles.cardLabel}>Total Leads</Text>
          </View>
          <View style={[styles.metricTile, styles.tileCampaigns, { width: tileWidth, height: tileHeight, minHeight: 180, marginBottom: isSmallScreen ? 16 : 24 }]}>  
            <View style={styles.iconCircleCampaigns}><Text style={styles.metricIcon}>🚀</Text></View>
            <Text style={styles.cardValue}>{dashboardData?.totalCampaigns || 0}</Text>
            <Text style={styles.cardLabel}>Total Campaigns</Text>
          </View>
        </View>
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
        <View style={styles.buttonSection}>
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
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    backgroundColor: 'transparent',
    // fallback for web: exotic gradient
    backgroundImage: 'linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%, #a7bfe8 100%)',
  },
  infoCardGlass: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 82, 255, 0.12)',
    backdropFilter: 'blur(8px)', // for web
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    letterSpacing: 1,
  },
  businessNameBig: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  // Metric Tiles
  metricTile: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 0,
    marginHorizontal: 0,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 7,
    borderWidth: 1.2,
    borderColor: 'rgba(140, 82, 255, 0.09)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.18s',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  iconCircleCalls: {
    backgroundColor: '#e1bee7',
    borderRadius: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleCost: {
    backgroundColor: '#ffe0b2',
    borderRadius: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleTokens: {
    backgroundColor: '#b2dfdb',
    borderRadius: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleLeads: {
    backgroundColor: '#c5e1a5',
    borderRadius: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleCampaigns: {
    backgroundColor: '#b3e5fc',
    borderRadius: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileCalls: {
    borderLeftWidth: 6,
    borderLeftColor: '#8e24aa',
  },
  tileCost: {
    borderLeftWidth: 6,
    borderLeftColor: '#ff9800',
  },
  tileTokens: {
    borderLeftWidth: 6,
    borderLeftColor: '#009688',
  },
  tileLeads: {
    borderLeftWidth: 6,
    borderLeftColor: '#689f38',
  },
  tileCampaigns: {
    borderLeftWidth: 6,
    borderLeftColor: '#0288d1',
  },
});
