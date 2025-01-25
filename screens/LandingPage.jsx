import React, { createRef , useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import LeadForm from '../component/LeadForm';

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

    const handleLeadSubmit = (leadData) => {
        // Implement lead submission logic here
        // This could be an API call to your backend
        console.log('Lead submitted:', leadData);
        // Optional: Show a success toast or alert
    };
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
                            <Text style={styles.heroTitle}>The Gen-AI Contact Center</Text>
                            <Text style={styles.heroSubtitle}>Automate your complex call center with voice AI!</Text>
                            
                            <View style={styles.trustIndicators}>
                                <View style={styles.trustBadge}>
                                    <Text style={styles.trustBadgeTitle}>30%</Text>
                                    <Text style={styles.trustBadgeText}>Conversion Rate</Text>
                                </View>
                                <View style={styles.trustBadge}>
                                    <Text style={styles.trustBadgeTitle}>Enterprise</Text>
                                    <Text style={styles.trustBadgeText}>Trusted Solutions</Text>
                                </View>
                            </View>
                            
                            <Text style={styles.heroDescription}>
                                Flexible CS scaling with our AI agents. Self-improving AI voice agents to replace your whole call center. Trusted by Enterprises and large retailers to deliver the same or better customer satisfaction than human agents. At scale.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>Our Voice AI Platform</Text>
                        
                        <View style={styles.featureGrid}>
                            <View style={styles.featureCard}>
                                <Text style={styles.featureTitle}>Human-like Conversations</Text>
                                <Text style={styles.featureDescription}>
                                    Built on state-of-the-art Gen AI technology to deliver ultimate flexibility and human-like customer experiences.
                                </Text>
                            </View>
                            
                            <View style={styles.featureCard}>
                                <Text style={styles.featureTitle}>Outbound Campaigns</Text>
                                <Text style={styles.featureDescription}>
                                    Reach out to warm leads and schedule 1000s of calls simultaneously with a single click. Previous campaigns achieved 30% conversion rates.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.benefitSection}>
                        <Text style={styles.sectionTitle}>Key Benefits</Text>
                        
                        <View style={styles.benefitGrid}>
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>Automated Marketing</Text>
                                <Text style={styles.benefitDescription}>
                                    Streamline your marketing campaigns with intelligent, automated outreach strategies.
                                </Text>
                            </View>
                            
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>AI Sales Agents</Text>
                                <Text style={styles.benefitDescription}>
                                    Create autonomous sales agents that generate leads and drive sales conversations automatically.
                                </Text>
                            </View>
                            
                            <View style={styles.benefitCard}>
                                <Text style={styles.benefitTitle}>Lead Protection</Text>
                                <Text style={styles.benefitDescription}>
                                    Advanced security measures to prevent lead leakage and protect your valuable customer information.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>Contact Us</Text>
                        <TouchableOpacity style={styles.contactButton} onPress={handleScheduleDemo}>
                            <Text style={styles.contactButtonText}>Schedule a Demo</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
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
        backgroundColor: 'rgba(255,255,255,0.2)',
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
        backgroundColor: 'rgba(255,255,255,0.1)',
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
        justifyContent: 'center',
        marginTop: 20,
    },
    benefitCard: {
        width: '30%',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        marginHorizontal: 10,
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
    curve: {
        position: 'absolute',
        width: '100%',
        height: 280,
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