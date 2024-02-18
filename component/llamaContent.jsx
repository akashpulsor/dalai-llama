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
import WordPressLoginPopup from './WordPressLoginPopup';
import CustomHeader from './CustomHeader';

const llamaContent = () => {
  const [data, setData] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [foldableViewOpen, setFoldableViewOpen] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [tagCloudViewOpen, setTagCloudViewOpen] = useState(false);
  const [competitorAnalysisViewOpen, setCompetitorAnalysisViewOpen] = useState(false);
  const [competitorAnalysisSpinner, setCompetitorAnalysisSpinner] = useState(false);
  const [blogTopic, setBlogTopic] = useState('');
  const [generatedStructureView, setGeneratedStructureView] = useState(false);
  const [editorBoxView, setEditorBoxView] = useState(false);
  const [generatedStructure, setGeneratedStructure] = useState([]);
  const [generatedStructureSpinner, setGeneratedStructureSpinner] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [enableTitleGenerationCheck, setEnableTitleGenerationCheck] = useState(false);
  const [selectedData, setSelectedData] = useState(new Map());
  const [generatedArticleViewOpen, setGeneratedArticleViewOpen] = useState(false);
  const [generatedArticleViewSpinner, setGeneratedArticleViewSpinner] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
    // useEffect to observe changes in selectedData
  useEffect(() => {
      console.log("Selected Data AKASH:", selectedData);
      console.log("Body1:", body);
  }, [selectedData]);

  const seo = async (data) => {
    try {
      let temp = JSON.stringify(data)
      console.log("POST DATA IS" + temp);
      let headers = {
        'Content-Type': 'application/json;charset=UTF-8',

        "Accept": "*/*"
      };

      setSpinner(true);
      let res = await axios
        .post(BASE_URL + "/content", data, { "headers": headers });
      if (res.status == 200) {
        // test for status you want, etc
        console.log(res.status)
      }
      setSpinner(false);
      // Don't forget to return something
      //console.log(res.data.keywords)
      return res.data.keywords
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setSpinner(false);
    }
  }

  const handleLogin = () => {
    // Perform actions with username and password, such as logging in to WordPress
    console.log('Username:', username);
    console.log('Password:', password);
    // Save credentials if checkbox is checked
    if (saveCredentials) {
      // Here you can save the credentials securely (e.g., in AsyncStorage)
      console.log('Credentials saved.');
    }
    // Close the modal
    setModalVisible(false);
  };

  const getTopPageRanks = async (data) => {
    try {
      let temp = JSON.stringify(data)
      console.log("POST DATA IS" + temp);
      let headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        "Accept": "*/*"
      };

      setCompetitorAnalysisSpinner(true);
      setCompetitorAnalysisViewOpen(false);
      let res = await axios
        .post(BASE_URL + "/getCurrentRanks", data, { "headers": headers });
      if (res.status == 200) {
        // test for status you want, etc
        console.log(res.status)
      }
      setCompetitorAnalysisSpinner(false);
      setCompetitorAnalysisViewOpen(true);
      // Don't forget to return something
      console.log(res.data)
      return res.data
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setCompetitorAnalysisSpinner(false);
    }
  }
 

  function isValidHttpUrl(s) {
    let url;
    try {
      url = new URL(s);
    } catch (e) { return false; }
    return /https?/.test(url.protocol);
  }





  const getRandomColor = () => {
    // Generate a random color in hex format
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  };
  
  const TagCloud = ({ onTagPress, onCrossPress }) => {
    const uniqueData = [...new Set(data)];

    return (
      <View style={styles.tagCloudContainer}>
        <TouchableOpacity onPress={onCrossPress} style={styles.crossButton}>
             <Ionicons name="ios-close-circle" size={34} color="red" style={{ marginRight: 5 }} />
        </TouchableOpacity>
        {uniqueData.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onTagPress(tag)}
            style={{ ...styles.tagContainer, backgroundColor: getRandomColor() }}
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
    // Add your custom logic when a tag is pressed
  };

  const handleCrossPress = () => {
    console.log('Cross button pressed');
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

  const handleGenerateStructurePress = () => {
    setGeneratedStructureSpinner(true);
    setGeneratedStructureView(true);
    setGeneratedStructureSpinner(false);
    //TODO generate this data using api
    setGeneratedStructure([{heading:"Heading1", points:['point1', 'point2', 'point3']},
      {heading:"Heading2", points:['point4', 'point5', 'point6']},
      {heading:"Heading3", points:['point7', 'point8', 'point9']},
      {heading:"Heading4", points:['point10', 'point11', 'point12']},
      {heading:"Heading5", points:['point13', 'point14', 'point15']},
      {heading:"Heading6", points:['point16', 'point17', 'point18']},
    
    ]);
    setEditorBoxView(false);  
    console.log(`Cross button pressed : ${blogTopic}`);
    // Add your custom logic for the cross button press
  };

  const handleCopyPointPress = () => {
    setGeneratedStructureSpinner(true);
    setEditorBoxView(true);
    let selectedBody = generateTextFromMap(selectedData);
    console.log('Body2' + selectedBody);
    setBody(selectedBody);     
    setGeneratedStructureSpinner(false);
    console.log(`Cross button pressed : ${selectedItems}`);
    // Add your custom logic for the cross button press
  };

  const handleGenerateArticlePress = () => {
    setGeneratedArticleViewSpinner(true);
    setGeneratedArticleViewOpen(true);
    setArticleTitle('Title');
    setArticleTitle('Body');     
    setGeneratedArticleViewSpinner(false);
    console.log(`Cross button pressed : ${selectedItems}`);
    // Add your custom logic for the cross button press
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

    // Function to handle changes in text input
  const handleInputChange = (text) => {
    setTextInputValue(text);
    setSelectedItems(generateMapFromText(text));
  };

  // Function to add a new point
  const addPoint = () => {
    const updatedText = `${textInputValue}\nNewHeading:\n\tNewPoint`;
    setTextInputValue(updatedText);
    setSelectedItems(generateMapFromText(updatedText));
  };

  const saveData = () => {

  };

  return (
    // Main container with a gray background
    <ScrollView style={styles.container}>
      <CustomHeader navigation={navigation} title="LLAMA-CONTENT" />
      <View style={styles.TopicContainer}>
        <View style={styles.BlogTopicInputContainer}>
            <TextInput
                style={styles.BlogTopicInputBox}
                placeholder="Enter Topic you want to write.."
                onChangeText={(text) => setBlogTopic(text)}
                maxLength={100}
            />
            <TouchableOpacity style={styles.GenerateStructureButtonFlex}
                  onPress={() => {handleGenerateStructurePress()}}>
                  <Text style={styles.GenerateButtonText}>GENERATE STRUCTURE</Text>
            </TouchableOpacity>
        </View>
      </View>
      
      {
              generatedStructureSpinner ?  <ActivityIndicator color={'blue'} /> :
                generatedStructureView  && (
                      <View  style={styles.StructureContainer}>
                        <Text style={styles.GeneratedArticleText}>Select Researched Points To Include In Article </Text>
                        <ScrollView   style={styles.StructureContainer}>
                            <NestedCheckbox data={generatedStructure} onSelect={handleSelect} />
                        </ScrollView>                          
                              
                        <View style={styles.BlogTopicInputContainer}>
                            <TouchableOpacity style={styles.EditArticleButtonFlex}
                                onPress={() => {handleCopyPointPress()}}>
                              <Text style={styles.GenerateButtonText}>EDIT POINTS</Text>
                            </TouchableOpacity>
                        </View>
                      </View>                 
                )
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

      {
        generatedArticleViewSpinner ?  <ActivityIndicator color={'blue'} /> : 
        generatedArticleViewOpen && (
          <View style={styles.FinalArticleContainer}>
             <ScrollView contentContainerStyle={styles.FinalArticleFlex}>
              <View style={styles.content}>
                <Text style={styles.label}>{articleTitle}</Text>
                <Text style={styles.article}>{articleBody}</Text>
              </View>
            </ScrollView>
            <View style= {styles.ButtonFlex}>
               <View style= {styles.TagsButtonFlex}>
                    <TouchableOpacity style={styles.TagsButton}
                      onPress={() => {
                        setFoldableViewOpen(!foldableViewOpen);
                        //prev => new Map([...prev, [selectedLanguage, data]])
                        seo({ "title": title, "body": body }).then(res => { setData((prevList) => [...res, ...prevList]); })
                      }}>
                    <Text style={styles.GenerateButtonText}>TAGS</Text>
                  </TouchableOpacity>
               </View>
               <View style= {styles.SaveButtonFlex}>
                  <TouchableOpacity style={styles.SaveButton} onPress={() => {saveData()}}>
                    <Text style={styles.GenerateButtonText}>SAVE</Text>
                  </TouchableOpacity>
               </View>

               <View style= {styles.PublishButtonFlex}>
                  <TouchableOpacity style={styles.PublishButton} onPress={() => setModalVisible(true)}>
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
                                onValueChange={setSaveCredentials}
                              />
                              <Text style={styles.checkboxLabel}>Remember Me</Text>
                            </View>
                            <Button title="Login" onPress={handleLogin} />
                          </View>
                        </View>
                  </Modal>
               </View>
            </View>
          </View>
        )
      }
      {foldableViewOpen && (

        <View style={styles.foldableView}>
          {/* Your content for the foldable view */}
          {spinner ? <ActivityIndicator color={'blue'} /> :

            <TagCloud onTagPress={handleTagPress} onCrossPress={handleCrossPress} />
            
          }
        </View>
      )}

      {
          tagCloudViewOpen && (
              <View  style={styles.tagCloudContainer}>
                  <TouchableOpacity style={styles.tagContainer} onPress={() => getTopPageRanks(data)}>
                        <Text style={styles.tagText}>Competitor Analysis</Text>
                  </TouchableOpacity>
              </View>
          )        
      }

      {
          competitorAnalysisSpinner ?  <ActivityIndicator color={'blue'} /> :
            competitorAnalysisViewOpen  && (
              <View  style={styles.tagCloudContainer}>


              </View>

            ) 
      }
    </ScrollView>
  );
};

// Export the component
export default llamaContent;

