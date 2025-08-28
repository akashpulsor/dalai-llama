import React, { useState , useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Button from './Button';
import CampaignForm from './CampaignForm';
import { useSelector } from 'react-redux';
import {selectUser } from './authSlice';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import { CheckBox } from 'react-native';
import { useGetAgentListQuery, useAddCampaignMutation, useGetLeadDataQuery,useGetLlmDataListQuery,useGetPhoneDataListQuery, useStartCampaignMutation, useRunCampaignMutation, useStartInBoundCampaignMutation } from './authApi';

const CampaignRun = ({ onClose, openModal, campaignData }) => {
  const user =  useSelector(selectUser);  
 
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    campaignId: campaignData?.campaignId,
    all: true,
    leadList: [],
    agentId:'',
    language: '',
    llmId:'',
    phoneId:'',
    businessId:user?.id,
    campaignType:'OUT_BOUND'
  });

  const [campaignFormData, setCampaignFormData] = useState(
    campaignData
  );
  const [enabled, setEnabled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isMainFlowVisible, setIsMainFlowVisible] = useState(false);
  const [playCampaign, setPlayCampaign] = useState(false);
  const [testList, setTestList] = useState([]);
  const [testLeadPage, setTestLeadPage] = useState(0);
  const [testLeadPageSize, setTestLeadPageSize] = useState(10);
  const [testLeadPageSort, setTestLeadPageSort] = useState("leadId");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [campignRunFormData,  setCampignRunFormData] = useState({});
  const { data: agentDataList, error,isLoading, isError } = useGetAgentListQuery(user?.id);
  const [addCampaign, { data: campaignResponseData, isLoading:isCampaignDataLoading, isSuccess:isCampaignDataSuccess, isError:isCampaignDataError, error:campaignDataError }] = useAddCampaignMutation();
  const [startCampaign, { data: startCampaignResponseData, isLoading:isStartCampaignResponseLoading, isSuccess:isStartCampaignResponseSuccess, isError:isStartCampaignResponseError, error:startCampaignResponseError }] = useStartCampaignMutation();
  const [runCampaign, { 
    data: runCampaignResponseData, 
    isLoading: isRunCampaignResponseLoading, 
    isSuccess: isRunCampaignResponseSuccess, 
    isError: isRunCampaignResponseError, 
    error: runCampaignResponseError, 
    reset: resetRunCampaignResponse 
  }] = useRunCampaignMutation();

  const [configureInBoundCampaign, { 
    data: inboundCampaignResponseData, 
    isLoading: inboundCampaignResponseLoading, 
    isSuccess: inboundampaignResponseSuccess, 
    isError: isInboundCampaignResponseError, 
    error: inboundCampaignResponseError, 

  }] = useStartInBoundCampaignMutation();
  
  const { data: testLeadDataList, isSuccess:isTestListSuccess, error: testListError, isLoading: isTestListLoading, isError: isTestListError,} = useGetLeadDataQuery({
    businessId: user?.id,
    page: testLeadPage,
    test: isMainFlowVisible,
    size: testLeadPageSize,
    sortBy: testLeadPageSort
  }, {
    skip: !isMainFlowVisible // Only execute the query when isMainFlowVisible is true
  });

  const { data: llmDataList, isSuccess:isLlmDataListSuccess, error: llmDataListError, isLoading: isLlmDataListLoading, isError: isLlmDataListError,} = useGetLlmDataListQuery({
    businessId: user?.id,
  });

  const { data: phoneDataList, isSuccess:isPhoneDataListSuccess, error: phoneDataListError, isLoading: isPhoneDataListLoading, isError: isPhoneDataListError} = useGetPhoneDataListQuery({
    businessId: user?.id,
  });


    // Update validation function
    const isStartButtonDisabled = () => {
        return !formData.phoneId || !formData.llmId || !formData.language || !formData.agentId;
    };
    
      // Reset form function
      const resetForm = () => {
        setFormData({
          campaignId: campaignData?.campaignId,
          all: true,
          leadList: [],
          agentId: '',
          language: '',
          llmId: '',
          phoneId: '',
          businessId: user?.id,
          campaignType:'OUT_BOUND'
        });
        setSelectedLeads([]);
        setIsMainFlowVisible(false);
        setPlayCampaign(false);
      };

    const handleLeadSelect = (leadId) => {
        setSelectedLeads(prevSelected => {
            const newSelected = prevSelected.includes(leadId)
                ? prevSelected.filter(id => id !== leadId)
                : [...prevSelected, leadId];
                
            // Update formData with the new selection
            setFormData(prevFormData => ({
                ...prevFormData,
                leadList: newSelected
            }));
            
            return newSelected;
        });
    };

  const handleCampaignEditSubmit = () => {
    console.log('Campaign Form data:', campaignFormData);
    // Process the form data further
    if(!campaignFormData.campaignId){
        dispatch(showMessage({
            message: 'Campaign Id not present',
            type: 'error'
        }));
    }
    if(!campaignFormData.businessId){
        dispatch(showMessage({
            message: 'Business Id not present',
            type: 'error'
        }));
    }
    addCampaign(campaignFormData);
    setEnabled(false);
  };

  const testToggleSwitch = () =>{
    setIsMainFlowVisible(prev => !prev);
    setFormData(prev => ({
      ...prev,
      all: !prev.all,
      leadList: []
    }));
  };

  const handleModalClose = () => {
    resetForm();
    onClose(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleStartCampaign = () => {
    const campaignData = {
      ...formData,
      all: !isMainFlowVisible
    };
    startCampaign(campaignData);
  };

  const handleInbuoundCampaign = () => {
    const campaignData = {
      ...formData,
      all: !isMainFlowVisible
    };
    configureInBoundCampaign(campaignData);
  };

  const handleRunCampaign = () => {
    runCampaign(campignRunFormData);
  };

  const handlePhoneSelection = (businessNumber) => {
    // Find the selected phone data object
    const selectedPhone = phoneDataList.find(phone => phone.businessNumber === businessNumber);
    // If a phone is selected, update all form fields
    if (selectedPhone) {
      setFormData(prevData => ({
        ...prevData,
        phoneId: selectedPhone.phoneId,
        businessNumber: selectedPhone.businessNumber,
      }));

    }
  };

  useEffect(() => {
    if (openModal) {
        // Reset playCampaign, formData, and other states when the modal is opened
        setPlayCampaign(false);
        setFormData({
          campaignId: campaignData?.campaignId,
          all: true,
          leadList: [],
          agentId: '',
          language: '',
          llmId: '',
          phoneId: '',
          businessId: user?.id,
          campaignType:'OUT_BOUND'
        });
        setSelectedLeads([]);
        setIsMainFlowVisible(false);
        resetRunCampaignResponse(); // Reset isRunCampaignResponseSuccess
    }
}, [openModal, campaignData, user?.id]);

useEffect(() => {
    if (isTestListSuccess && testLeadDataList) {
        setTestList(testLeadDataList.content);
    }
    if (isStartCampaignResponseSuccess) {
        setPlayCampaign(true);
        setCampignRunFormData({ businessId: user?.id, campaignRunId: startCampaignResponseData?.campaignRunId });
    }
    if (isRunCampaignResponseSuccess) {
        resetForm();
        handleModalClose(); // Only close modal after the campaign run is completed
        resetRunCampaignResponse(); // Reset isRunCampaignResponseSuccess after handling
    }
}, [isTestListSuccess, isStartCampaignResponseSuccess, isRunCampaignResponseSuccess]);

  const memoizedCampaignFormData = React.useMemo(() => campaignFormData, [campaignFormData]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={openModal}
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleModalClose}
          >
            <MaterialIcons name="cancel" size={24} color="gray" />
          </TouchableOpacity>
          <Text style={{ fontSize: 34, fontFamily: 'bold', alignSelf:'center' }}>
              RUN CAMPAIGN
            </Text>
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
            <View style={[styles.inputGroup]}>
                <Text style={{fontSize: 16,fontWeight: 'bold',marginBottom: 8,alignSelf: 'flex-start'}}>Campaign</Text>
                <CampaignForm  
                    enabled={enabled}
                    formData={memoizedCampaignFormData}
                    setFormData={setCampaignFormData}
                />
            </View>
              
              <View style={[styles.inputGroup,{width:'20%'}]}>
                {!enabled ? (
                  <Button mode="contained" onPress={() => setEnabled(true)}>
                    Edit Campaign
                  </Button>
                ) : (
                  <Button mode="contained" onPress={handleCampaignEditSubmit}>
                    Save Campaign
                  </Button>
                )}
              </View>
              <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone</Text>
                    <View style={styles.pickerContainer}>
                        {isPhoneDataListLoading ? (
                                <ActivityIndicator size="small" color="#0000ff" />
                            ) : isPhoneDataListError ? (
                                <Text style={styles.errorText}>Error loading Phone</Text>
                            ) : (
                                <Picker
                                    selectedValue={formData.businessNumber}
                                    onValueChange={handlePhoneSelection}
                                    style={[
                                    styles.picker
                                    ]}
                                >
                                    <Picker.Item label="Select Business Number" value="" />
                                    {Array.isArray(phoneDataList) && phoneDataList.map((phone) => (
                                    <Picker.Item
                                        key={phone.phoneId}
                                        label={phone.businessNumber}
                                        value={phone.businessNumber}
                                    />
                                    ))}
                                </Picker>
                            )}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Large Language Model</Text>
                    <View style={styles.pickerContainer}>
                        {isLlmDataListLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : isLlmDataListError ? (
                            <Text style={styles.errorText}>Error loading LLm</Text>
                        ) : (
                            <Picker
                                selectedValue={formData.llmId}  // Changed this line to use form.llmId
                                onValueChange={(text) => handleFormChange('llmId', text)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select an Llm" value="" />
                                {llmDataList?.map(llmData => (
                                    <Picker.Item 
                                        key={llmData.llmId}
                                        label={`${llmData.friendlyName}`}
                                        value={`${llmData.llmId}`}
                                    />
                                ))}
                            </Picker>
                        )}
                    </View>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Language</Text>
                    <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.language}
                        onValueChange={(text) => handleFormChange('language', text)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select a language" value="" />
                        <Picker.Item label="English" value="English" />
                        <Picker.Item label="Hindi" value="Hindi" />
                        <Picker.Item label="Spanish" value="Spanish" />
                        <Picker.Item label="French" value="French" />
                        <Picker.Item label="German" value="German" />
                    </Picker>
                    </View>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Agent</Text>
                    <View style={styles.pickerContainer}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : isError ? (
                            <Text style={styles.errorText}>Error loading agents</Text>
                        ) : (
                            <Picker
                                selectedValue={formData.agentId}
                                onValueChange={(text) => handleFormChange('agentId', text)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select an agent" value="" />
                                {agentDataList?.map(agent => (
                                    <Picker.Item 
                                        key={agent.agentId}
                                        label={`${agent.agentName}: ${agent.role}`}
                                        value={agent.agentId}
                                    />
                                ))}
                            </Picker>
                        )}
                    </View>
                </View>
                {formData.campaignType === 'out_bound' ? (
    <>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Test Mode</Text>

            <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isMainFlowVisible ? "#007AFF" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={testToggleSwitch}
                value={isMainFlowVisible}
                style={styles.switch}
            />
            <Pressable onPress={testToggleSwitch}>
                <Text style={styles.label}>Run With Test Users</Text>
            </Pressable>
        </View>

        {isMainFlowVisible && (
            <View style={styles.userList}>
                {isTestListLoading && <Text>Loading users...</Text>}
                {isTestListError && <Text>Error loading users</Text>}

                {testList?.map(lead => (
                    <View key={lead.leadId} style={styles.leadItem}>
                        <CheckBox
                            value={selectedLeads.includes(lead.leadId)}
                            onValueChange={() => handleLeadSelect(lead.leadId)}
                            style={{ marginLeft: '2%' }}
                        />
                        <View style={styles.leadInfo}>
                            {console.log(lead)}
                            <Text style={[styles.leadName, { marginRight: '5%', marginLeft: '5%' }]}>
                                {lead.leadName} - ID: {lead.leadId}
                            </Text>
                            {lead.leadEmail && (
                                <Text style={[styles.leadEmail, { marginRight: '5%', marginLeft: '5%' }]}>
                                    {lead.leadEmail}
                                </Text>
                            )}
                            {lead.leadPhone && (
                                <Text style={[styles.leadData, { marginRight: '5%', marginLeft: '5%' }]}>
                                    {lead.leadPhone}
                                </Text>
                            )}
                            {lead.leadgender && (
                                <Text style={[styles.leadData, { marginRight: '5%', marginLeft: '5%' }]}>
                                    {lead.leadGender}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        )}
        <View style={[styles.inputGroup, { width: '20%' }]}>
            {!playCampaign ?
                <Button
                    mode="contained"
                    onPress={() => handleStartCampaign()}
                    disabled={isStartButtonDisabled()}
                    style={isStartButtonDisabled() ? styles.disabledButton : null}
                >
                    Start Campaign
                </Button> :
                <Button mode="contained" onPress={() => handleRunCampaign()}>
                    Play Campaign
                </Button>
            }
        </View>
    </>
) : (
    <Button
        mode="contained"
        onPress={() => handleInbuoundCampaign()}
        disabled={isStartButtonDisabled()}
        style={isStartButtonDisabled() ? styles.disabledButton : null}
    >
        Configure Campaign
    </Button>
)}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }, 
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#d3d3d3',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    alignSelf:'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '50%',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    borderRadius: 12,
  },
  leadInfo: {
    marginLeft: 10,
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
  },
  leadInfo: {
    marginLeft: 10,
    flex: 1,
    flexDirection:'row'
  },
  leadName: {
    fontSize: 16,
    fontWeight: '500',
  },
  leadData: {
    fontSize: 16,
    fontWeight: '300',
  },
  leadEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusText: {
    padding: 15,
    textAlign: 'center',
  },
  leadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userList:{
    width:'70%',
    height:'5%',
    borderWidth:1,
    backgroundColor:"#fff",
    borderRadius:12
  }
});

export default CampaignRun;