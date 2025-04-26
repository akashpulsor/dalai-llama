import React, { createRef, useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useWindowDimensions } from 'react-native';

import LeadForm from '../component/LeadForm';
import { useDispatch } from 'react-redux';
import { useInterestMutation } from '../component/authApi';
import { showMessage } from '../component/flashMessageSlice';

const injectLinkedInScriptWeb = () => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('linkedin-insight-script')) return;

    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.id = 'linkedin-insight-script';
    script1.innerHTML = `
        _linkedin_partner_id = "7164620";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.async = true;
    script2.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    document.head.appendChild(script2);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = '<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=7164620&fmt=gif" />';
    document.body.appendChild(noscript);
};

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

    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

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

    useEffect(() => {
        if (Platform.OS === 'web') {
            injectLinkedInScriptWeb();
        }
    }, []);

    return (
        <View style={[styles.container, isMobile && styles.containerMobile]}>
            <ScrollView 
                ref={scrollViewRef} 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, isMobile && styles.headerMobile]}>
                    <View style={[styles.logoContainer, isMobile && styles.logoContainerMobile]}>
                        <Image 
                            source={require('../assets/search-logo.png')} 
                            style={[styles.headerLogo, isMobile && styles.headerLogoMobile]} 
                        />
                        <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>DALAI LLAMA</Text>
                    </View>

                    <View style={[styles.navLinks, isMobile && styles.navLinksMobile]}>
                        {['About', 'Industry', 'Features', 'Benefit', 'Contact'].map((link) => (
                            <TouchableOpacity 
                                key={link} 
                                onPress={() => handleNavClick(link.toLowerCase())}
                            >
                                <Text style={[styles.navLink, isMobile && styles.navLinkMobile]}>{link}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                            style={[styles.loginButton, isMobile && styles.loginButtonMobile]} 
                            onPress={handleLogin}
                        >
                            <Text style={[styles.loginButtonText, isMobile && styles.loginButtonTextMobile]}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
                    <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
                        <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>AI-Powered Outbound Calling</Text>
                        <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>Scale Your Sales & Support Operations</Text>
                        <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>Increase Revenue by 200%</Text>
                        
                        <View style={[styles.trustIndicators, isMobile && styles.trustIndicatorsMobile]}>
                            <View style={[styles.trustBadge, isMobile && styles.trustBadgeMobile]}>
                                <Text style={[styles.trustBadgeTitle, isMobile && styles.trustBadgeTitleMobile]}>5000+</Text>
                                <Text style={[styles.trustBadgeText, isMobile && styles.trustBadgeTextMobile]}>Calls/Hour</Text>
                            </View>
                            <View style={[styles.trustBadge, isMobile && styles.trustBadgeMobile]}>
                                <Text style={[styles.trustBadgeTitle, isMobile && styles.trustBadgeTitleMobile]}>40%</Text>
                                <Text style={[styles.trustBadgeText, isMobile && styles.trustBadgeTextMobile]}>Higher Conversion</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View ref={industryRef} style={[styles.industrySection, isMobile && styles.industrySectionMobile]}>
                    <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Industry Solutions</Text>
                    <View style={[styles.industryContainer, isMobile && styles.industryContainerMobile]}>
                        <ScrollView 
                            horizontal={!isMobile}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.industryScrollContent, isMobile && styles.industryScrollContentMobile]}
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
                                <View key={index} style={[styles.industryCard, isMobile && styles.industryCardMobile]}>
                                    <View style={[styles.industryImageContainer, isMobile && styles.industryImageContainerMobile]}>
                                        <Image source={industry.image} style={[styles.industryImage, isMobile && styles.industryImageMobile]} />
                                    </View>
                                    <View style={styles.industryContent}>
                                        <Text style={[styles.industryTitle, isMobile && styles.industryTitleMobile]}>{industry.title}</Text>
                                        <Text style={[styles.metricsText, isMobile && styles.metricsTextMobile]}>{industry.metrics}</Text>
                                        <Text style={[styles.industryDescription, isMobile && styles.industryDescriptionMobile]}>{industry.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <View ref={featuresRef} style={[styles.featuresSection, isMobile && styles.featuresSectionMobile]}>
                    <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Outbound Calling Features</Text>
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
                            if (isMobile || index % 2 === 0) rows.push([]);
                            rows[rows.length - 1].push(feature);
                            return rows;
                        }, []).map((row, rowIndex) => (
                            <View key={rowIndex} style={[styles.featureRow, isMobile && styles.featureRowMobile]}>
                                {row.map((feature, colIndex) => (
                                    <View key={colIndex} style={[styles.featureCard, isMobile && styles.featureCardMobile]}>
                                        <View style={styles.featureHeader}>
                                            <Text style={[styles.featureIcon, isMobile && styles.featureIconMobile]}>{feature.icon}</Text>
                                            <Text style={[styles.featureTitle, isMobile && styles.featureTitleMobile]}>{feature.title}</Text>
                                        </View>
                                        <Text style={[styles.featureDescription, isMobile && styles.featureDescriptionMobile]}>{feature.description}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                <View ref={benefitsRef} style={[styles.statsSection, isMobile && styles.statsSectionMobile]}>
                    <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Performance Metrics</Text>
                    <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
                        {[
                            { metric: '98%', label: 'Call Completion Rate' },
                            { metric: '45%', label: 'Cost Reduction' },
                            { metric: '3x', label: 'Lead Coverage' },
                            { metric: '24/7', label: 'Operation Hours' }
                        ].map((stat, index) => (
                            <View key={index} style={[styles.statCard, isMobile && styles.statCardMobile]}>
                                <Text style={[styles.statMetric, isMobile && styles.statMetricMobile]}>{stat.metric}</Text>
                                <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View ref={contactRef} style={[styles.contactSection, isMobile && styles.contactSectionMobile]}>
                    <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Contact Us</Text>
                    <TouchableOpacity style={[styles.contactButton, isMobile && styles.contactButtonMobile]} onPress={handleScheduleDemo}>
                        <Text style={[styles.contactButtonText, isMobile && styles.contactButtonTextMobile]}>Contact</Text>
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
    // Responsive overrides below:
    containerMobile: {
        padding: 0,
    },
    headerMobile: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 10,
    },
    logoContainerMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerLogoMobile: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    headerTitleMobile: {
        fontSize: 16,
    },
    navLinksMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    navLinkMobile: {
        fontSize: 14,
        marginHorizontal: 5,
        marginVertical: 2,
    },
    loginButtonMobile: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginLeft: 5,
    },
    loginButtonTextMobile: {
        fontSize: 14,
    },
    heroSectionMobile: {
        padding: 10,
    },
    heroContentMobile: {
        maxWidth: '100%',
    },
    heroTitleMobile: {
        fontSize: 22,
    },
    heroSubtitleMobile: {
        fontSize: 16,
    },
    trustIndicatorsMobile: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    trustBadgeMobile: {
        width: 120,
        height: 60,
        marginVertical: 5,
        padding: 10,
    },
    trustBadgeTitleMobile: {
        fontSize: 16,
    },
    trustBadgeTextMobile: {
        fontSize: 10,
    },
    industrySectionMobile: {
        padding: 10,
    },
    industryContainerMobile: {
        width: '100%',
        alignItems: 'center',
    },
    industryScrollContentMobile: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    industryCardMobile: {
        width: '95%',
        height: 260,
        marginVertical: 8,
        marginHorizontal: 0,
        padding: 8,
    },
    industryImageContainerMobile: {
        height: 90,
    },
    industryImageMobile: {
        height: '100%',
    },
    industryTitleMobile: {
        fontSize: 16,
    },
    metricsTextMobile: {
        fontSize: 12,
    },
    industryDescriptionMobile: {
        fontSize: 10,
    },
    featuresSectionMobile: {
        padding: 8,
    },
    featureRowMobile: {
        flexDirection: 'column',
    },
    featureCardMobile: {
        width: '100%',
        marginBottom: 10,
        padding: 8,
    },
    featureIconMobile: {
        fontSize: 28,
    },
    featureTitleMobile: {
        fontSize: 18,
    },
    featureDescriptionMobile: {
        fontSize: 12,
    },
    statsSectionMobile: {
        padding: 10,
    },
    statsGridMobile: {
        flexDirection: 'column',
    },
    statCardMobile: {
        width: '100%',
        marginBottom: 10,
        padding: 10,
    },
    statMetricMobile: {
        fontSize: 18,
    },
    statLabelMobile: {
        fontSize: 10,
    },
    contactSectionMobile: {
        padding: 10,
    },
    contactButtonMobile: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    contactButtonTextMobile: {
        fontSize: 14,
    },
    sectionTitleMobile: {
        fontSize: 20,
        marginBottom: 8,
    },
});

export default LandingPage;