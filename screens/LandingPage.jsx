import React, { createRef, useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Animated, Platform, Modal, Pressable, FlatList } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Easing } from 'react-native';

import LeadForm from '../component/LeadForm';
import { useDispatch } from 'react-redux';
import { useInterestMutation } from '../component/publicApi';
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

const industrySolutions = [
    {
        icon: '📞',
        title: 'Insurance Sales',
        metrics: '3x Lead Qualification',
        description: 'Policy renewal reminders, cross-selling opportunities, claim follow-ups'
    },
    {
        icon: '🏠',
        title: 'Real Estate',
        metrics: '45% More Appointments',
        description: 'Property listings, viewing schedules, follow-up with potential buyers'
    },
    {
        icon: '💳',
        title: 'Banking & Finance',
        metrics: '60% Cost Reduction',
        description: 'Credit card sales, loan applications, payment reminders'
    },
    {
        icon: '🎓',
        title: 'Education',
        metrics: '2x Enrollment Rate',
        description: 'Admission inquiries, course registration, fee reminder calls'
    }
];

const featureIcons = [
    { icon: 'target-variant', color: '#007AFF' }, // Smart Lead Prioritization
    { icon: 'translate', color: '#43a047' },      // Multi-Language Support
    { icon: 'autorenew', color: '#ff9800' },      // Automated Follow-ups
    { icon: 'database-sync', color: '#8e24aa' },  // CRM Integration
];

const AnimatedCard = ({ children, delay = 0, style = {}, ...props }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]} {...props}>
            {children}
        </Animated.View>
    );
};

// Bidirectional FloatingSection: animates in/out on viewable change
const FloatingSection = ({ children, viewable, style = {}, ...props }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        if (viewable) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.exp),
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 700,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.exp),
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.exp),
                }),
                Animated.timing(translateY, {
                    toValue: 40,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.exp),
                }),
            ]).start();
        }
    }, [viewable]);

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]} {...props}>
            {children}
        </Animated.View>
    );
};

// Animated frequency bars for speaking animation
const FrequencyBars = ({ playing }) => {
    const anims = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];

    useEffect(() => {
        if (playing) {
            const animations = anims.map((anim, i) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 2,
                            duration: 200 + i * 60,
                            useNativeDriver: true,
                            easing: Easing.linear,
                        }),
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 200 + i * 60,
                            useNativeDriver: true,
                            easing: Easing.linear,
                        }),
                    ])
                )
            );
            Animated.stagger(80, animations).start();
        } else {
            anims.forEach(anim => anim.setValue(1));
        }
    }, [playing]);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 24, marginHorizontal: 8 }}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 4,
                        marginHorizontal: 2,
                        borderRadius: 2,
                        backgroundColor: i === 2 ? '#007AFF' : '#43a047',
                        height: anim.interpolate({
                            inputRange: [1, 2],
                            outputRange: [10, 24],
                        }),
                    }}
                />
            ))}
        </View>
    );
};

// Voice Call Animation Row
const VoiceCallAnimation = ({ playing }) => (
    <View style={styles.voiceCallAnimRow}>
        <MaterialCommunityIcons name="robot" size={32} color="#007AFF" style={{ marginRight: 8 }} />
        <Text style={styles.voiceCallText}>Voice Call</Text>
        <MaterialCommunityIcons name="phone" size={24} color="#222" style={{ marginHorizontal: 8 }} />
        <FrequencyBars playing={playing} />
        <MaterialCommunityIcons name="account-circle" size={32} color="#43a047" style={{ marginLeft: 8 }} />
    </View>
);

