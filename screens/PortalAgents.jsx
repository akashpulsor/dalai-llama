// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { useGetPortalsQuery, useAddPortalMutation, useValidateUrlMutation  } from '../component/authApi'; // Assuming you have portalApi
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
  useValidateUrlMutation();
  const [addPortal, { isLoading: addingPortal }] = useAddPortalMutation();

// React to changes in validation data
useEffect(() => {
  if (validationData) {
    // Handle successful validation
    console.log('URL validation result:', validationData);
    // Update your UI based on validation results
  }
  console.log('Configured portal', portals);
  if (validationError) {
    setErrorMessage('Error validating URL');
    setShowError(true);
  }
}, [validationData, validationError, portals]);

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
          setErrorMessage('We have not opened our Agent for this portal. We are working on it...');
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

export default PortalAgents;