import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGetPortalsQuery, useAddPortalMutation, useValidateUrlMutation } from '../component/authApi';
import { selectUser } from '../component/authSlice';
import { useSelector } from 'react-redux';

const PortalAgents = ({ navigation }) => {
  const user = useSelector(selectUser);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [unConfiguredPortal, setUnConfiguredPortal] = useState([]);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState(null);
  const [websiteName, setWebsiteName] = useState('');
  const [validatedUrl, setValidatedUrl] = useState('');

  const [allowedOrigins, setAllowedOrigins] = useState([
    'https://naukri.com',
    'https://your-trusted-domain-2.net',
    'https://another-safe-site.org',
  ]);

  const { data: portals, isLoading: portalsLoading, error: portalsError, refetch: refetchPortals } = useGetPortalsQuery({ businessId: user?.id });
  const [validateUrl, { data: validationData, isLoading: validating, error: validationError }] = useValidateUrlMutation();
  const [addPortal, { isLoading: addingPortal, isSuccess: addPortalSuccess }] = useAddPortalMutation();

  // Reset form function to clear all form-related states
  const resetForm = () => {
    setUrl('');
    setValidatedUrl('');
    setIsValidUrl(false);
    setWebsiteLogo(null);
    setWebsiteName('');
    setErrorMessage('');
    setShowError(false);
  };

  // React to changes in validation data
  useEffect(() => {
    console.log('Validation data:', validationData);
    console.log('Validation error:', validationError);
    
    if (validationData && !validationError) {
      console.log('Adding to unconfigured portal:', validatedUrl, websiteLogo, websiteName);
      
      // Make sure we have all the required data before adding to unconfigured portals
      if (validatedUrl && websiteLogo && websiteName && isValidUrl) {
        const newPortal = {
          url: validatedUrl,
          logo: websiteLogo,
          name: websiteName
        };
        
        // Check if this portal is already in the unConfiguredPortal list
        const portalExists = unConfiguredPortal.some(portal => portal.url === newPortal.url);
        
        if (!portalExists) {
          console.log('Setting new unconfigured portal:', newPortal);
          // Use a callback to ensure we're working with the latest state
          setUnConfiguredPortal(prevPortals => {
            const updatedPortals = [...prevPortals, newPortal];
            console.log('Updated unconfigured portals:', updatedPortals);
            return updatedPortals;
          });
        }
        
        // Reset form after successfully adding to unConfiguredPortal
        resetForm();
      }
    }
    
    if (validationError) {
      setErrorMessage('Error validating URL');
      setShowError(true);
    }
  }, [validationData, validationError]);

  // Handle addPortal success
  useEffect(() => {
    if (addPortalSuccess) {
      // Refetch configured portals
      refetchPortals();
      
      // Remove the configured portal from unConfiguredPortal list
      if (validatedUrl) {
        setUnConfiguredPortal(prevPortals => 
          prevPortals.filter(portal => portal.url !== validatedUrl)
        );
      }
      
      // Reset the validated URL
      setValidatedUrl('');
    }
  }, [addPortalSuccess, refetchPortals, validatedUrl]);

  // Debugging for unConfiguredPortal state
  useEffect(() => {
    console.log('Unconfigured portals updated:', unConfiguredPortal);
  }, [unConfiguredPortal]);

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
      const name = domain.replace(/^www\./, '');
      setWebsiteName(name);
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      setWebsiteLogo(logoUrl);
      console.log(`Got logo for ${name}: ${logoUrl}`);
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
    setWebsiteName('');
    setErrorMessage('');
    setShowError(false);

    let formattedUrl = url;
    if (!url.startsWith('http')) {
      formattedUrl = 'https://' + url;
    }

    if (isValidURLFormat(formattedUrl)) {
      try {
        const origin = new URL(formattedUrl).origin;
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin) || true) { // Remove "|| true" in production to enforce whitelist
          const logoSuccess = await getWebsiteLogo(formattedUrl);
          
          if (logoSuccess) {
            setValidatedUrl(formattedUrl);
            setIsValidUrl(true);
            // Call validateUrl for API integration
            validateUrl({ url: formattedUrl, businessId: user?.id });
          } else {
            setIsValidUrl(false);
            setErrorMessage("Couldn't fetch website information. Please check the URL.");
            setShowError(true);
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
      setErrorMessage('Invalid URL format. Please enter a valid URL.');
      setShowError(true);
    }

    setIsLoading(false);
  };

  const handlePortalPress = (portalUrl) => {
    navigation.navigate('WebViewScreen', { websiteUrl: portalUrl, allowedOrigins });
  };
  
  // Function to configure an unconfigured portal
  const handleConfigurePortal = (portal) => {
    // Call the addPortal mutation to add this portal to configured portals
    addPortal({ 
      url: portal.url, 
      logo: portal.logo, 
      name: portal.name, 
      businessId: user?.id 
    });
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
            disabled={validating }
          >
            {(validating ) ? (
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

      {/* Unconfigured Portals Section */}
      {unConfiguredPortal.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Unconfigured Portals</Text>
          <ScrollView style={styles.portalsContainer} horizontal={true}>
            {unConfiguredPortal.map((portal, index) => (
              <View key={`${portal.url}-${index}`} style={styles.portalItemContainer}>
                <TouchableOpacity
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
          
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Configured Portals Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Configured Portals</Text>
        <ScrollView style={styles.portalsContainer}>
          {portalsLoading ? (
            <ActivityIndicator size="large" />
          ) : portalsError ? (
            <Text>Error loading portals.</Text>
          ) : portals && portals.length > 0 ? (
            portals.map((portal) => (
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
            ))
          ) : (
            <Text style={styles.emptyText}>No configured portals yet.</Text>
          )}
        </ScrollView>
      </View>
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
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 45,
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
    marginLeft: 10,
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
  sectionContainer: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingLeft: 5,
  },
  portalsContainer: {
    marginTop: 10,
    maxHeight: 250,
  },
  portalItemContainer: {
    flexDirection: 'row',
    margin:'5%',
    alignItems: 'center',
    marginBottom: 10,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  configureButton: {
    backgroundColor: '#34a853',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  configureButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  portalLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  portalName: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
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
  validatedContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#d1e3ff',
  }
});

export default PortalAgents;