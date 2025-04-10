import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or any other icon library
import countryData from '../helper/countryData'; // Import country data

const BotCampaign = () => {
    const [creative, setCreative] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [isImageResponse, setIsImageResponse] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { type: 'request', content: 'What is the weather today?' },
        { type: 'response', content: 'It is sunny and 25°C.' },
        { type: 'request', content: 'Generate an image of a cat.' },
        { type: 'response', content: 'https://via.placeholder.com/150', isImage: true },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [savedImages, setSavedImages] = useState([]);
    const [attachedFile, setAttachedFile] = useState(null);
    const [isBotRegistered, setIsBotRegistered] = useState(false);
    const [isChatCollapsed, setIsChatCollapsed] = useState(false); // For collapsing chat
    const [isFullScreen, setIsFullScreen] = useState(false); // For fullscreen toggle
    const [isRegisterBotModalVisible, setIsRegisterBotModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(countryData[0]); // Default to the first country
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isCountryDropdownVisible, setIsCountryDropdownVisible] = useState(false);
    const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

    const scrollViewRef = useRef();
    const savedImagesScrollViewRef = useRef(); // Ref for saved images scroll view

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [chatHistory]);

    const handleCreativeUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (result.type === 'success') setCreative(result);
        } catch {
            Alert.alert('Error', 'Failed to upload creative.');
        }
    };

    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true
            });

            console.log('DocumentPicker result:', result);

            if (!result.canceled) {  // Check for canceled instead of type
                const file = result.assets[0];  // Get the first selected file
                
                // Create new message object for chat
                const newMessage = {
                    type: 'request',
                    content: file.uri,
                    isImage: true,
                    name: file.name
                };

                console.log('New message object:', newMessage);

                // Add to chat history
                setChatHistory(prevHistory => {
                    const updatedHistory = [...prevHistory, newMessage];
                    console.log('Updated chat history:', updatedHistory);
                    return updatedHistory;
                });

                // Scroll to bottom
                setTimeout(() => {
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                }, 100);
            }
        } catch (error) {
            console.error('File upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
        }
    };

    const handleGenerateCreativeWithPrompt = () => {
        const simulatedResponse = prompt.includes('image')
            ? { type: 'image', content: 'https://via.placeholder.com/150' }
            : { type: 'text', content: 'Generated text content based on your prompt.' };

        setResponse(simulatedResponse.content);
        setIsImageResponse(simulatedResponse.type === 'image');
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const newRequest = { type: 'request', content: newMessage };
        const simulatedResponse = newMessage.toLowerCase().includes('image')
            ? { type: 'response', content: 'https://via.placeholder.com/150', isImage: true }
            : { type: 'response', content: `This is a response to: ${newMessage}` };

        setChatHistory(prev => [...prev, newRequest, simulatedResponse]);
        setNewMessage('');
    };

    const handleCopyText = (text) => {
        Clipboard.setStringAsync(text);
        Alert.alert('Copied', 'Text copied to clipboard.');
    };

    const handleSaveImage = (imageUrl) => {
        setSavedImages((prev) => [...prev, imageUrl]);
        Alert.alert('Save Image', `Image saved from URL: ${imageUrl}`);
        // Scroll to the end of the saved images scroll view
        setTimeout(() => {
            savedImagesScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200); // Delay to ensure the image is added before scrolling

        // Scroll to the last message in the chat
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
    };

    const handleRegisterBot = () => {
        setIsBotRegistered(true);
        Alert.alert('Success', 'Bot registered successfully!');
    };

    const handleSaveChat = () => {
        Alert.alert('Success', 'Chat saved successfully!');
    };

    const toggleChatCollapse = () => {
        if (!isFullScreen) {
            setIsChatCollapsed((prev) => !prev);
            if (!isChatCollapsed && scrollViewRef.current) {
                setTimeout(() => {
                    scrollViewRef.current.scrollToEnd({ animated: true });
                }, 100); // Ensure proper scrolling when expanding
            }
        }
    };

    const handleRegisterBotSubmit = () => {
        const phoneRegex = /^\d{10}$/; // Validate only the 10-digit mobile number
        if (!whatsappNumber.trim()) {
            setErrorMessage('Please enter your WhatsApp number.');
            return;
        }
        if (!phoneRegex.test(whatsappNumber)) {
            setErrorMessage('Invalid number. Enter a valid 10-digit mobile number.');
            return;
        }
        Alert.alert('Success', `WhatsApp bot registered for: ${selectedCountry.code} ${whatsappNumber}`);
        setIsRegisterBotModalVisible(false);
        setWhatsappNumber('');
        setErrorMessage('');
    };

    const handleWhatsappNumberChange = (text) => {
        const validInput = /^\d*$/; // Allow only digits
        if (!validInput.test(text)) {
            setErrorMessage('Only numbers are allowed.');
        } else {
            setErrorMessage(''); // Clear error if input is valid
        }
        setWhatsappNumber(text);
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setIsCountryModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {/* Bot Chat Section */}
            <View
                style={[
                    styles.chatSection,
                    isFullScreen && styles.chatSectionFullScreen, // Apply fullscreen styles if enabled
                ]}
            >
                <View style={styles.chatHeader}>
                    <Text style={styles.chatHeaderText}>Generate Creative</Text> {/* Updated label */}
                    <View style={styles.chatHeaderIcons}>
                        <TouchableOpacity onPress={() => setIsFullScreen(!isFullScreen)}>
                            <Icon name={isFullScreen ? 'compress' : 'expand'} size={20} color="#fff" />
                        </TouchableOpacity>
                        {!isFullScreen && (
                            <TouchableOpacity onPress={toggleChatCollapse}>
                                <Icon name={isChatCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {!isChatCollapsed && (
                    <View style={styles.chatContent}>
                        <ScrollView
                            style={styles.chatContainer}
                            contentContainerStyle={styles.chatContentContainer}
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                        >
                            {chatHistory.map((item, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.chatBubble,
                                        item.type === 'request'
                                            ? styles.requestBubble
                                            : styles.responseBubble,
                                        item.isImage && { backgroundColor: 'transparent' }
                                    ]}
                                >
                                    {item.isImage ? (
                                        <View style={styles.chatImageWrapper}>
                                            <Image
                                                source={{ uri: item.content }}
                                                style={styles.chatImage}
                                                resizeMode="contain"
                                            />
                                            <TouchableOpacity
                                                style={styles.saveImageIcon}
                                                onPress={() => handleSaveImage(item.content)}
                                            >
                                                <Icon name="save" size={20} color="#007AFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text style={styles.chatText}>{item.content}</Text>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                        <View
                            style={[
                                styles.inputWrapper,
                                isFullScreen && styles.inputWrapperFullScreen,
                            ]}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder="Type your message..."
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline={true} // Allow multiline input
                            />
                            <View style={styles.inputIcons}>
                                <TouchableOpacity style={styles.inputIcon} onPress={handleFileUpload}>
                                    <Icon name="paperclip" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.inputIcon} onPress={handleSendMessage}>
                                    <Icon name="send" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Saved Images Section */}
            <View style={styles.savedImagesSection}>
                <Text style={styles.sectionTitle}>Saved Images</Text>
                <ScrollView
                    contentContainerStyle={styles.savedImagesGrid}
                    ref={savedImagesScrollViewRef}
                >
                    {savedImages.map((imageUrl, index) => (
                        <View key={index} style={styles.savedImageTile}>
                            <Image source={{ uri: imageUrl }} style={styles.savedImage} />
                            <TouchableOpacity
                                style={styles.runCampaignButton}
                                onPress={() => Alert.alert('Campaign Started')}
                            >
                                <Text style={styles.runCampaignButtonText}>Run Campaign</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.savedImagesActions}>
                    <TouchableOpacity
                        style={styles.registerBotButton}
                        onPress={() => setIsRegisterBotModalVisible(true)}
                    >
                        <Text style={styles.registerBotButtonText}>Register Bot</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Register Bot Modal */}
            <Modal
                visible={isRegisterBotModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsRegisterBotModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Register WhatsApp Bot</Text>
                        <Text style={styles.modalInfo}>
                            Select your country and enter your 10-digit WhatsApp number.
                        </Text>

                        {/* Country and Phone Number Row */}
                        <View style={styles.countryPhoneRow}>
                            {/* Country Selection */}
                            <TouchableOpacity
                                style={styles.countryDropdown}
                                onPress={() => setIsCountryModalVisible(true)}
                            >
                                <Text style={styles.countryDropdownText}>
                                    {selectedCountry.flag} {selectedCountry.code}
                                </Text>
                            </TouchableOpacity>

                            {/* Mobile Number Input */}
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="10-digit number"
                                keyboardType="phone-pad"
                                value={whatsappNumber}
                                onChangeText={handleWhatsappNumberChange}
                            />
                        </View>
                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleRegisterBotSubmit}
                            >
                                <Text style={styles.modalButtonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => {
                                    setIsRegisterBotModalVisible(false);
                                    setErrorMessage(''); // Clear error message on cancel
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Country Selection Modal */}
            <Modal
                visible={isCountryModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsCountryModalVisible(false)}
            >
                <View style={styles.centeredModalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Country</Text>
                        <ScrollView style={styles.countryList}>
                            {countryData.map((country) => (
                                <TouchableOpacity
                                    key={country.code}
                                    style={styles.countryItem}
                                    onPress={() => handleCountrySelect(country)}
                                >
                                    <Text style={styles.countryItemText}>
                                        {country.flag} {country.country} ({country.code})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsCountryModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d3d3d3',
        padding: 10,
    },
    chatSection: {
        position: 'absolute', // Position the chat section absolutely
        bottom: 20, // Distance from the bottom of the screen
        right: 20, // Distance from the right of the screen
        width: 350, // Increased width
        maxHeight: 500, // Increased height
        backgroundColor: '#d3d3d3',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 10, // Ensure it appears above other elements
    },
    chatSectionFullScreen: {
        position: 'absolute',
        top: '5%', // Reduce top margin
        left: '5%',
        right: '5%',
        bottom: '5%', // Reduce bottom margin
        width: '90%',
        height: '90%', // Adjust height to reduce extra space
        backgroundColor: '#d3d3d3',
        borderRadius: 15, // Decent border radius
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10, // Elevation for Android
        zIndex: 10,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#007AFF',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    chatHeaderIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    chatHeaderText: {
       
        fontSize: 16,
        color: '#fff',
    },
    chatContent: {
        padding: 10,
    },
    chatContainer: {
        maxHeight: 300, // Adjust the height to fit within the chat section
    },
    chatContentContainer: {
        paddingVertical: 10,
    },
    chatBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
    },
    requestBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        color: '#fff',
    },
    responseBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#f1f1f1',
    },
    chatText: {
        fontSize: 14,
    },
    chatImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#fff', // Solid background
        borderRadius: 10, // Rounded corners
        padding: 10, // Padding for better spacing
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8, // Elevation for Android
        width: '95%', // Default width
        alignSelf: 'center', // Center horizontally
    },
    inputWrapperFullScreen: {
        width: '96%', // Adjusted width for expanded state to prevent overflow
        height: 120, // Increased height for expanded state
        alignSelf: 'center', // Ensure it remains centered
    },
    input: {
        flex: 1,
        borderWidth: 0,
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f9f9f9',
        height: '100%', // Fill the height of the wrapper
        textAlignVertical: 'top', // Align text to the top for multiline input
    },
    inputIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        right: 10, // Position icons inside the text box
        bottom: 10,
    },
    inputIcon: {
        marginLeft: 10,
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
    },
    savedImagesSection: {
        flex: 1,
        marginBottom: 20,
        backgroundColor: '#d3d3d3', // Updated background color
        borderRadius: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    savedImagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    savedImageTile: {
        width: 400, // Increased width
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20, // Add more space between tiles
        padding: 10, // Add padding to ensure content fits well
    },
    savedImage: {
        width: '100%', // Adjusted to fit within the tile
        height: 300, // Fixed height for the image
        borderRadius: 8,
    },
    runCampaignButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10, // Adjust padding for better fit
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10, // Add margin to separate from the image
        width: '90%', // Ensure the button fits within the tile
    },
    chatImageWrapper: {
        position: 'relative',
    },
    saveImageIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        elevation: 3,
    },
    savedImagesActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerBotButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    registerBotButtonText: {
        color: '#fff',
        fontSize: 16,
        
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '40%',
        backgroundColor: '#d3d3d3',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalInfo: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalCancelButton: {
        backgroundColor: '#FF3B30',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
    countryDropdown: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    countryDropdownText: {
        fontSize: 16,
        color: '#333',
    },
    countryDropdownList: {
        maxHeight: 150,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    countryDropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    countryDropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    countryPhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    countryDropdown: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
        backgroundColor: '#fff',
    },
    countryDropdownText: {
        fontSize: 16,
        color: '#333',
    },
    phoneInput: {
        flex: 2,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
    },
    centeredModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    countryList: {
        marginTop: 10,
        maxHeight: 200,
    },
    countryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    countryItemText: {
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        marginTop: 10,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BotCampaign;