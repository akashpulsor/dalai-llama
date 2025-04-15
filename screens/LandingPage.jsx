import React, { createRef, useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
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
    
    // Add refs for each section
    const industryRef = createRef();
    const featuresRef = createRef();
    const benefitsRef = createRef();
    const contactRef = createRef();

    const [addInterest, { 
        isSuccess: isInterestDataSuccess, 
        isLoading: isInterestDataLoading, 
        error: interestDataError 
    }] = useInterestMutation();

    // Update scroll position calculation
    const handleNavClick = (sectionId) => {
        switch(sectionId) {
            case 'industry':
                industryRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                });
                break;
            case 'features':
                featuresRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                });
                break;
            case 'benefit':
                benefitsRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                });
                break;
            case 'contact':
                contactRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                });
                break;
            default:
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const handleScheduleDemo = () => {
        setLeadFormVisible(true);
    };

    const handleLeadSubmit = async (leadData) => {
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
                        {['About', 'Industry', 'Features', 'Benefit', 'Contact'].map((link) => (
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
                        <Text style={[styles.heroTitle, { flexWrap: 'nowrap' }]}>AI-Powered Outbound Calling</Text>
                        <Text style={[styles.heroSubtitle, { flexWrap: 'nowrap' }]}>Scale Your Sales & Support Operations</Text>
                        <Text style={[styles.heroSubtitle, { flexWrap: 'nowrap' }]}>Increase Revenue by 200%</Text>
                        
                        <View style={styles.trustIndicators}>
                            <View style={styles.trustBadge}>
                                <Text style={styles.trustBadgeTitle}>5000+</Text>
                                <Text style={styles.trustBadgeText}>Calls/Hour</Text>
                            </View>
                            <View style={styles.trustBadge}>
                                <Text style={styles.trustBadgeTitle}>40%</Text>
                                <Text style={styles.trustBadgeText}>Higher Conversion</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View ref={industryRef} style={styles.industrySection}>
                    <Text style={styles.sectionTitle}>Industry Solutions</Text>
                    <View style={styles.industryContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.industryScrollContent}
                        >
                            {[
                                {
                                    title: 'Insurance Sales',
                                    image: require('../assets/insurance-calls.png'),
                                    metrics: '3x Lead Qualification',
                                    description: 'Policy renewal reminders, cross-selling opportunities, claim follow-ups'
                                },
                                {
                                    title: 'Real Estate',
                                    image: require('../assets/realestate-calls.png'),
                                    metrics: '45% More Appointments',
                                    description: 'Property listings, viewing schedules, follow-up with potential buyers'
                                },
                                {
                                    title: 'Banking & Finance',
                                    image: require('../assets/banking-calls.png'),
                                    metrics: '60% Cost Reduction',
                                    description: 'Credit card sales, loan applications, payment reminders'
                                },
                                {
                                    title: 'Education',
                                    image: require('../assets/education-calls.png'),
                                    metrics: '2x Enrollment Rate',
                                    description: 'Admission inquiries, course registration, fee reminder calls'
                                }
                            ].map((industry, index) => (
                                <View key={index} style={styles.industryCard}>
                                    <View style={styles.industryImageContainer}>
                                        <Image source={industry.image} style={styles.industryImage} />
                                    </View>
                                    <View style={styles.industryContent}>
                                        <Text style={styles.industryTitle}>{industry.title}</Text>
                                        <Text style={styles.metricsText}>{industry.metrics}</Text>
                                        <Text style={styles.industryDescription}>{industry.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <View ref={featuresRef} style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Outbound Calling Features</Text>
                    <View style={styles.featureGrid}>
                        {[
                            {
                                title: 'Smart Lead Prioritization',
                                description: 'AI-driven scoring to call high-potential leads first',
                                icon: '🎯'
                            },
                            {
                                title: 'Multi-Language Support',
                                description: 'Engage customers in their preferred language',
                                icon: '🌐'
                            },
                            {
                                title: 'Automated Follow-ups',
                                description: 'Schedule and execute follow-up calls automatically',
                                icon: '🔄'
                            },
                            {
                                title: 'CRM Integration',
                                description: 'Seamless integration with your existing CRM',
                                icon: '🔗'
                            }
                        ].reduce((rows, feature, index) => {
                            if (index % 2 === 0) rows.push([]);
                            rows[rows.length - 1].push(feature);
                            return rows;
                        }, []).map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.featureRow}>
                                {row.map((feature, colIndex) => (
                                    <View key={colIndex} style={styles.featureCard}>
                                        <View style={styles.featureHeader}>
                                            <Text style={styles.featureIcon}>{feature.icon}</Text>
                                            <Text style={styles.featureTitle}>{feature.title}</Text>
                                        </View>
                                        <Text style={styles.featureDescription}>{feature.description}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                <View ref={benefitsRef} style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Performance Metrics</Text>
                    <View style={styles.statsGrid}>
                        {[
                            { metric: '98%', label: 'Call Completion Rate' },
                            { metric: '45%', label: 'Cost Reduction' },
                            { metric: '3x', label: 'Lead Coverage' },
                            { metric: '24/7', label: 'Operation Hours' }
                        ].map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <Text style={styles.statMetric}>{stat.metric}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View ref={contactRef} style={styles.contactSection}>
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
        backgroundColor: '#d3d3d3',
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
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navLink: {
        marginHorizontal: 10,
        fontSize: 16,
        color: '#4b5563',
    },
    loginButton: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        backgroundColor: '#6b7280',
        borderRadius: 8,
        marginLeft: 10,
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
        maxWidth: 350,
    },
    heroTitle: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
        flexWrap: 'nowrap',
    },
    heroSubtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 15,
        flexWrap: 'nowrap',
    },
    trustIndicators: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        width: '100%',
        paddingHorizontal: 20,
    },
    trustBadge: {
        alignItems: 'center',
        marginHorizontal: 10,
        padding: 15,
        backgroundColor: '#6b7280',
        borderRadius: 10,
        width: 150,
        height: 80,
        justifyContent: 'center',
    },
    trustBadgeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 5,
    },
    trustBadgeText: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
    },
    heroAnimation: {
        width: '100%',
        height: 200,
        marginVertical: 20,
    },
    demoButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 20,
        elevation: 5,
    },
    demoButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    industrySection: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    industryContainer: {
        width: '100%',
        alignItems: 'center',
    },
    industryScrollContent: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    industryCard: {
        width: 280,
        height: 400,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 10,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    industryImageContainer: {
        width: '100%',
        height: 180,
        marginBottom: 15,
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
    },
    industryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    industryContent: {
        width: '100%',
        paddingHorizontal: 10,
        flex: 1,
        justifyContent: 'flex-start',
    },
    industryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    metricsText: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    industryDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        textAlign: 'center',
    },
    featuresSection: {
        padding: 16,
        width: '100%',
        marginVertical: 10,
    },
    featureGrid: {
        width: '100%',
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    featureCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 12,
        width: '100%',
    },
    featureIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    featureTitle: {
        fontSize: 30,
        fontWeight: '600',
        color: '#2d3748',
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 20,
        color: '#718096',
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    statsSection: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 3,
    },
    statMetric: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    contactSection: {
        padding: 20,
        alignItems: 'center',
    },
    contactButton: {
        backgroundColor: '#6b7280',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    contactButtonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 15,
        textAlign: 'center',
    },
    scrollContainer: {
        backgroundColor: '#d3d3d3',
    },
});

export default LandingPage;