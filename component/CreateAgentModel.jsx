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
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Button from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useVerificationCodeMutation } from './authApi';


const CreateAgentModal = ({ onClose, openModal }) => {

  const [isEditable, setIsEditable] = useState(false); 
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    persona: '',
    voice: ''
  });
  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  useEffect(() => {

  }, []);

  const onCreateAgentPress = async () => {
   
  };

  const handleModalClose = () => {
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
                        <Text style={{fontSize:34, fontFamily:'bold'}}> Agent Model</Text>
                        <ScrollView style={styles.container}>
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Name of Agent</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.name}
                                            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                            placeholder="Name of Agent"
                                        />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Role</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.role}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
                                        placeholder="Role"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Persona of agent</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={formData.persona}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, persona: text }))}
                                        placeholder="Persona of agent"
                                        multiline={true}
                                        numberOfLines={4}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Voice Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                        selectedValue={formData.voice}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, voice: value }))}
                                        style={styles.picker}
                                        >
                                        <Picker.Item label="Select a voice" value="" />
                                        {voices.map(voice => (
                                            <Picker.Item
                                            key={voice}
                                            label={voice.charAt(0).toUpperCase() + voice.slice(1)}
                                            value={voice}
                                            />
                                        ))}
                                        </Picker>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{flexDirection:'row', width:'100%',position: 'absolute' ,zIndex: 1, marginTop:'45%', alignSelf:'flex-end',alignContent:'center', justifyContent:'center'}}>
                            <View style={{margin:'5%'}}>
                                <Button mode="contained" onPress={onCreateAgentPress()} >
                                    Add Agent
                                </Button>
                            </View>
                        </View>
                    </View>
                </View>
        </Modal>

  );
};

CreateAgentModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  openModal : PropTypes.bool.isRequired
};

export default CreateAgentModal;

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
  loader: {
      position: 'absolute',
      top: 20,
      alignSelf: 'center',
      zIndex: 1,
  },
  button: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      zIndex: 1,
  },
  formContainer: {
    backgroundColor: '#d3d3d3',
    width:"100%",
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
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    width:'100%',
    paddingHorizontal: 20,
    paddingVertical: 40,
  }
});