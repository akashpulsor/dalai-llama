import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';

import { useVerificationCodeMutation,useGenerateNumberMutation } from './authApi'; // Assuming this is your API call hook

const GenerateNumber = ({ 
    onClose, 
    openModal, 
    businessId
  }) => {

  
    const [generateNumber, { data: generatedData, isLoading:isGenerateNumberLoading, isSuccess:isGenerateNumberSuccess, isError:isGenerateNumberError, error:onBoardError }] = useGenerateNumberMutation();
  
    useEffect(() => {

      if(isGenerateNumberSuccess) {
        console.log(phoneData);
      }
    
}, [isGenerateNumberSuccess]);

    // Reset form and close modal
    const handleModalClose = () => {
      onClose(false);
    };
  

  
    // Save agent (create or update)
    const handleGenerateNumber = () => {
        generateNumber({"businessId" : businessId});
    };
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={openModal}
        onRequestClose={handleModalClose}
      >
        <View style={styles.centeredView}>
          <TouchableOpacity
            style={{ justifyContent: 'center' }}
            onPress={handleModalClose}
          >
            <MaterialIcons name="cancel" size={24} color="gray" />
          </TouchableOpacity>
          <View style={styles.modalView}>
            <Text style={{ fontSize: 34, fontFamily: 'bold' }}>
              Start Phone
            </Text>
  

              <View style={styles.buttonWrapper}>

                {isGenerateNumberLoading &&
                  <ActivityIndicator size="large" color="#0000ff" />}
              </View>
              <View style={styles.buttonWrapper}>
                <Button mode="contained" onPress={handleGenerateNumber}>
                    Start Phone
                </Button>
              </View>

          </View>
        </View>
      </Modal>
    );
  };
  
  GenerateNumber.propTypes = {
    onClose: PropTypes.func.isRequired,
    openModal: PropTypes.bool.isRequired,
    businessId: PropTypes.string,
  };
  
  export default GenerateNumber;
  
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 2.5,
    height: '40%',
    backgroundColor: '#d3d3d3',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '30%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: Platform.OS === 'ios' ? 15 : 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 8,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0', // Gray out disabled input
    color: '#b0b0b0', // Optional: change text color for disabled fields
  },
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
    zIndex: 1,
    marginTop: '45%',
    alignSelf: 'flex-end',
    alignContent: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    margin: '5%',
  },
});
