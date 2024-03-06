// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Button, Modal, CheckBox,Image } from 'react-native';
import styles from '../styles';// Create your functional component
import { ScrollView } from 'react-native-web';
import Toast from 'react-native-toast-message';

import { Checkbox } from 'react-native-paper';
import NestedCheckbox from './NestedCheckBox';
import {useLoginWordpressMutation,useGenerateArticleMutation,useGenerateStructureMutation,useSaveArticleMutation, useGenerateTagsMutation,usePublishMutation} from './authApi';
import {useSelector} from "react-redux";
import {selectedLLm, selectUser} from "./authSlice";

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

  useEffect(() => {
    if (!llm) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Select llm to proceed',
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'red',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },// Change the text color here
      });
    }
  }, [llm]);

  useEffect(() => {
    if (isWordPressDataSuccess) {
      wordpressLoginSuccess();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Wordpress Login was saved successfully!',
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'gray',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' }, // Change the text color here
      });

    }
    if (isWordPressDataError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: {wordPressDataError},
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'red',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },// Change the text color here
      });
    }

  }, [isWordPressDataSuccess,isWordPressDataError]);

  useEffect(() => {
    if (isSaveArticleDataSuccess) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Article Saved successfully!',
        position:'bottom',
        bottomOffset:'80%',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
    if (isSaveArticleDataError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: {saveArticleError},
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'red',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
  }, [isSaveArticleDataSuccess, isSaveArticleDataError]);

  useEffect(() => {
    setEditorBoxView(false);
    if (isGenerateStructureError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Article Published successfully!',
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'gray',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
  }, [isGenerateStructureError]);
  useEffect(() => {
    if (isPublishError) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: {publishError},
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'gray',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
    if (isPublishSuccess) {
      console.log(publishError);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Article Published successfully!',
        position: 'bottom',
        bottomOffset:'80%',
        backgroundColor: 'red',
        text1Style: { color: 'black' }, // Change the text color here
        text2Style: { color: 'black' },
      });
    }
  }, [isPublishSuccess, isPublishError]);
  const seo = async () => {
    let userId = user.id;
    generateTagsMutation({userId,articleTitle,articleBody});
  }

  const handleWordPressLogin = () => {
    let userId = user.id;
    loginWordPressMutation({userId,username, password, saveCredentials})
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






  
  const TagCloud = ({ onTagPress }) => {

    const uniqueData = [...new Set(generateTagsData.tags)];
    const handleTagPress = (tag) => {
      console.log(`Tag pressed: ${tag}`);
      console.log(selectedTags);
      if (selectedTags.has(tag)) {
        // Remove value from set
        const newSet = new Set(selectedTags);
        newSet.delete(tag);
        setSelectedTags(newSet);
      } else {
        setSelectedTags(new Set(selectedTags).add(tag));
      }

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
    return (
      <View style={styles.tagCloudContainer}>

        {uniqueData.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleTagPress(tag)}
            onLongPress={() => handleDoublePress(tag)}
            style={{ ...styles.tagContainer, backgroundColor: selectedTags.has(tag) ? 'green' : 'gray' }}
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
    console.log(enableTitleGenerationCheck);
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

  const wordpressLoginSuccess =() =>{
    setModalVisible(false);
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
    <ScrollView style={[styles.container]}>
      <TextInput
          style={[styles.BlogTopicInputBox,{marginBottom:20,alignSelf:'center'}]}
          placeholder="Enter Topic you want to write.."
          onChangeText={(text) => setBlogTopic(text)}
          maxLength={100}
      />

      <TouchableOpacity onPress={() => {handleGenerateStructurePress()}} style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'20%',alignSelf:'center' }}>
        <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Generate Structure</Text>
      </TouchableOpacity>
      {isGenerateStructureLoading &&  <ActivityIndicator color={'blue'} />}
      {isGenerateStructureSuccess && <View><Text style={styles.GeneratedArticleText}>Select Researched Points To Include In Article </Text></View>}
      {isGenerateStructureSuccess &&
        <ScrollView   style={[styles.StructureContainer, {borderRadius:2}]}>
          <NestedCheckbox data={structureData} onSelect={handleSelect} />
        </ScrollView>
      }

      {isGenerateStructureSuccess && <View><TouchableOpacity onPress={() => {handleCopyPointPress()}} style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'20%',alignSelf:'center' }}>
        <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Edit Points</Text>
      </TouchableOpacity></View>}
      {
          editorBoxView && (
              <View>
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
                  <View>
                    <TouchableOpacity style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'20%',alignSelf:'center' }} onPress={() => handleGenerateArticlePress()}>
                      <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Generate Article</Text>
                    </TouchableOpacity>
                  </View>
              </View>
          )
      }



      {
          isGeneratedArticleDataSuccess && (
              <View style={{marginTop:40}}>
                <Text style={[{fontSize: 40,fontWeight: 'bold',backgroundColor: '#f2f2f2'}]}>{generatedArticleData.title} {"\n\n"}</Text>

                <Text style={[{fontSize: 16,backgroundColor: '#f2f2f2'}]}>{generatedArticleData.body}</Text>

                <Toast ref={(ref) => Toast.setRef(ref)} />
                <View style= {{flexDirection:'row', marginTop:20}}>
                  <View style={{flex:1}}>
                    <TouchableOpacity style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'50%',alignSelf:'center' }}
                                      onPress={() => seo()}>
                      <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Tags</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{flex:1}}>
                    <TouchableOpacity style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'50%',alignSelf:'center' }} onPress={() => {saveData()}}>
                      <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{flex:1}}>
                    <TouchableOpacity style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'50%',alignSelf:'center' }} onPress={() => publishArticle()}>
                      <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Publish</Text>
                    </TouchableOpacity>
                  </View>


                </View>

                <View style= {styles.ButtonFlex}>



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
          )
      }
      {isGenerateTagsSuccess && (
          <View style={styles.foldableView}>
            { <TagCloud  />}
          </View>
      )}

      {
          tagCloudViewOpen && (
              <View  style={[styles.tagCloudContainer,{marginTop:40}]}>
                <TouchableOpacity style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40, width:'18%',alignSelf:'center' }} onPress={() => publishArticle()}>
                  <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Publish with Tags</Text>
                </TouchableOpacity>
              </View>
          )
      }



    </ScrollView>
  );
};

// Export the component
export default llamaContent;

