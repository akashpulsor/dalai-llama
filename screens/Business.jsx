import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  Text
} from 'react-native';
import BusinessForm from '../component/BusinessForm';
import GenerateNumber from '../component/GenerateNumber';
import { useSelector } from 'react-redux';
import {useOnBoardMutation, useGetOnBoardingDataQuery} from '../component/authApi';
import {selectUser,selectOnboardingData,selectBusinessData } from '../component/authSlice';
const Business = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [onBoard, { data: onBoardData, isLoading:isOnBoardLoading, isSuccess:isOnBoardSuccess, isError:isOnBoardError, error:onBoardError }] = useOnBoardMutation();
  const user =  useSelector(selectUser);
  const businessData =  useSelector(selectBusinessData);
  const [showGenerateNumber, setShowGenerateNumber] = useState(false);
  const { data: onBoardingData, error,isLoading, isError } = useGetOnBoardingDataQuery(user?.id);
  const [formData, setFormData] = useState({
    parentBusinessId:'',
    businessDetails: {
      udyamRegistrationNumber: '',
      pan: '',
      adhaarNumber: '',
      gstNumber: '',
      phone: '',
      countryCode: 'US'
    },
    address: {
      country: {
        name: '',
        isoCode: '',
        flag: '',
        phonecode: '',
        currency: '',
        latitude: '',
        longitude: '',
        timezones: [
            {
                zoneName: '',
                gmtOffset: 0,
                gmtOffsetName: '',
                abbreviation: '',
                tzName: ''
            }
        ]
      },
      state: {
        name: '',
        isoCode: '',
        countryCode: '',
        latitude: '',
        longitude: ''
      },
      city: {
        name: '',
        countryCode: '',
        stateCode: '',
        latitude: '',
        longitude: ''
      },
      streetAddress: '',
      apartment: '',
      postalCode: '',
      formattedAddress: ''
    },
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    },
    documents: {
      pan: null,
      adhaar: null,
      udyam_certificate: null,
    },
    phoneData:{
      phoneGenerated:false
    }
  });

  // Load initial data
  useEffect(() => {
        setFormData(onBoardingData);
        if(isOnBoardSuccess) {
          setIsEditing(false);
        }
      
  }, [businessData,user,onBoardingData,isOnBoardSuccess, isOnBoardLoading, isOnBoardError, onBoardError]);

  const validateForm = useCallback((data) => {
    const errors = [];

    // Business Details Validation
    if (!data.businessDetails.pan) {
      errors.push('PAN is required');
    }
    if (!data.businessDetails.phone) {
      errors.push('Phone number is required');
    }

    // Address Validation
    const address = data.address;
    if (!address.country) {
      errors.push('Country is required');
    }
    if (!address.streetAddress) {
      errors.push('Street address is required');
    }
    if (!address.postalCode) {
      errors.push('Postal code is required');
    }

    if (errors.length > 0) {

      return false;
    }

    return true;
  }, []);

  const handleFormUpdate = useCallback((updatedData) => {
    setFormData(prevData => ({
      ...prevData,
      ...updatedData
    }));
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSubmit = async () => {
      if (!validateForm(formData)) {
        return;
      }
      onBoard(formData);
  };

  const handleCancel = useCallback(() => {
    // Reset to original data
    if (originalFormData) {
      setFormData(originalFormData);
    }
    setIsEditing(false);
  }, [originalFormData]);



  const handleModalClose = () => {
    setShowGenerateNumber(false);
  }
  if (!formData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <View style={{
              borderRadius: 8,
              overflow: 'hidden'  // This is important to make border radius visible
            }}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                color="#666"
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Submit"
                onPress={handleSubmit}
                color="#007AFF"
              />
            </View>
          ) : (
            <View style={{
              borderRadius: 8,
              overflow: 'hidden'  // This is important to make border radius visible
            }}>
                <Button
                  title="Edit"
                  onPress={handleEdit}
                  color="#007AFF"
                />
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>

              <GenerateNumber onClose={()=>setShowGenerateNumber(false)} openModal={showGenerateNumber} businessId={businessData.parentBusinessId}/>

              <Button
                title="Generate Number"
                onPress={()=>setShowGenerateNumber(true)}
                color="#007AFF"
              />

        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <BusinessForm 
          enabled={isEditing}
          formData={formData}
          onUpdateForm={handleFormUpdate}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#d3d3d3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
   
  },
  buttonSpacer: {
    width: 10,
    margin:'1%'
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Business;