const LandingPage = ({ navigation }) => {
    const scrollViewRef = createRef();
    const [isLeadFormVisible, setLeadFormVisible] = useState(false);
    const [showShowcaseModal, setShowShowcaseModal] = useState(false);
    const dispatch = useDispatch();
    
    const [addInterest, { 
        isSuccess: isInterestDataSuccess, 
        isLoading: isInterestDataLoading, 
        error: interestDataError 
    }] = useInterestMutation();

    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

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

    // For audio sample
    const [audioPlaying, setAudioPlaying] = useState(false);
    const audioRef = React.useRef(null);

    const handlePlayAudio = () => {
        if (audioRef.current) {
            if (audioPlaying) {
                audioRef.current.pause();
                setAudioPlaying(false);
            } else {
                audioRef.current.play();
            }
        }
    };

    // Track which sections are visible
    const [viewableSections, setViewableSections] = useState({});
    const viewabilityConfig = { itemVisiblePercentThreshold: 40 };
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        const newViewable = {};
        viewableItems.forEach(item => {
            newViewable[item.index] = true;
        });
        setViewableSections(prev => ({ ...prev, ...newViewable }));
    }).current;

    // Section data for FlatList
    const headerSection = {
        key: 'header',
        render: () => (
            <View style={[styles.header, isMobile && styles.headerMobile]}>
                <View style={[styles.logoContainer, isMobile && styles.logoContainerMobile]}>
                    <Image 
                        source={require('../assets/search-logo.png')} 
                        style={[styles.headerLogo, isMobile && styles.headerLogoMobile]} 
                    />
                    <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>DALAI LLAMA</Text>
                </View>
                <View style={[styles.navLinks, isMobile && styles.navLinksMobile]}>
                    <TouchableOpacity 
                        style={[styles.loginButton, isMobile && styles.loginButtonMobile]} 
                        onPress={handleLogin}
                    >
                        <Text style={[styles.loginButtonText, isMobile && styles.loginButtonTextMobile]}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ),
    };

    const sections = [
        headerSection,
        {
            key: 'hero',
            render: () => (
                <AnimatedCard delay={0} style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
                    <Text style={styles.heroHeadline}>AI-Powered Outbound Calling</Text>
                    <Text style={styles.heroSubtext}>Scale Your Sales & Support Operations</Text>
                    <Text style={styles.heroSubtext}>Increase Revenue by 200%</Text>
                    <View style={[styles.heroMetricsRow, isMobile && styles.heroMetricsRowMobile]}>
                        <AnimatedCard delay={200} style={styles.metricCardModern}>
                            <Text style={styles.metricValueModern}>5000+</Text>
                            <Text style={styles.metricLabelModern}>Calls/Hour</Text>
                        </AnimatedCard>
                        <AnimatedCard delay={400} style={styles.metricCardModern}>
                            <Text style={styles.metricValueModern}>40%</Text>
                            <Text style={styles.metricLabelModern}>Higher Conversion</Text>
                        </AnimatedCard>
                    </View>
                </AnimatedCard>
            ),
        },
        {
            key: 'showcase',
            render: () => (
                <View style={[
                    styles.showcaseSection,
                    isMobile && styles.showcaseSectionMobile,
                    !isMobile && styles.showcaseSectionWeb
                ]}>
                    <Pressable onPress={() => setShowShowcaseModal(true)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                        <Text style={styles.sectionTitleModern}>See Dalai Llama in Action</Text>
                    </Pressable>
                    <View style={[
                        styles.showcaseContent,
                        isMobile && styles.showcaseContentMobile
                    ]}>
                        {/* Voice AI Audio Sample - now above video */}
                        <View style={[
                            styles.audioContainer,
                            isMobile && styles.audioContainerMobile
                        ]}>
                            {audioPlaying && <VoiceCallAnimation playing={audioPlaying} />}
                            <Text style={styles.audioTitleModern}>Voice AI Demo</Text>
                            <TouchableOpacity
                                style={styles.audioPlayButtonModern}
                                onPress={handlePlayAudio}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={audioPlaying ? "pause-circle" : "play-circle"} size={isMobile ? 36 : 48} color="#007AFF" />
                                <Text style={styles.audioPlayTextModern}>
                                    {audioPlaying ? "Pause" : "Play"} Sample
                                </Text>
                            </TouchableOpacity>
                            <audio
                                ref={audioRef}
                                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                onEnded={() => setAudioPlaying(false)}
                                style={{ display: 'none' }}
                            />
                        </View>
                        {/* YouTube Video - below audio, responsive aspect ratio */}
                        <View style={[
                            styles.videoContainer,
                            isMobile && styles.videoContainerMobile
                        ]}>
                            {Platform.OS === 'web' ? (
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingBottom: '56.25%',
                                    borderRadius: isMobile ? 8 : 12,
                                    overflow: 'hidden',
                                    background: '#000'
                                }}>
                                    <iframe
                                        title="Dalai Llama Demo"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 0,
                                            borderRadius: isMobile ? 8 : 12,
                                            background: '#000'
                                        }}
                                        src="https://www.youtube.com/embed/Bo_gUCXr8lM"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <WebView
                                    style={isMobile ? styles.youtubeMobile : styles.youtube}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    source={{ uri: 'https://www.youtube.com/embed/Bo_gUCXr8lM' }}
                                    allowsFullscreenVideo
                                />
                            )}
                        </View>
                    </View>
                </View>
            ),
        },
        {
            key: 'industry',
            render: () => (
                <View ref={scrollViewRef} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
                    <Text style={styles.sectionTitleModern}>Industry Solutions</Text>
                    <ScrollView
                        horizontal={!isMobile}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.industryScrollModern,
                            isMobile && styles.industryScrollModernMobile
                        ]}
                    >
                        {industrySolutions.map((industry, index) => (
                            <AnimatedCard key={index} delay={index * 120}>
                                <Pressable style={({ pressed }) => [
                                    styles.industryModernCard,
                                    isMobile && styles.industryModernCardMobile,
                                    pressed && { backgroundColor: '#e3e8fd' }
                                ]}>
                                    <Text style={styles.industryIconModern}>{industry.icon}</Text>
                                    <Text style={styles.industryTitleModern}>{industry.title}</Text>
                                    <Text style={styles.industryMetricsModern}>{industry.metrics}</Text>
                                    <Text style={styles.industryDescriptionModern}>{industry.description}</Text>
                                </Pressable>
                            </AnimatedCard>
                        ))}
                    </ScrollView>
                </View>
            ),
        },
        {
            key: 'features',
            render: () => (
                <View ref={scrollViewRef} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
                    <Text style={styles.sectionTitleModern}>Outbound Calling Features</Text>
                    <View style={[
                        styles.featureGridModern,
                        isMobile && { flexDirection: 'column', gap: 0 }
                    ]}>
                        {[
                            {
                                title: 'Smart Lead Prioritization',
                                description: 'AI-driven scoring to call high-potential leads first',
                            },
                            {
                                title: 'Multi-Language Support',
                                description: 'Engage customers in their preferred language',
                            },
                            {
                                title: 'Automated Follow-ups',
                                description: 'Schedule and execute follow-up calls automatically',
                            },
                            {
                                title: 'CRM Integration',
                                description: 'Seamless integration with your existing CRM',
                            }
                        ].map((feature, idx) => (
                            <AnimatedCard key={idx} delay={idx * 120}>
                                <Pressable style={({ pressed }) => [
                                    styles.featureModernCard,
                                    isMobile && styles.featureModernCardMobile,
                                    pressed && { backgroundColor: '#e3e8fd' }
                                ]}>
                                    <MaterialCommunityIcons
                                        name={featureIcons[idx].icon}
                                        size={36}
                                        color={featureIcons[idx].color}
                                        style={styles.featureIconModern}
                                    />
                                    <Text style={styles.featureTitleModern}>{feature.title}</Text>
                                    <Text style={styles.featureDescriptionModern}>{feature.description}</Text>
                                </Pressable>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>
            ),
        },
        {
            key: 'metrics',
            render: () => (
                <View ref={scrollViewRef} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
                    <Text style={styles.sectionTitleModern}>Performance Metrics</Text>
                    <View style={styles.metricsGridModern}>
                        {[
                            { metric: '98%', label: 'Call Completion Rate' },
                            { metric: '45%', label: 'Cost Reduction' },
                            { metric: '3x', label: 'Lead Coverage' },
                            { metric: '24/7', label: 'Operation Hours' }
                        ].map((stat, index) => (
                            <AnimatedCard key={index} delay={index * 100}>
                                <View style={[styles.metricsModernCard, isMobile && styles.metricsModernCardMobile]}>
                                    <Text style={styles.metricsValueModern}>{stat.metric}</Text>
                                    <Text style={styles.metricsLabelModern}>{stat.label}</Text>
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>
            ),
        },
        {
            key: 'contact',
            render: () => (
                <View ref={scrollViewRef} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile, styles.contactSection, isMobile && styles.contactSectionMobile]}>
                    <Text style={styles.sectionTitleModern}>Contact Us</Text>
                    <TouchableOpacity style={[styles.contactButton, isMobile && styles.contactButtonMobile]} onPress={handleScheduleDemo}>
                        <Text style={styles.contactButtonText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    // Instead of ScrollView, use Animated.FlatList for floating slide-up effect
    return (
        <View style={[styles.container, isMobile && styles.containerMobile]}>
            <Animated.FlatList
                data={sections}
                keyExtractor={item => item.key}
                renderItem={({ item, index }) => (
                    <FloatingSection
                        viewable={!!viewableSections[index]}
                        style={{ marginBottom: 48 }}
                    >
                        {item.render()}
                    </FloatingSection>
                )}
                contentContainerStyle={{ paddingBottom: 80, paddingTop: 8 }}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />
            <LeadForm 
                visible={isLeadFormVisible}
                onClose={() => setLeadFormVisible(false)}
                onSubmit={handleLeadSubmit}
            />
            {isMobile && (
                <TouchableOpacity
                    style={styles.floatingContact}
                    onPress={handleScheduleDemo}
                    activeOpacity={0.85}
                >
                    <Ionicons name="chatbubbles" size={28} color="#fff" />
                    <Text style={styles.floatingContactText}>Contact Us</Text>
                </TouchableOpacity>
            )}
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
    },
    loginButton: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        backgroundColor: '#6b7280',
        borderRadius: 8,
        marginLeft: 10,
    },
    loginButtonText: {
        fontSize: 16,
    },
    heroSection: {
        alignItems: 'center',
        padding: 0,
        marginTop: 24,
        marginBottom: 8,
    },
    heroSectionMobile: {
        marginTop: 8,
        marginBottom: 0,
    },
    heroHeadline: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#1a237e',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    heroSubtext: {
        fontSize: 20,
        color: '#222',
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '500',
    },
    heroMetricsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
        gap: 24,
    },
    heroMetricsRowMobile: {
        flexDirection: 'column',
        gap: 10,
        marginTop: 12,
    },
    metricCardModern: {
        backgroundColor: '#e3e8fd',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginHorizontal: 8,
        minWidth: 140,
        marginBottom: 0,
        shadowColor: '#1a237e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    metricValueModern: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 2,
    },
    metricLabelModern: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
        textAlign: 'center',
    },
    sectionTitleModern: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 18,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    sectionCardModern: {
        backgroundColor: '#fff',
        borderRadius: 18,
        margin: 18,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 6,
        width: '95%',
        alignSelf: 'center',
        marginBottom: 18,
    },
    industryScrollModern: {
        flexDirection: 'row',
        gap: 24,
        justifyContent: 'center',
        alignItems: 'stretch',
        width: '100%',
    },
    industryScrollModernMobile: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
        width: '100%',
    },
    industryModernCard: {
        backgroundColor: '#f7f9fc',
        borderRadius: 14,
        padding: 20,
        marginHorizontal: 8,
        alignItems: 'center',
        minWidth: 220,
        maxWidth: 260,
        shadowColor: '#1a237e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    industryModernCardMobile: {
        minWidth: '90%',
        maxWidth: '100%',
        marginHorizontal: 0,
        marginBottom: 10,
    },
    industryIconModern: {
        fontSize: 36,
        marginBottom: 8,
        color: '#007AFF',
    },
    industryTitleModern: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
        textAlign: 'center',
    },
    industryMetricsModern: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'center',
    },
    industryDescriptionModern: {
        fontSize: 14,
        color: '#222',
        textAlign: 'center',
        marginBottom: 0,
    },
    featureGridModern: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 18,
        justifyContent: 'center',
        width: '100%',
    },
    featureModernCard: {
        backgroundColor: '#f7f9fc',
        borderRadius: 14,
        padding: 18,
        margin: 8,
        alignItems: 'center',
        minWidth: 200,
        maxWidth: 240,
        flex: 1,
        shadowColor: '#1a237e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
        justifyContent: 'center',
    },
    featureModernCardMobile: {
        minWidth: '96%',
        maxWidth: '100%',
        marginHorizontal: 0,
        marginBottom: 10,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureIconModern: {
        fontSize: 36,
        marginBottom: 14,
        color: '#007AFF',
        alignSelf: 'center',
    },
    featureTitleModern: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 8,
        textAlign: 'center',
        alignSelf: 'center',
        width: '100%',
    },
    featureDescriptionModern: {
        fontSize: 15,
        color: '#222',
        textAlign: 'center',
        alignSelf: 'center',
        width: '100%',
        marginBottom: 2,
        lineHeight: 20,
    },
    metricsGridModern: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 18,
        justifyContent: 'center',
        width: '100%',
    },
    metricsModernCard: {
        backgroundColor: '#f7f9fc',
        borderRadius: 14,
        padding: 18,
        margin: 8,
        alignItems: 'center',
        minWidth: 140,
        maxWidth: 180,
        flex: 1,
        shadowColor: '#1a237e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    metricsModernCardMobile: {
        minWidth: '90%',
        maxWidth: '100%',
        marginHorizontal: 0,
        marginBottom: 10,
    },
    metricsValueModern: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 2,
    },
    metricsLabelModern: {
        fontSize: 13,
        color: '#222',
        textAlign: 'center',
    },
    audioTitleModern: {
        fontSize: 20,
        marginBottom: 10,
        textAlign: 'center',
        color: '#1a237e',
        fontWeight: 'bold',
    },
    audioPlayButtonModern: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 18,
        marginTop: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    audioPlayTextModern: {
        fontSize: 18,
        color: '#222',
        fontWeight: '600',
    },
    audioContainer: {
        marginBottom: 32, // Increased space below audio before video
    },
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
    industrySectionMobile: {
        padding: 10,
    },
    industryContainerMobile: {
        width: '100%',
        alignItems: 'center',
    },
    industryCardMobile: {
        width: '95%',
        marginVertical: 8,
        marginHorizontal: 0,
        padding: 8,
    },
    industryIconMobile: {
        fontSize: 28,
    },
    industryTitleMobile: {
        fontSize: 18,
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
    showcaseSectionWeb: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    floatingContact: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        backgroundColor: '#007AFF',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 22,
        elevation: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        zIndex: 100,
    },
    floatingContactText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(30,30,30,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
        width: '90%',
        maxWidth: 600,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 18,
        textAlign: 'center',
    },
    closeModalBtn: {
        marginTop: 10,
        alignSelf: 'center',
    },
    voiceCallAnimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    voiceCallText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginHorizontal: 8,
    },
    voiceCallHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        justifyContent: 'center',
    },
    voiceWaveAnim: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    waveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#43a047',
        marginHorizontal: 1,
        opacity: 0.7,
    },
    contactButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 14,
        marginTop: 18,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 180,
    },
    contactButtonText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default LandingPage;