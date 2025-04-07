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

} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAddCampaignMutation } from './authApi';
import { useSelector } from 'react-redux';
import {selectUser } from '../component/authSlice';
import { showMessage } from './flashMessageSlice';
import { useDispatch } from 'react-redux';

const CreateCampaignModal = ({ onClose, openModal }) => {
  const user =  useSelector(selectUser);
  const [addCampaign, { data: campaignData, isLoading:isCampaignDataLoading, isSuccess:isCampaignDataSuccess, isError:isCampaignDataError, error:campaignDataError }] = useAddCampaignMutation();
  const [errorMessages, setErrorMessages] = useState({});
  const [formData, setFormData] = useState({
    businessId:'',
    campaignImgUrl:'',
    campaignName: '',
    campaignAim: '',
    conversationGuideLines:'',
    campaignDesc: '',
    firstMessage: '',
    handlingFaq:'',
    placingOrder:'',
    language: '',
    duration: 2
  });
  const dispatch = useDispatch();

  useEffect(() => {
    if(isCampaignDataSuccess){
      setFormData(campaignData);
      dispatch(showMessage({
        message: 'Campaign created successfully',
        type: 'info'
      }));
      setFormData({
        businessId:'',
        campaignImgUrl:'',
        campaignName: '',
        campaignAim: '',
        conversationGuideLines:'',
        campaignDesc: '',
        firstMessage: '',
        handlingFaq:'',
        placingOrder:'',
        language: '',
        duration: 2
      });
      onClose(false);
    }

  }, [isCampaignDataSuccess]);

  const onCreateCampaignPress = async () => {
    try{

      const newFormData = { 
        ...formData, 
        businessId: user?.id
      };
      if (!newFormData.businessId) {
        dispatch(showMessage({
          message: 'Business Id not present',
          type: 'error'
        }));
        return; // Early return since businessId is critical
      }
      const errors = {};
      if (!newFormData.campaignName) {
        errors.campaignName = 'Campaign name is required';
      }
      if (!newFormData.campaignAim) {
        errors.campaignAim = 'Campaign Objective is required';
      }
      if (!newFormData.conversationGuideLines) {
        errors.conversationGuideLines = 'Conversation Guidelines is required';
      }
      if (!newFormData.campaignDesc) {
        errors.campaignDesc = 'Campaign Description is required';
      }
      if (!newFormData.firstMessage) {
        errors.firstMessage = 'First Message is required';
      }
      if (!newFormData.language) {
        errors.language = 'Language is required';
      }
  
      if (!newFormData.duration) {
        errors.duration = 'Duration is required and should be between 2 and 5';
      }
  
      setErrorMessages(errors);
      console.log(formData);
      console.log(user);
      if (Object.keys(errors).length === 0) {
        addCampaign(newFormData);
      }
      else{

      }
    }catch (err) {
      // Error is already handled in onQueryStarted
      console.log('Error submitting campaign:', err);
    }

  };

  const validateFormData = () => {
    const errors = {};
    if (!formData.campaignName) {
      errors.campaignName = 'Campaign name is required';
    }
    if (!formData.campaignAim) {
      errors.campaignAim = 'Campaign Objective is required';
    }
    if (!formData.conversationGuideLines) {
      errors.conversationGuideLines = 'Conversation Guidelines is required';
    }
    if (!formData.campaignDesc) {
      errors.campaignDesc = 'Campaign Description is required';
    }
    if (!formData.firstMessage) {
      errors.firstMessage = 'First Message is required';
    }
    if (!formData.language) {
      errors.language = 'Language is required';
    }

    if (!formData.duration) {
      errors.duration = 'Duration is required and should be between 2 and 5';
    }

    setErrorMessages(errors);
  }

  const handleModalClose = () => {
    setFormData({
      businessId:'',
      campaignImgUrl:'',
      campaignName: '',
      campaignAim: '',
      conversationGuideLines:'',
      campaignDesc: '',
      firstMessage: '',
      handlingFaq:'',
      placingOrder:'',
      language: '',
      duration: 2
    });
    setErrorMessages({});
    onClose(false);
  }

  return (

    <Modal
    animationType="slide"
    transparent={true}
    visible={openModal}
    onRequestClose={handleModalClose}
>
            <View style={styles.centeredView}>
                <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleModalClose()}>
                    <MaterialIcons name="cancel" size={24} color="gray" />
                </TouchableOpacity>
                <View style={[styles.modalView]}>
                    <Text style={{fontSize:34, fontFamily:'bold'}}> Campaign Model</Text>
                    {isCampaignDataLoading &&  <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#0000ff" />
                    </View>}
                    {isCampaignDataError &&  <View style={styles.loadingContainer}>
                    <Text style={[styles.label,{color:'red', fontSize:10}]}>{campaignDataError}</Text>
                    </View>}
    
                    <ScrollView style={{width:'100%', borderRadius:8}}>
                        <View style={styles.container}>
                          <View style={styles.formContainer}>
                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Name of Campaign</Text>
                                  <TextInput
                                    style={[styles.input,errorMessages.campaignName ? styles.inputError : null]}
                                    value={formData.campaignName}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignName: text }))}
                                    placeholder="Enter campaign name"
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Objective of Campaign</Text>
                                  <TextInput
                                    style={[styles.input, errorMessages.campaignAim ? styles.inputError : null]}
                                    value={formData.campaignAim}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignAim: text }))}
                                    placeholder="Enter campaign objective"
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Campaign Description</Text>
                                  <TextInput
                                    style={[styles.input, styles.textArea, errorMessages.campaignDesc ? styles.inputError : null]}
                                    value={formData.campaignDesc}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, campaignDesc: text }))}
                                    placeholder="Enter campaign description"
                                    multiline={true}
                                    numberOfLines={4}
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                  <Text style={styles.label}>Conversation GuideLines</Text>
                                  <TextInput
                                    style={[styles.input, styles.textArea, errorMessages.conversationGuideLines ? styles.inputError : null]}
                                    value={formData.conversationGuideLines}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, conversationGuideLines: text }))}
                                    placeholder="Enter Conversation Guidlines"
                                    multiline={true}
                                    numberOfLines={4}
                                  />
                              </View>

                              <View style={styles.inputGroup}>
                                    <Text style={styles.label}>First Message</Text>
                                    <TextInput
                                      style={[styles.input, styles.textArea, errorMessages.firstMessage ? styles.inputError : null]}
                                      value={formData.firstMessage}
                                      onChangeText={(text) => setFormData(prev => ({ ...prev, firstMessage: text }))}
                                      placeholder="Enter first message"
                                      multiline={true}
                                      numberOfLines={4}
                                    />
                              </View>

                              <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Language</Text>
                                    <View style={styles.pickerContainer}>
                                          <Picker
                                            selectedValue={formData.language}
                                            onValueChange={(value) =>
                                              setFormData(prev => ({ ...prev, language: value }))
                                            }
                                            style={[styles.picker, errorMessages.firstMessage ? styles.inputError : null]}
                                          >
                                            <Picker.Item label="Select a language" value="" />
                                            <Picker.Item label="English" value="en" />
                                            <Picker.Item label="Hindi" value="hn" />
                                            <Picker.Item label="Spanish" value="es" />
                                            <Picker.Item label="French" value="fr" />
                                            <Picker.Item label="German" value="de" />
                                          </Picker>
                                    </View>
                              </View>

                              <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Duration (minutes)</Text>
                                    <TextInput
                                      style={[styles.input,errorMessages.duration ? styles.inputError : null]}
                                      value={formData.duration.toString()}
                                      onChangeText={(text) =>
                                        setFormData(prev => ({
                                          ...prev,
                                          duration: Math.min(parseInt(text) || 2, 5)
                                        }))
                                      }
                                      placeholder="Enter duration (max 5 minutes)"
                                      keyboardType="numeric"
                                    />
                              </View>
                          </View>
                        </View>
                    </ScrollView>
                    <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                        <View style={{margin:'5%'}}>
                            <Button mode="contained" onPress={() => onCreateCampaignPress()} >
                                Add Campaign
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
    </Modal>

  );
};

CreateCampaignModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal : PropTypes.bool.isRequired
};

export default CreateCampaignModal;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalView: {
      margin: 2.5,
      height:'90%',
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
      width: '80%'
    },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  errorContainer: {
    marginVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    backgroundColor: '#d3d3d3',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 8,
  }
});