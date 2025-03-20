import React, { createRef, useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import LeadForm from '../component/LeadForm';
import { useDispatch } from 'react-redux';
import { useInterestMutation } from '../component/authApi';
import { showMessage } from '../component/flashMessageSlice';

const CurvedBackground = () => {
    return (
      <View style={styles.backgroundContainer}>
        <Svg style={styles.curve} viewBox="0 0 375 280">
          <Path
            d="M375 0H0v280c93.75 0 187.5 0 281.25 0C375 280 375 0 375 0z"
            fill="#EBF0FF"
          />
        </Svg>
      </View>
    );
};

const LandingPage = ({ navigation }) => {
    const scrollViewRef = createRef();
    const [isLeadFormVisible, setLeadFormVisible] = useState(false);
    const dispatch = useDispatch();

    const [addInterest, { 
        data: interestData, 
        isLoading: isInterestDataLoading, 
        isSuccess: isInterestDataSuccess, 
        isError: isInterestDataError, 
        error: interestDataError 
      }] = useInterestMutation();

    const handleNavClick = (sectionId) => {
        scrollViewRef.current.scrollTo({
          y: sectionPositions[sectionId],
          animated: true,
        });
    };
    
    const sectionPositions = {
        about: 0,
        features: 500,
        industry: 1000,
        benefit: 1500,
        contact: 2000,
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const handleScheduleDemo = () => {
        setLeadFormVisible(true);
    };

    const handleLeadSubmit = async (leadData) => {
        // Implement lead submission logic here
        // This could be an API call to your backend
        try{
            await addInterest(leadData);
            setLeadFormVisible(false);
            console.log('interest submitted:', leadData);
        } 
        catch(err) {
            console.error("Interest failed:", err);
        }
    };

    useEffect(() => {
        
        if(isInterestDataSuccess){
            
            dispatch(showMessage({
                message: 'Your interest is submitted, Team will contact you',
                type: 'info'
              }));
              
              setLeadFormVisible(false);
        }
    
      }, [isInterestDataSuccess]);

    return (
        <View style={styles.container}>
                <ScrollView 
                    ref={scrollViewRef} 
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image 
                                source={require('../assets/search-logo.png')} 
                                style={styles.headerLogo} 
                            />
                            <Text style={styles.headerTitle}>DALAI LLAMA</Text>
                        </View>

                        <View style={styles.navLinks}>
                            {['About', 'Features', 'Industry', 'Benefit', 'Contact'].map((link) => (
                                <TouchableOpacity 
                                    key={link} 
                                    onPress={() => handleNavClick(link.toLowerCase())}
                                >
                                    <Text style={styles.navLink}>{link}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity 
                                style={styles.loginButton} 
                                onPress={handleLogin}
                            >
                                <Text style={styles.loginButtonText}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroSection}>
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>Multi-Agent Workflow Automation</Text>
                            <Text style={styles.heroSubtitle}>Transform your business processes with AI agents!</Text>
                            
                            <View style={styles.trustIndicators}>
                                <View style={styles.trustBadge}>
                                    <Text style={styles.trustBadgeTitle}>Improved</Text>
                                    <Text style={styles.trustBadgeText}>Efficiency</Text>
                                </View>
                                <View style={styles.trustBadge}>
                                    <Text style={styles.trustBadgeTitle}>Enterprise</Text>
                                    <Text style={styles.trustBadgeText}>Ready Solution</Text>
                                </View>
                            </View>
                            
                            <Text style={styles.heroDescription}>
                                Automate complex business workflows with our intelligent multi-agent platform. Our self-improving AI agents collaborate to handle end-to-end processes, from recruitment to financial compliance, with minimal human intervention. Designed to deliver consistent results while reducing operational costs.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>Our Multi-Agent Platform</Text>
                        
                        <View style={styles.featureGrid}>
                            <View style={styles.featureCard}>
                                <Text style={styles.featureTitle}>Intelligent Workflow Orchestration</Text>
                                <Text style={styles.featureDescription}>
                                    Built on state-of-the-art Gen AI technology to coordinate multiple specialized agents that seamlessly handle complex business processes from start to finish.
                                </Text>
                            </View>
                            
                            <View style={styles.featureCard}>
                                <Text style={styles.featureTitle}>Process Automation</Text>
                                <Text style={styles.featureDescription}>
                                    Automate thousands of routine tasks simultaneously with a single setup. Our platform is designed to significantly reduce processing time compared to manual operations.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.benefitSection}>
                        <Text style={styles.sectionTitle}>Key Use Cases</Text>
                        
                        <View style={styles.benefitGrid}>
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>Recruitment Automation</Text>
                                <Text style={styles.benefitDescription}>
                                    From sourcing to screening to scheduling interviews, our AI agents handle the entire recruitment process, ensuring top talent doesn't slip through the cracks.
                                </Text>
                            </View>
                            
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>GST Filing</Text>
                                <Text style={styles.benefitDescription}>
                                    Automate data extraction, reconciliation, and filing of GST returns with high accuracy, saving your finance team countless hours each month.
                                </Text>
                            </View>
                            
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>Bid Management</Text>
                                <Text style={styles.benefitDescription}>
                                    Monitor opportunities, analyze RFPs, gather required documentation, and draft competitive proposals automatically and efficiently.
                                </Text>
                            </View>

                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>Digital Marketing</Text>
                                <Text style={styles.benefitDescription}>
                                    Coordinate content creation, scheduling, analytics, and optimization across multiple channels with AI agents that learn what works for your audience.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>Contact Us</Text>
                        <TouchableOpacity style={styles.contactButton} onPress={handleScheduleDemo}>
                            <Text style={styles.contactButtonText}>Contact</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                <LeadForm 
                visible={isLeadFormVisible}
                onClose={() => setLeadFormVisible(false)}
                onSubmit={handleLeadSubmit}
            />
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d3d3d3'
    },
    backgroundContainer: {
        position: 'absolute',
        width: '100%',
        height: 280,
    },
    curve: {
        position: 'absolute',
        width: '100%',
        height: 280,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    headerLogo: {
        width: 100,
        height: 100,
        alignSelf:'center',
        resizeMode: 'contain',
    },
    headerTitle: {
        fontSize: 24,
        alignSelf:'center',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navLink: {
        marginHorizontal: 15,
        fontSize: 16,
        color: '#4b5563',
    },
    loginButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#6b7280',
        borderRadius: 8,
        marginLeft: 15,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    heroSection: {
        alignItems: 'center',
        padding: 20,
    },
    heroContent: {
        alignItems: 'center',
        maxWidth: 600,
    },
    heroTitle: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    trustIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    trustBadge: {
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 10,
        backgroundColor: '#6b7280',
        borderRadius: 10,
    },
    trustBadgeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    trustBadgeText: {
        fontSize: 16,
        color: '#ffffff',
    },
    heroDescription: {
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 24,
    },
    featuresSection: {
        padding: 20,
        alignItems: 'center',
    },
    featureGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    featureCard: {
        width: '45%',
        padding: 20,
        backgroundColor: '#6b7280',
        borderRadius: 10,
        marginHorizontal: 10,
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
    },
    benefitSection: {
        padding: 20,
        alignItems: 'center',
    },
    benefitGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
    },
    benefitCard: {
        width: '40%',
        padding: 20,
        backgroundColor: '#6b7280',
        borderRadius: 10,
        margin: 10,
        alignItems: 'center',
    },
    benefitTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    benefitDescription: {
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
    },
    contactSection: {
        padding: 20,
        alignItems: 'center',
    },
    contactButton: {
        backgroundColor: '#6b7280',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    contactButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
        textAlign: 'center',
    },
    scrollContainer: {
        backgroundColor: '#d3d3d3'
    }
});

export default LandingPage;