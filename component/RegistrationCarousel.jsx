import React, { useState, useRef, useEffect, Platform } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity, ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';

import DropDownPicker from 'react-native-dropdown-picker';
import CountryCodeDropdownPicker from './CountryCodeDropdownPicker';
import Button from './Button';
import { useGetCompanySizeQuery, useRegisterMutation } from './authApi';
import Error from './Error';
import countryData from '../helper/countryData';

const { width } = Dimensions.get('window');

const ProgressBar = ({ progress }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: progress === 100 ? '#34C759' : '#007AFF' }]} />
  </View>
);

const RegistrationCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',

    countryCode: 'US',
    countryCallingCode: '1',

    companyName: '',
    companySize: '',
    activityDescription:'',

    password: '',
    confirmPassword: '',
  });


  const [countryCallingCode, setCountryCallingCode] = useState('+1');
  const [countryCode, setCountryCode] = useState('US');
  const [phone, setPhone] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorText, setErrorText] = useState('');


  const [sectionProgress, setSectionProgress] = useState({
    section1: 0,
    section2: 0,
    section3: 0,
  });

  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const [registerMutation, { data: registerData, isLoading:isRegistrationLoading, isSuccess:isRegistrationSuccess, isError:isRegistrationError, error:registrationError }] = useRegisterMutation();
  const  { data: companyData, isLoading: isCompanySizeLoading, isSuccess: isCompanySizeSuccess, isError: isCompanySizeError, error: companySizeerror } = useGetCompanySizeQuery();
  const [data, setData] = useState(companyData);
  const calculateSectionProgress = () => {
    // Section 1 Progress (Personal Information)
    const section1Fields = ['name','email', 'phone'];
    const section1Progress = section1Fields.filter(field => formData[field] && formData[field].length > 0).length / section1Fields.length;

    // Section 2 Progress (Contact Details)
    const section2Fields = ['company name', 'company size', 'activity description'];
    const section2Progress = section2Fields.filter(field => formData[field] && formData[field].length > 0).length / section2Fields.length;

    // Section 3 Progress (Account Setup)
    const section3Fields = [ 'password', 'confirmPassword'];
    const section3Progress = section3Fields.filter(field => formData[field] && formData[field].length > 0).length / section3Fields.length;

    setSectionProgress({
      section1: section1Progress * 100,
      section2: section2Progress * 100,
      section3: section3Progress * 100,
    });
  };

  useEffect(() => {
    calculateSectionProgress();
    if(isRegistrationError){
        console.log(registrationError);
        setShowError(true);
        setErrorText(registrationError);
    }

    if(isCompanySizeSuccess) {
        setData(companyData);
    }
  }, [formData,isRegistrationLoading, isRegistrationSuccess, isRegistrationError, companyData, isCompanySizeLoading, isCompanySizeSuccess, isCompanySizeError,  companySizeerror]);

  const totalProgress = (sectionProgress.section1 + sectionProgress.section2 + sectionProgress.section3) / 3;

  const onRegisterationPress = async () =>{
    try {
        console.log(countryCode);
        let body = {
            
                "name":formData.name,
                "businessName":formData.companyName,
                "email": formData.email,
                "password":formData.password,
                "mobile": phone,
                "countryCallingCode": countryCallingCode,
                "countryCode": countryCode,
                "companySize":companySizeValue,
                "basicActivityDescription": formData.activityDescription
         
        }
        
        body = JSON.stringify(body);

        await registerMutation(body);
      } catch (e) {
        setShowError(true);
        console.log(e);
        setErrorText('An error occurred. Please try again.');
      }
  }


  

  const [showCompanySize, setShowCompanySize] = useState(false);
  const [companySizeValue, setCompanySizeValue] = useState('');



  const handleCountrySelect = (selectedCountryCode) => {
    // Find the selected country from countryData
    const selectedCountry = countryData.find(item => item.code === selectedCountryCode);
    if (selectedCountry) {
        console.log("BBBBBB" + selectedCountry.country);
      setCountryCode(selectedCountry.country);    // Set the country code (e.g., 'US')
      setCountryCallingCode(selectedCountry.code);    // Set the calling code (e.g., '+1')
    }
  };

  
  const slides = [
    {
      title: 'Personal Information',
      content: (
        <View style={styles.slideContent}>
            
            <View style={{
    height: 50, 
    width: '120%',
    marginTop:'2%',
    // fixed height for all input containers
    marginBottom: 10,
    zIndex: 1, // lower than dropdown
            }}>
                <TextInput
                    style={[styles.input,{width:'100%'}]}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter your  name"
                />
            </View>
            <View style={{
    width: '120%',
    marginTop:'2%',
    height: 50, // fixed height for all input containers
    marginBottom: 10,
    zIndex: 1, // lower than dropdown
            }}>
                <TextInput
                style={[styles.input,{width:'100%'}]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your  email"
            />
            </View>
          
         <View style={{
    width: '100%',
    height: 50, // same height as other inputs
    marginBottom: 10,
    zIndex: 2, // higher than other elements
    position: 'relative',
  }}> 
                      <CountryCodeDropdownPicker
                onSelectCountry={handleCountrySelect}
                value={phone}
                onChangeText={setPhone}/>
         </View>
          <ProgressBar progress={sectionProgress.section1} />
        </View>
      ),
    },
    {
      title: 'Company Details',
      content: (
        <View style={styles.slideContent}>
              <View style={{
    width: '150%',
    marginTop:'2%',
    height: 50, 

    // fixed height for all input containers
    marginBottom: 10,
    zIndex: 1, // lower than dropdown
            }}>
                <TextInput
                    style={[styles.input,{width:'100%'}]}
                    value={formData.companyName}
                    onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                    placeholder="Company Name"
                />
            </View>
            <View style={{
    width: '150%',
    marginTop:'2%',
    height: 50, // fixed height for all input containers
    marginBottom: 10,
    zIndex: 1, // lower than dropdown
            }}>
                <TextInput
                style={[styles.input,{width:'100%'}]}
                value={formData.activityDescription}
                onChangeText={(text) => setFormData({ ...formData, activityDescription: text })}
                placeholder="Activity Description"
            />
            </View>
          
  
            <View style={{
                width: '100%',
                height: 50, // same height as other inputs
                marginBottom: 10,
                zIndex: 2, // higher than other elements
                position: 'relative',
            }}>

                <DropDownPicker
                    open={showCompanySize}
                    value={companySizeValue}
                    items={data}
                    setOpen={setShowCompanySize}
                    setValue={(value) => {
                        setCompanySizeValue(value);
                        setFormData((prevFormData) => ({
                        ...prevFormData,
                        companySize: value,
                        }));
                    }}
                    setItems={setData}
                    onSelectItem={(item) => {
                        setCompanySizeValue(item.value);
                        setFormData((prevFormData) => ({
                        ...prevFormData,
                        companySize: item.value,
                        }));
                        console.log(companySizeValue)
                    }}
                    dropDownStyle={{
                        width: '100%',
                        position: 'absolute',
                        top: '100%', // Position right below the input
                        left: 0,
                        backgroundColor: '#d3d3d3',
                        borderWidth: 1,
                        borderColor: '#ccc',
                        zIndex: 999,
                        maxHeight: '100vh', // This will make it stretch to the bottom of the view
                        overflow: 'auto'
                      }}
           
                    placeholder="Select a company size"
                    placeholderStyle={styles.dropdownPlaceholder}
                />   
            </View> 

          <ProgressBar progress={sectionProgress.section2} />
        </View>
      ),
    },
    //TODO fix the button styles
    {
      title: 'Account Set Up',
      content: (
        <View style={styles.slideContent}>
            {showError && <Error errorText={errorText}/>}
            {isRegistrationSuccess && <Text style={{color:"green"}}>Registered SuccessFully</Text> }
            <View style={{
                    width: '160%',
                height: 50, 
                // fixed height for all input containers

                marginBottom: 10,
                zIndex: 1, // lower than dropdown
                        }}>
                    <TextInput
                        style={[styles.input,{width:'100%'}]}
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        placeholder="Password"
                        secureTextEntry={true}
                    />
            </View>
            
            <View style={{
                width: '160%',
                height: 50, 
                // fixed height for all input containers
                marginBottom: 10,
                zIndex: 1, // lower than dropdown
                        }}>
                <TextInput
                    style={[styles.input,{width:'100%'}]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                    placeholder="Confirm Password"
                    secureTextEntry={true}
                />
            </View>

      {isRegistrationLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <Button mode="contained" onPress={onRegisterationPress} disabled={isRegistrationLoading}>
          Register
        </Button>
      )}
          
            <ProgressBar progress={sectionProgress.section3} />
        </View>
      ),
    },
  ];

  const scrollTo = (index) => {

    //slidesRef.current.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };



  return (
    <View style={styles.centeredView}>
        <Text style={styles.headerText}>{slides[activeIndex].title}</Text>


        {slides.map((slide, index) => (
          activeIndex==index && <View key={index}>
            {slide.content}
          </View>
        ))}

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive,
              ]}
              onPress={() => scrollTo(index)}
            />
          ))}
        </View>



      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centeredView: {
      flex: 1,

      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
  },
  header: {
    padding: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    marginTop:'1%',
    marginBottom:'1%',
    fontSize: 24,
    fontWeight: 'bold',
  },
  slide: {
    width,
    padding: 10,
  },
  slideContent: {
    flex: 1,
    position: 'relative',                                       
    justifyContent:'center',
    alignItems:'center',


  },    
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  flagButtonStyle: {
    flex:.2,
    
  },
  countryPickerButtonStyleStyle: {
    flex:.4,

  },
  input: {
    width:'150%',
    borderWidth: 1,
    marginTop:8,
    borderColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  paginationDot: {
    width: 10,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  totalProgressContainer: {
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  containerStyle: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'white', // or your preferred background color
  },
  inputContainer: {
    width: '100%',
    height: 50, // fixed height for all input containers
    marginBottom: 10,
    zIndex: 1, // lower than dropdown
  },
  dropdownContainer: {
    width: '100%',
    height: 50, // same height as other inputs
    marginBottom: 10,
    zIndex: 2, // higher than other elements
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  countryCodeText: {
    fontSize: 13,
  },
  dropdown: {
    width: '100%',
    position: 'absolute',
    top: 50, // positions dropdown below the input
    left: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 999,
  },
  loadingContainer: {
    marginVertical: 20,
  }
});

export default RegistrationCarousel;