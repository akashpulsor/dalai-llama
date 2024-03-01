// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Button, Modal, CheckBox,Image } from 'react-native';
import styles from '../styles';// Create your functional component
import { ScrollView } from 'react-native-web';

import { Ionicons } from '@expo/vector-icons';
import axios from "axios";
import { BASE_URL } from '../Constants';
import { Checkbox } from 'react-native-paper';
import NestedCheckbox from './NestedCheckBox';
import {useLoginWordpressMutation,useGenerateArticleMutation,useGenerateStructureMutation,useSaveArticleMutation, useGenerateTagsMutation,usePublishMutation} from './authApi';
import {useSelector} from "react-redux";
import {selectedLLm, selectUser} from "./authSlice";
import DropDownPicker from "react-native-dropdown-picker";
import ToastNotification from "./ToastNotification";
const llamaContent = ({tool}) => {
  const user =  useSelector(selectUser);
  const llm =  useSelector(selectedLLm);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagCloudViewOpen, setTagCloudViewOpen] = useState(false);
  const [blogTopic, setBlogTopic] = useState('');
  const [editorBoxView, setEditorBoxView] = useState(false);
  const [enableTitleGenerationCheck, setEnableTitleGenerationCheck] = useState(false);
  const [selectedData, setSelectedData] = useState(new Map());
  const [generatedArticleViewOpen, setGeneratedArticleViewOpen] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [generateStructureMutation, { data: structureData,isLoading :isGenerateStructureLoading, isError :isGenerateStructureError, isSuccess :isGenerateStructureSuccess, error :generateStructureError }] = useGenerateStructureMutation();
  const [loginWordPressMutation, { data: loginWordPressData, isLoading :isWordPressDataLoading, isSuccess :isWordPressDataSuccess, isError :isWordPressDataError, error :wordPressDataError }] = useLoginWordpressMutation();
  const [generateArticleMutation, { data: generatedArticleData, isLoading :isGeneratedArticleDataLoading, isSuccess :isGeneratedArticleDataSuccess, isError :isGeneratedArticleDataError, error :generatedArticleDataError }]=useGenerateArticleMutation();
  const [saveArticleMutation, { data: saveArticleData, isLoading :isSaveArticleDataLoading, isSuccess :isSaveArticleDataSuccess, isError :isSaveArticleDataError, error :saveArticleError }]=useSaveArticleMutation();
  const [publishMutation, { data: publishData, isLoading :isPublishLoading, isSuccess :isPublishSuccess, isError :isPublishError, error :publishError }]=usePublishMutation();
  const [generateTagsMutation, { data: generateTagsData, isLoading :isGenerateTagsLoading, isSuccess :isGenerateTagsSuccess, isError :isGenerateTagsError, error :generateTagsError }]=useGenerateTagsMutation();


  const seo = async () => {
    let userId = user.id;
    generateTagsMutation({userId,articleTitle,articleBody});
  }

  const handleWordPressLogin = () => {
    loginWordPressMutation({username, password, saveCredentials})
  };

  const toggleWordPressSaveCredentialsCheckBox = () => {
    setSaveCredentials(!saveCredentials);
  };

 

  function isValidHttpUrl(s) {
    let url;
    try {
      url = new URL(s);
    } catch (e) { return false; }
    return /https?/.test(url.protocol);
  }






  
  const TagCloud = ({ onTagPress, onCrossPress }) => {
    const uniqueData = [...new Set(generateTagsData)];

    return (
      <View style={styles.tagCloudContainer}>
        <TouchableOpacity onPress={onCrossPress} style={styles.crossButton}>
             <Ionicons name="ios-close-circle" size={34} color="red" style={{ marginRight: 5 }} />
        </TouchableOpacity>
        {uniqueData.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleTagPress(index,tag)}
            onLongPress={() => handleDoublePress}
            style={{ ...styles.tagContainer, backgroundColor: selectedTags.has(item) ? 'green' : '#0092ca' }}
          >
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))
        }
        {
          setTagCloudViewOpen(true)
        }
      </View>
      
    );
  };

  const handleTagPress = (tag) => {
    console.log(`Tag pressed: ${tag}`);
    if (selectedTags.has(tag)) {
      // Remove value from set
      const newSet = new Set(selectedTags);
      newSet.delete(tag);
      setSelectedTags(newSet);
    } else {
      // Add value to set
      setSelectedTags(new Set(selectedTags).add(tag));
    }
    // Add your custom logic when a tag is pressed
  };

  const handleDoublePress = (tag) => {
    console.log('Cross button pressed');
    if (selectedTags.has(tag)) {
      // Remove value from set
      const newSet = new Set(selectedTags);
      newSet.delete(tag);
      setSelectedTags(newSet);
    }
    // Add your custom logic for the cross button press
  };

  
  
  const handleSelect = (updatedSelectedData) => {
    setSelectedData(updatedSelectedData);
    console.log("Selected Data:", updatedSelectedData);
  };

  const handleSetEnableTitleGenerationCheck = () => {
    setEnableTitleGenerationCheck(!enableTitleGenerationCheck);
    if (!enableTitleGenerationCheck) {
      setTitle(''); // Clear the title when checkbox is unchecked
    }
  };

  const handleGenerateStructurePress =   () => {

    let userId = user.id;
    let llmId = llm.id;
    generateStructureMutation({blogTopic,llmId,userId});
    console.log(`Cross button pressed : ${blogTopic}`);

    console.log("data"+structureData);

    // Add your custom logic for the cross button press
  };

  const handleCopyPointPress = () => {
    setEditorBoxView(true);
    let selectedBody = generateTextFromMap(selectedData);
    setBody(selectedBody);
  };

  const handleGenerateArticlePress = () => {
    let userId = user.id;
    let llmId = llm.id;
    generateArticleMutation({userId,enableTitleGenerationCheck,title,body,llmId});
  };

    // Function to generate text from map
    function generateTextFromMap(map) {
      let text = '';
      map.forEach((points, heading) => {
        text += `${heading}:\n`;
        points.forEach(point => {
          text += `\t${point}\n`;
        });
      });
      return text;
   }

    function generateMapFromText(text) {
      const map = new Map();
      const lines = text.split('\n');
      let currentHeading = '';
      lines.forEach(line => {
        if (line.startsWith('\t')) {
          map.get(currentHeading).push(line.trim());
        } else {
          currentHeading = line.trim();
          map.set(currentHeading, []);
        }
      });
      return map;
    }



  const saveData = () => {
    let userId = user.id;
    saveArticleMutation({userId,articleTitle, articleBody});
  };

  const publishArticle = () => {
    let userId = user.id;
    if(!username || !password){
      setModalVisible(true);
    }
    else{
      publishMutation({username,password,userId,articleTitle, articleBody,selectedTags});
    }
  };

  return (
    // Main container with a gray background
    <ScrollView style={styles.container}>
      <View style={styles.TopicContainer}>
        <View style={styles.BlogTopicInputContainer}>
            <TextInput
                style={styles.BlogTopicInputBox}
                placeholder="Enter Topic you want to write.."
                onChangeText={(text) => setBlogTopic(text)}
                maxLength={100}
            />
          {!llm && <Text style={{fontSize: 12,color: 'red'}}>Select llm</Text>}
          <TouchableOpacity style={styles.GenerateStructureButtonFlex}
                  onPress={() => {handleGenerateStructurePress()}}>
                  <Text style={styles.GenerateButtonText}>GENERATE STRUCTURE</Text>
            </TouchableOpacity>
        </View>
      </View>
      {isGenerateStructureLoading &&  <ActivityIndicator color={'blue'} />}

      {isGenerateStructureSuccess && <View  style={styles.StructureContainer}>
        <Text style={styles.GeneratedArticleText}>Select Researched Points To Include In Article </Text>
        <ScrollView   style={styles.StructureContainer}>
          <NestedCheckbox data={structureData} onSelect={handleSelect} />
        </ScrollView>

        <View style={styles.BlogTopicInputContainer}>
          <TouchableOpacity style={styles.EditArticleButtonFlex}
                            onPress={() => {handleCopyPointPress()}}>
            <Text style={styles.GenerateButtonText}>EDIT POINTS</Text>
          </TouchableOpacity>
        </View>
      </View>}
      {
         isGenerateStructureError && (<View   style={styles.StructureContainer}>
                  <Text style={[styles.GeneratedArticleText,{fontSize: 12,color: 'red'}]}>{generateStructureError}</Text>
                  </View> ) && setEditorBoxView(false)
      }
      {
        editorBoxView && (
          <View style={styles.EditBoxContainer}>
          <View style={styles.Title}>
            <TextInput
              style={[styles.TitleInputBox, enableTitleGenerationCheck && styles.disabledInput]} // Apply different styles based on checked status
              placeholder=" Title"
              onChangeText={(text) => setTitle(text)}
              value={title}
              editable={!enableTitleGenerationCheck} // Disable TextInput when checked is true
            />
            <Checkbox.Item
              label="Auto Generate Title"
              status={enableTitleGenerationCheck ? 'checked' : 'unchecked'}
              onPress={handleSetEnableTitleGenerationCheck}
              labelStyle={styles.AutoTitleLabel}
              position="leading"
            />
            {isGeneratedArticleDataLoading && <ActivityIndicator color={'blue'} />}
            <TextInput
                      editable = {true}
                      style={styles.TitleBodyBox}
                      value={body}
                      onChangeText={(text) => setBody(text)}
                      placeholder=" Body"
                      multiline
            />
            <View style={styles.GenerateArticleButtonFlex}>
              <TouchableOpacity style={styles.GenerateArticleButton} onPress={() => handleGenerateArticlePress()}>
                <Text style={styles.GenerateButtonText}>GENERATE ARTICLE</Text>
              </TouchableOpacity>
            </View>            
          </View>
        </View>
        )
      }

      {isGeneratedArticleDataError && <View   style={styles.FinalArticleContainer}>
        <Text style={[{fontSize: 12,color: 'red'}]}>{generatedArticleDataError}</Text>
      </View>}
      {
          isGeneratedArticleDataSuccess && (
          <View style={styles.FinalArticleContainer}>
             <ScrollView contentContainerStyle={styles.FinalArticleFlex}>
              <View style={styles.content}>
                <Text style={styles.label}>{generatedArticleData.title}</Text>
                {(isSaveArticleDataLoading || isPublishLoading || isGenerateTagsLoading) && <ActivityIndicator color={'blue'} />}
                {(isSaveArticleDataSuccess ) && <ToastNotification message="Article Saved..." messageStyle={{color:'#0092ca'}}/>}
                {(isPublishSuccess) && <ToastNotification message="Article Published..." messageStyle={{color:'#0092ca'}} />}

                {(isSaveArticleDataError ) && <ToastNotification message={saveArticleError} messageStyle={{color:'#0092ca'}}/>}
                {(isPublishError) && <ToastNotification message={publishError} messageStyle={{color:'#0092ca'}} />}
                <Text style={styles.article}>{generatedArticleData.body}</Text>
              </View>
            </ScrollView>
            <View style= {styles.ButtonFlex}>
               <View style= {styles.TagsButtonFlex}>
                    <TouchableOpacity style={styles.TagsButton}
                      onPress={() => seo()}>
                    <Text style={styles.GenerateButtonText}>TAGS</Text>
                  </TouchableOpacity>
               </View>
               <View style= {styles.SaveButtonFlex}>
                  <TouchableOpacity style={styles.SaveButton} onPress={() => {saveData()}}>
                    <Text style={styles.GenerateButtonText}>SAVE</Text>
                  </TouchableOpacity>
               </View>

               <View style= {styles.PublishButtonFlex}>
                  <TouchableOpacity style={styles.PublishButton} onPress={() => publishArticle()}>
                    <Text style={styles.GenerateButtonText}>PUBLISH</Text>
                  </TouchableOpacity>

                    <Modal
                            animationType="slide"
                            transparent={true}
                            visible={modalVisible}
                            onRequestClose={() => {
                              setModalVisible(false);
                            }}
                    >
                        <View style={styles.centeredView}>
                          <View style={styles.modalView}>
                            <Image source={require('../assets/wordpress-logo.png')} style={styles.logo} />
                            <Text style={styles.modalText}>Enter your WordPress credentials:</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Username"
                              value={username}
                              onChangeText={setUsername}
                            />
                            {isWordPressDataLoading && <ActivityIndicator  color={'blue'}/>}
                            {isWordPressDataSuccess && setModalVisible(false)}
                            <TextInput
                              style={styles.input}
                              placeholder="Password"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={true}
                            />
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={saveCredentials}
                                onValueChange={toggleWordPressSaveCredentialsCheckBox}
                              />
                              <Text style={styles.checkboxLabel}>Remember Me</Text>
                            </View>
                            <Button title="Login" onPress={()=>{handleWordPressLogin()}} />
                          </View>
                        </View>
                  </Modal>
               </View>
            </View>
          </View>
        )
      }
      {isGenerateTagsSuccess && (
        <View style={styles.foldableView}>
          { <TagCloud onTagPress={handleTagPress} onCrossPress={handleCrossPress} />}
        </View>
      )}

      {
          tagCloudViewOpen && (
              <View  style={styles.tagCloudContainer}>
                  <TouchableOpacity style={styles.tagContainer} onPress={() => publishArticle()}>
                        <Text style={styles.tagText}>Publish with Tags</Text>
                  </TouchableOpacity>
              </View>
          )        
      }

    </ScrollView>
  );
};

// Export the component
export default llamaContent;

