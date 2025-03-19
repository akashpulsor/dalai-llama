// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { useGetPortalsQuery, useAddPortalMutation, useLazyValidateUrlQuery  } from '../component/authApi'; // Assuming you have portalApi
import { WebView } from 'react-native-webview';
import {selectUser} from '../component/authSlice';
import { useSelector } from 'react-redux';

const PortalAgents = ({ navigation }) => {
  const user =  useSelector(selectUser);
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [websiteName, setWebsiteName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const webviewRef = useRef(null);
  const [allowedOrigins, setAllowedOrigins] = useState([
    'https://naukri.com',
    'https://your-trusted-domain-2.net',
    'https://another-safe-site.org',
  ]);

  const { data: portals, isLoading: portalsLoading, error: portalsError } = useGetPortalsQuery({businessId: user?.id});
// Import the trigger version of the query
  const [validateUrl, { data: validationData, isLoading: validating, error: validationError }] = 
  useLazyValidateUrlQuery();
  const [addPortal, { isLoading: addingPortal }] = useAddPortalMutation();

// React to changes in validation data
useEffect(() => {
  if (validationData) {
    // Handle successful validation
    console.log('URL validation result:', validationData);
    // Update your UI based on validation results
  }
  
  if (validationError) {
    setErrorMessage('Error validating URL');
    setShowError(true);
  }
}, [validationData, validationError]);

  const isValidURLFormat = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const getWebsiteLogo = async (websiteUrl) => {
    try {
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.hostname;
      setWebsiteName(domain.replace(/^www\./, ''));
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      setWebsiteLogo(logoUrl);
      return true;
    } catch (error) {
      console.error('Error fetching website logo:', error);
      return false;
    }
  };

  const handleValidateUrl = async () => {
    if (!url) {
      setErrorMessage('Error Please enter a URL.');
      setShowError(true);
      return;
    }

    setIsLoading(true);
    setIsValidUrl(false);
    setWebsiteLogo(null);
    setErrorMessage('');
    setShowError(false);

    let formattedUrl = url;
    if (!url.startsWith('http')) {
      formattedUrl = 'https://' + url;
    }

    if (isValidURLFormat(formattedUrl)) {
      try {
        const origin = new URL(formattedUrl).origin;
        if (allowedOrigins.includes(origin)) {
          const logoSuccess = await getWebsiteLogo(formattedUrl);
          setIsValidUrl(logoSuccess);
          if (logoSuccess) {
            validateUrl({ url: formattedUrl, businessId: user?.id });
          } else {
            Alert.alert('Warning', 'Couldn\'t fetch logo');
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
      setErrorMessage('Invalid URL format');
      setShowError(true);
    }

    setIsLoading(false);
  };

  const handlePortalPress = (portalUrl) => {
    navigation.navigate('WebViewScreen', { websiteUrl: portalUrl, allowedOrigins });
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
            disabled={isLoading || addingPortal}
          >
            {(isLoading || addingPortal) ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.validateButtonText}>Add Portal</Text>
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

      <ScrollView style={styles.portalsContainer}>
        {portalsLoading ? (
          <ActivityIndicator size="large" />
        ) : portalsError ? (
          <Text>Error loading portals.</Text>
        ) : portals && portals.map((portal) => (
          <TouchableOpacity
            key={portal.url}
            style={styles.portalButton}
            onPress={() => handlePortalPress(portal.url)}
          >
            <Image
              source={{ uri: portal.logo }}
              style={styles.portalLogo}
              resizeMode="contain"
            />
            <Text style={styles.portalName}>{portal.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    marginTop: 60,
    alignItems: 'flex-start',
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