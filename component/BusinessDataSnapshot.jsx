import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectUser, selectOnboardingData } from './authSlice';
import { useGetBusinessDataQuery } from './authApi';

import PhoneModal from './PhoneModal';
import LlmModal from './LlmModal';

const BusinessDataSnapShot = ({ navigation }) => {
  const [PhoneDataModal, setPhoneDataModal] = useState(false);
  const [llmDataModel, setLlmDataModal] = useState(false);
  const user = useSelector(selectUser);
  const onBoardingData = useSelector(selectOnboardingData);
  const { data: businessData, isLoading } = useGetBusinessDataQuery(user?.id);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 600;

  useEffect(() => {
    console.log("DHANYAAAAAA");
    console.log(onBoardingData);
  }, [onBoardingData]);

  const openPhoneModal = () => {
    setLlmDataModal(false);
    setPhoneDataModal(true);
  };
  const openLlmModal = () => {
    setPhoneDataModal(false);
    setLlmDataModal(true);
  };

  return (
    <View
      style={[
        styles.outerContainer,
        {
          padding: isSmallScreen ? 10 : 24,
          minHeight: isSmallScreen ? screenHeight * 0.7 : 400,
        },
      ]}
    >
      <View style={styles.card}>
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
        <View style={styles.buttonSection}>
          <PhoneModal onClose={setPhoneDataModal} openModal={PhoneDataModal} />
          <LlmModal onClose={setLlmDataModal} openModal={llmDataModel} />
          <TouchableOpacity
            style={styles.generateButton}
            onPress={openPhoneModal}
          >
            <Text style={styles.generateButtonText}>Configure Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={openLlmModal}
          >
            <Text style={styles.generateButtonText}>Configure LLM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default BusinessDataSnapShot;

BusinessDataSnapShot.propTypes = {};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 320,
  },
  infoSection: {
    marginBottom: 18,
  },
  businessName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  value: {
    fontSize: 15,
    color: '#666',
  },
  buttonSection: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
    marginTop: 10,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

