// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, TextInput, Modal, Alert, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useLoginMutation, useRegisterMutation } from '../component/authApi';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Assuming you want to use Ionicons

// Create your functional component
const PortalAgents = ({ navigation }) => {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [websiteName, setWebsiteName] = useState('');
  const webviewRef = useRef(null);
  const [allowedOrigins, setAllowedOrigins] = useState([
    'https://your-trusted-domain-1.com',
    'https://your-trusted-domain-2.net',
    'https://another-safe-site.org',
    // Add more allowed origins here
  ]);

  useEffect(() => {
    // You can load allowed origins from a config file or API here if needed
  }, []);

  // Function to validate URL format
  const isValidURLFormat = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Function to check if website is reachable
  const isWebsiteReachable = async (websiteUrl) => {
    try {
      // Ensure URL has protocol
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }

      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Attempt to fetch the website with HEAD request
      const response = await fetch(websiteUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      // Check if response status is in the 2xx range (success)
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Error checking website reachability:', error);
      return false;
    }
  };

  // Function to get favicon/logo from a website
  const getWebsiteLogo = async (websiteUrl) => {
    try {
      // Ensure URL has protocol
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }

      // Extract domain from URL
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.hostname;

      // Set website name from domain (remove www. if present)
      setWebsiteName(domain.replace(/^www\./, ''));

      // Use Google's favicon service to get the favicon
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      setWebsiteLogo(logoUrl);
      return true;
    } catch (error) {
      console.error('Error fetching website logo:', error);
      return false;
    }
  };

  // Handle the click button press
  const handleValidateUrl = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setIsLoading(true);
    setIsValidUrl(false); // Reset validity on new check
    setWebsiteLogo(null);
    setErrorMessage('');
    setShowError(false);

    // Check URL format first
    let formattedUrl = url;
    if (!url.startsWith('http')) {
      formattedUrl = 'https://' + url;
    }

    if (isValidURLFormat(formattedUrl)) {
      // Check if the website is reachable
      const isReachable = await isWebsiteReachable(formattedUrl);

      if (isReachable) {
        // Check if the origin is in the allowed list
        try {
          const origin = new URL(formattedUrl).origin;
          if (allowedOrigins.includes(origin)) {
            // If reachable and origin is allowed, get the logo and set valid
            const logoSuccess = await getWebsiteLogo(formattedUrl);
            setIsValidUrl(logoSuccess);
            if (!logoSuccess) {
              Alert.alert('Warning', 'Website is reachable and origin is allowed but couldn\'t fetch logo');
            }
          } else {
            setIsValidUrl(false);
            setErrorMessage('This website origin is not on the allowed list.');
            setShowError(true);
          }
        } catch (error) {
          setIsValidUrl(false);
          setErrorMessage('Error parsing URL origin.');
          setShowError(true);
          console.error('Error parsing URL:', error);
        }
      } else {
        setIsValidUrl(false);
        setErrorMessage('Website is not reachable. Please check the URL or your internet connection.');
        setShowError(true);
      }
    } else {
      setIsValidUrl(false);
      setErrorMessage('Invalid URL format');
      setShowError(true);
    }

    setIsLoading(false);
  };

  const handleOpenWebView = () => {
    if (isValidUrl && url) {
      // Navigate to a screen with the WebView, passing the URL
      navigation.navigate('WebViewScreen', { websiteUrl: url, allowedOrigins });
    } else {
      Alert.alert('Error', 'Please validate a valid and allowed URL first.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainerWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter website URL"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={styles.validateButton}
            onPress={handleValidateUrl}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.validateButtonText}>Click</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Checking website availability and origin...</Text>
        </View>
      )}

      {isValidUrl && websiteLogo && (
        <View style={styles.resultContainer}>
          <TouchableOpacity style={styles.websiteButton} onPress={handleOpenWebView}>
            <Image
              source={{ uri: websiteLogo }}
              style={styles.websiteLogo}
              resizeMode="contain"
            />
            <Text style={styles.websiteName}>{websiteName}</Text>
            <Ionicons name="arrow-forward-outline" size={24} color="#444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    padding: 20,
  },
  inputContainerWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12, // Increased border radius for a softer look
    elevation: 5, // More pronounced shadow for Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: 'center',
    paddingHorizontal: 15, // More horizontal padding
    paddingVertical: 10,   // More vertical padding
  },
  input: {
    flex: 1,
    height: 45, // Slightly increased height
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 12,
  },
  validateButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 18,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10, // Space between input and button
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  resultContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  websiteLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  websiteName: {
    fontSize: 18,
    color: '#333',
    marginRight: 10,
  },
  errorContainer: {
    backgroundColor: '#ffe0e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderColor: '#ffcdd2',
    borderWidth: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
});

// Create a separate screen for the WebView
const WebViewScreen = ({ route }) => {
  const { websiteUrl, allowedOrigins } = route.params;
  const webviewRef = useRef(null);

  const handleWebViewMessage = (event) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', messageData);
      // Handle messages from the WebView (e.g., automation status)
    } catch (error) {
      console.log('Received message from WebView:', event.nativeEvent.data);
    }
  };

  const handleNavigationStateChange = (navState) => {
    console.log('WebView navigation state changed:', navState);
    // You might want to track URL changes here
  };

  // Function to inject JavaScript into the WebView
  const injectJavaScript = (code) => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        (function() {
          try {
            ${code}
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: error.message, stack: error.stack }));
          }
        })();
      `);
    } else {
      console.warn('WebView ref not available, cannot inject JavaScript.');
    }
  };

  useEffect(() => {
    // Example of injecting JavaScript after the WebView loads
    injectJavaScript(`
      console.log('WebView loaded on client-side.');
      // You can add your initial automation script here or trigger it from the React Native side
    `);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={{ uri: websiteUrl }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={allowedOrigins} // This is for the WebView's own requests
      />
      {/* You can add UI elements here to control the WebView or trigger JavaScript injection */}
      <TouchableOpacity
        style={{ position: 'absolute', bottom: 20, left: 20, backgroundColor: 'blue', padding: 10, borderRadius: 5, elevation: 3 }}
        onPress={() => injectJavaScript(`alert('Hello from React Native!');`)}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Inject Alert</Text>
      </TouchableOpacity>
      {/* Add more buttons or inputs to control automation */}
    </View>
  );
};

// Export the components
export { WebViewScreen };
export default PortalAgents;