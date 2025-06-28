import React, { createRef, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Animated, Platform, Modal, Pressable } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Animated as RNAnimated } from 'react-native';
import { useDispatch } from 'react-redux';
import { useInterestMutation } from '../component/publicApi';
import { showMessage } from '../component/flashMessageSlice';
import { industrySolutions, featureIcons, AnimatedCard, FloatingSection } from './LandingPageHelpers';
import { injectAnalyticsScripts } from '../utils/injectAnalytics';
import { Audio } from 'expo-av';
import * as ExpoAV from 'expo-av';
import { v4 as uuidv4 } from 'uuid';


const LeadForm = lazy(() => import('../component/LeadForm'));
const LazySections = lazy(() => import('../LazySections'));
const NewsletterForm = lazy(() => import('../component/NewsletterForm'));

import { injectLinkedInScriptWeb, injectFacebookPixelWeb } from '../utils/injectScripts';


const DragUpHintFloating = ({ visible, isMobile, onPress, y, height, containerHeight, mode }) => {
    const bounceAnim = useRef(new RNAnimated.Value(0)).current;
    const pulseAnim = useRef(new RNAnimated.Value(1)).current;

    useEffect(() => {
        let bounceLoop, pulseLoop;
        if (visible) {
            bounceLoop = RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(bounceAnim, {
                        toValue: -18,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            bounceLoop.start();
            pulseLoop = RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(pulseAnim, { toValue: 1.13, duration: 700, useNativeDriver: true }),
                    RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            );
            pulseLoop.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => {
            bounceLoop && bounceLoop.stop();
            pulseLoop && pulseLoop.stop();
        };
    }, [visible]);

    if (!visible || y == null || height == null) return null;

    let top;
    if (mode === 'hero') {
        // At the bottom border of hero section
        top = y + height - 36;
    } else {
        // Floating at 60% of the section height
        top = y + height * 0.6;
    }
    if (containerHeight && top > containerHeight - 120) {
        top = containerHeight - 120;
    }

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top,
                alignItems: 'center',
                opacity: 1,
                zIndex: 100,
                transform: [{ translateY: bounceAnim }, { scale: pulseAnim }],
                pointerEvents: 'box-none',
            }}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 32,
                    padding: isMobile ? 12 : 18,
                    backgroundColor: 'transparent',
                }}
            >
                <Image
                    source={require('../assets/search-logo.png')}
                    style={{
                        width: isMobile ? 44 : 60,
                        height: isMobile ? 44 : 60,
                        marginBottom: 6,
                        opacity: 0.95,
                    }}
                    resizeMode="contain"
                />
                <Ionicons name="chevron-up-circle" size={isMobile ? 36 : 48} color="#007AFF" style={{ marginBottom: 2 }} />
                <Text style={{
                    fontSize: isMobile ? 15 : 18,
                    color: '#007AFF',
                    fontWeight: 'bold',
                    marginTop: 2,
                    letterSpacing: 0.5,
                }}>
                    Drag up to explore
                </Text>
            </TouchableOpacity>
        </RNAnimated.View>
    );
};

const FloatingContactSparkle = ({ visible, onPress, isMobile }) => {
    const pulseAnim = useRef(new RNAnimated.Value(1)).current;
    useEffect(() => {
        let loop;
        if (visible) {
            loop = RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(pulseAnim, { toValue: 1.13, duration: 700, useNativeDriver: true }),
                    RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            );
            loop.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => loop && loop.stop();
    }, [visible]);
    return (
        <RNAnimated.View style={{
            transform: [{ scale: pulseAnim }],
            position: 'absolute',
            right: 18,
            bottom: 24,
            zIndex: 100,
        }}>
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#007AFF',
                    borderRadius: 32,
                    paddingVertical: 12,
                    paddingHorizontal: 22,
                    elevation: 8,
                    shadowColor: '#007AFF',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                }}
                onPress={onPress}
                activeOpacity={0.85}
            >
                <Ionicons name="chatbubbles" size={28} color="#fff" />
                <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginLeft: 10,
                }}>Contact Us</Text>
            </TouchableOpacity>
        </RNAnimated.View>
    );
};

const FrequencyBars = ({ playing }) => (
    <View style={{ 
        height: 24,
        marginTop: 8,
        opacity: playing ? 1 : 0,
        position: 'absolute',
        bottom: -32,
        left: 0,
        right: 0
    }} />
);

const LandingPage = ({ navigation }) => {
    const scrollViewRef = useRef(null);
    const sectionRefs = useRef([]);
    const showcaseVideoRef = useRef(null);
    const [isLeadFormVisible, setLeadFormVisible] = useState(false);
    const [showShowcaseModal, setShowShowcaseModal] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const [sectionLayouts, setSectionLayouts] = useState([]);
    const [showcaseVideoLayout, setShowcaseVideoLayout] = useState(null);
    const [containerHeight, setContainerHeight] = useState(null);
    const [showAllSections, setShowAllSections] = useState(false);
    const [showNewsletterForm, setShowNewsletterForm] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const dispatch = useDispatch();
    
    const [addInterest, { 
        isSuccess: isInterestDataSuccess, 
        isLoading: isInterestDataLoading, 
        error: interestDataError 
    }] = useInterestMutation();

    const [leadFormData, setLeadFormData] = useState({
        uniqueId: '',
        source: 'web',
        campaign: 'direct'
    });
    
    useEffect(() => {
        if(isInterestDataSuccess){
            dispatch(showMessage({
                message: 'Your interest is submitted, Team will contact you',
                type: 'info'
            }));
            setLeadFormVisible(false);
        }
    }, [isInterestDataSuccess]);

    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;

    const handleLogin = () => {
        setLoginLoading(true);
        navigation.navigate('Login');
        setTimeout(() => setLoginLoading(false), 1200); // fallback in case navigation is slow
    };

    const handleScheduleDemo = () => {
        setLeadFormVisible(true);
    };

    useEffect(() => {
        if (Platform.OS === 'web') {
            injectLinkedInScriptWeb();
            injectFacebookPixelWeb();
            injectAnalyticsScripts({
                gaId: 'G-KCK0RY0YPP', // TODO: Replace with your real GA4 ID
            });
        }
    }, []);

    // For audio sample
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('english');
    const [sound, setSound] = useState(null);

    const audioRefs = {
        hindi: useRef(null),
        english: useRef(null),
        british_english: useRef(null),
    };

    // Audio files mapping
    const audioFiles = {
        hindi: require('../assets/hindi-sample.mp3'),
        english: require('../assets/english-sample.mp3')
    };

    const AudioPlayer = Platform.select({
        web: () => import('../component/AudioPlayer.web'),
        default: () => import('../component/AudioPlayer.native'),
    });

    const handlePlayAudio = async () => {
        try {
            if (audioPlaying && sound) {
                sound.stop();
                setSound(null);
                setAudioPlaying(false);
                return;
            }

            const AudioPlayerModule = await AudioPlayer();
            const player = new AudioPlayerModule.default({
                source: audioFiles[selectedLanguage],
                onPlaybackStatusUpdate: (status) => {
                    if (status.didJustFinish) {
                        setAudioPlaying(false);
                        setSound(null);
                    }
                }
            });
            
            await player.play();
            setSound(player);
            setAudioPlaying(true);
        } catch (error) {
            console.error('Error playing audio:', error);
            setAudioPlaying(false);
            setSound(null);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.cleanup();
            }
        };
    }, [sound]);

    // All sections in one array, in order (without "See Dalai Llama in Action" as a section)
    const sections = [
        {
            key: 'hero',
            render: () => (
                <AnimatedCard delay={0} style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
                    <Text style={styles.heroHeadline}>Your D2C Journey, Reimagined</Text>
                    <Text style={styles.heroSubtext}>Reduce Returns. Lower Logistics Cost. Engage Customers. Earn More.</Text>
                    <View style={[styles.storyGrid, isMobile && styles.storyGridMobile]}>
                        <View style={styles.storyCard}>
                            <Text style={styles.cardLabel}>The Challenge</Text>
                            <Text style={styles.painPoint}>• 20% returns eating your profits</Text>
                            <Text style={styles.painPoint}>• Rising logistics costs</Text>
                            <Text style={styles.painPoint}>• Unengaged customers</Text>
                            <Text style={styles.painPoint}>• Missed revenue opportunities</Text>
                        </View>
                        <View style={styles.storyCardSolution}>
                            <Text style={styles.cardLabel}>The Solution</Text>
                            <Text style={styles.solution}>• Branded voice delivery updates</Text>
                            <Text style={styles.solution}>• Voice agent for website visitors</Text>
                            <Text style={styles.solution}>• Gamified engagement & ad revenue</Text>
                        </View>
                        <View style={styles.storyCardBenefit}>
                            <Text style={styles.cardLabel}>The Result</Text>
                            <Text style={styles.benefit}>• Lower costs, higher profit</Text>
                            <Text style={styles.benefit}>• Happier, loyal customers</Text>
                            <Text style={styles.benefit}>• New revenue from ads</Text>
                        </View>
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
                    <Text style={styles.sectionTitleModern}>How It Works for D2C Brands</Text>
                    <View style={{
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        gap: 32,
                        marginTop: 12,
                        marginBottom: 24,
                    }}>
                        <View style={{ maxWidth: 340, flex: 1, backgroundColor: '#fff7e6', borderRadius: 16, padding: 18, marginBottom: isMobile ? 16 : 0 }}>
                            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1a237e', marginBottom: 6, textAlign: 'center' }}>
                                Branded Voice Delivery Updates
                            </Text>
                            <Text style={{ fontSize: 15, color: '#333', textAlign: 'center' }}>
                                Keep your customers informed and engaged at every stage of delivery with personalized, branded voice notifications. Reduce returns and build trust.
                            </Text>
                        </View>
                        <View style={{ maxWidth: 340, flex: 1, backgroundColor: '#e6f7ff', borderRadius: 16, padding: 18, marginBottom: isMobile ? 16 : 0 }}>
                            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1a237e', marginBottom: 6, textAlign: 'center' }}>
                                Voice Agent for Website Visitors
                            </Text>
                            <Text style={{ fontSize: 15, color: '#333', textAlign: 'center' }}>
                                Greet and assist your website visitors with a smart voice agent. Guide them, answer questions, and recommend products to boost conversions.
                            </Text>
                        </View>
                        <View style={{ maxWidth: 340, flex: 1, backgroundColor: '#f6ffed', borderRadius: 16, padding: 18 }}>
                            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1a237e', marginBottom: 6, textAlign: 'center' }}>
                                Gamified Engagement & Ad Revenue
                            </Text>
                            <Text style={{ fontSize: 15, color: '#333', textAlign: 'center' }}>
                                Engage customers with interactive voice games and experiences. Show ads alongside products and unlock new revenue streams for your D2C brand.
                            </Text>
                        </View>
                    </View>
                    {/* Voice AI Audio Sample */}
                    <View style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 32,
                        position: 'relative',
                        minHeight: 110,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#f8fafd',
                            borderRadius: 20,
                            paddingVertical: 14,
                            paddingHorizontal: isMobile ? 10 : 32,
                            boxShadow: Platform.OS === 'web' ? '0 2px 12px #e3e8fd' : undefined,
                            elevation: 3,
                            maxWidth: 480,
                            width: '100%',
                            minWidth: isMobile ? 220 : 340,
                            borderWidth: 1,
                            borderColor: '#e3e8fd',
                            justifyContent: 'space-between',
                            gap: 18,
                        }}>
                            <TouchableOpacity
                                style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    gap: 10, 
                                    flex: 1,
                                    minWidth: 140
                                }}
                                onPress={handlePlayAudio}
                                activeOpacity={0.8}
                            >
                                <Ionicons 
                                    name={audioPlaying ? "stop-circle" : "play-circle"} 
                                    size={isMobile ? 36 : 44} 
                                    color="#007AFF" 
                                />
                                <Text style={{ 
                                    fontSize: 18, 
                                    color: '#1a237e', 
                                    fontWeight: '700', 
                                    letterSpacing: 0.2,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {audioPlaying ? "Stop" : "Play"} Sample
                                </Text>
                            </TouchableOpacity>
                            {Platform.OS === 'web' ? (
                                <div style={{ position: 'relative', minWidth: 140, width: 160 }}>
                                    <select
                                        style={{
                                            width: '100%',
                                            fontSize: isMobile ? 15 : 17,
                                            padding: '10px 36px 10px 14px',
                                            borderRadius: 14,
                                            border: '1.5px solid #d1d5db',
                                            background: '#fff',
                                            color: '#1a237e',
                                            fontWeight: 600,
                                            appearance: 'none',
                                            outline: 'none',
                                            boxShadow: '0 1px 4px #e3e8fd',
                                            transition: 'border 0.2s',
                                        }}
                                        value={selectedLanguage}
                                        onChange={async (e) => {
                                            if (audioPlaying && sound) {
                                                sound.stop();
                                                setSound(null);
                                                setAudioPlaying(false);
                                            }
                                            setSelectedLanguage(e.target.value);
                                            // Auto-play new language selection
                                            const AudioPlayerModule = await AudioPlayer();
                                            const player = new AudioPlayerModule.default({
                                                source: audioFiles[e.target.value],
                                                onPlaybackStatusUpdate: (status) => {
                                                    if (status.didJustFinish) {
                                                        setAudioPlaying(false);
                                                        setSound(null);
                                                    }
                                                }
                                            });
                                            await player.play();
                                            setSound(player);
                                            setAudioPlaying(true);
                                        }}
                                    >
                                        <option value="hindi">Hindi</option>
                                        <option value="english">English</option>
                                    </select>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <path d="M6 8l4 4 4-4" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            ) : (
                                <TouchableOpacity
                                    style={{ borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, minWidth: 120, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}
                                    onPress={async () => {
                                        if (audioPlaying && sound) {
                                            await sound.pauseAsync();
                                            setAudioPlaying(false);
                                        }
                                        const nextLanguage = selectedLanguage === 'hindi' ? 'english' : 'hindi';
                                        setSelectedLanguage(nextLanguage);
                                    }}
                                >
                                    <Text style={{ fontSize: isMobile ? 15 : 17, color: '#1a237e', fontWeight: '600' }}>
                                        {selectedLanguage === 'hindi' ? 'Hindi' : 'English'}
                                    </Text>
                                    <Svg width={18} height={18} viewBox="0 0 20 20" style={{ marginLeft: 6 }}>
                                        <Path d="M6 8l4 4 4-4" stroke="#007AFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                                    </Svg>
                                </TouchableOpacity>
                            )}
                        </View>
                        {audioPlaying && <FrequencyBars playing={audioPlaying} />}
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
                                icon: <MaterialIcons name="star" size={36} color="#007AFF" style={{ marginBottom: 8 }} />,
                            },
                            {
                                title: 'Multi-Language Support',
                                description: 'Engage customers in their preferred language',
                                icon: <MaterialIcons name="language" size={36} color="#43a047" style={{ marginBottom: 8 }} />,
                            },
                            {
                                title: 'Automated Follow-ups',
                                description: 'Schedule and execute follow-up calls automatically',
                                icon: <MaterialIcons name="autorenew" size={36} color="#ff9800" style={{ marginBottom: 8 }} />,
                            },
                            {
                                title: 'CRM Integration',
                                description: 'Seamless integration with your existing CRM',
                                icon: <MaterialIcons name="link" size={36} color="#8e24aa" style={{ marginBottom: 8 }} />,
                            }
                        ].map((feature, idx) => (
                            <AnimatedCard key={idx} delay={idx * 120}>
                                <Pressable style={({ pressed }) => [
                                    styles.featureModernCard,
                                    isMobile && styles.featureModernCardMobile,
                                    pressed && { backgroundColor: '#e3e8fd' }
                                ]}>
                                    <View style={{ alignItems: 'center', marginBottom: 8 }}>{feature.icon}</View>
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
                    <TouchableOpacity
                        style={[
                            styles.contactButton,
                            { backgroundColor: '#007AFF', alignSelf: 'center', marginTop: 18 }
                        ]}
                        onPress={handleScheduleDemo}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.contactButtonText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    // Scroll to the next section when drag up is pressed
    const handleDragUpHint = (idx) => {
        let nextIdx;
        if (idx >= sections.length - 1) {
            // If last section, go to hero (first section)
            nextIdx = 0;
        } else {
            nextIdx = idx + 1;
        }
        // Scroll exactly to the top of the next section
        if (sectionRefs.current[nextIdx]) {
            sectionRefs.current[nextIdx].measureLayout(
                scrollViewRef.current.getInnerViewNode(),
                (x, y) => {
                    scrollViewRef.current.scrollTo({ y, animated: true });
                    setActiveSection(nextIdx); // update active section/viewport immediately
                }
            );
        } else {
            setActiveSection(nextIdx); // fallback
        }
    };

    // On scroll, update activeSection and sectionLayouts
    const handleScroll = (event) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        let found = 0;
        let layouts = [];
        for (let i = 0; i < sections.length; i++) {
            if (sectionRefs.current[i]) {
                sectionRefs.current[i].measureLayout(
                    scrollViewRef.current.getInnerViewNode(),
                    (x, y, w, h) => {
                        layouts[i] = { y, h };
                        if (scrollY + 80 >= y) found = i;
                    }
                );
            }
        }
        setTimeout(() => {
            setActiveSection(found);
            setSectionLayouts(layouts);
            // Auto-load rest of the page if user scrolls past initial sections
            if (!showAllSections && found >= 2) {
                setShowAllSections(true);
            }
            // Open newsletter popup if at end of scroll
            if (
                scrollViewRef.current &&
                event.nativeEvent.layoutMeasurement.height + scrollY >= event.nativeEvent.contentSize.height - 10
            ) {
                setShowNewsletterForm(true);
            }
        }, 120);
    };

    // On layout, get container height for clamping
    const handleContainerLayout = (e) => {
        setContainerHeight(e.nativeEvent.layout.height);
    };

    // Get current section's layout for drag button
    const currentLayout = sectionLayouts[activeSection] || {};

    // Determine drag button mode: 'hero' for first section, 'float' for others
    let dragMode = activeSection === 0 ? 'hero' : 'float';

    // Cookie Consent Banner
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    useEffect(() => {
        if (Platform.OS === 'web') {
            const consent = localStorage.getItem('cookieConsent');
            if (!consent) setShowCookieBanner(true);
        }
    }, []);
    const handleAcceptCookies = () => {
        localStorage.setItem('cookieConsent', 'true');
        setShowCookieBanner(false);
    };

    useEffect(() => {
        if (showAllSections) {
            setTimeout(() => {
                if (sectionRefs.current[2] && scrollViewRef.current) {
                    sectionRefs.current[2].measureLayout(
                        scrollViewRef.current.getInnerViewNode(),
                        (x, y) => {
                            scrollViewRef.current.scrollTo({ y, animated: true });
                            setActiveSection(2);
                        }
                    );
                }
            }, 400); // Slightly longer delay to ensure rendering
        }
    }, [showAllSections]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const userId = getOrCreateUserId();
            // Track mouse movement, element click, and browser/user data for analytics
            const handleMouseMove = (e) => {
                if (window.gtag) {
                    window.gtag('event', 'mouse_move', {
                        x: e.clientX,
                        y: e.clientY,
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        userId,
                    });
                }
                if (window.clarity) {
                    window.clarity('event', 'mouse_move', {
                        x: e.clientX,
                        y: e.clientY,
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        userId,
                    });
                }
            };
            const handleClick = (e) => {
                const element = e.target;
                const elementInfo = {
                    tag: element.tagName,
                    id: element.id,
                    class: element.className,
                    name: element.name,
                    text: element.innerText ? element.innerText.slice(0, 40) : '',
                };
                if (window.gtag) {
                    window.gtag('event', 'element_click', {
                        ...elementInfo,
                        x: e.clientX,
                        y: e.clientY,
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        userId,
                    });
                }
                if (window.clarity) {
                    window.clarity('event', 'element_click', {
                        ...elementInfo,
                        x: e.clientX,
                        y: e.clientY,
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        userId,
                    });
                }
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('click', handleClick);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('click', handleClick);
            };
        }
    }, []);

    const getOrCreateUserId = () => {
        if (typeof window === 'undefined') return null;
        let userId = localStorage.getItem('uniqueUserId');
        if (!userId) {
            userId = uuidv4();
            localStorage.setItem('uniqueUserId', userId);
        }
        return userId;
    };

    const handleLeadSubmit = async (formData) => {
        try {
            const submissionData = {
                ...formData,
                uniqueId: leadFormData.uniqueId || uuidv4(),
                source: leadFormData.source || 'web',
                campaign: leadFormData.campaign || 'direct'
            };
            await addInterest(submissionData);
            
            // Track form submission in Google Analytics
            if (window.gtag) {
                window.gtag('event', 'form_submission', {
                    event_category: 'Lead Form',
                    event_label: submissionData.campaign,
                    source: submissionData.source,
                    uniqueId: submissionData.uniqueId
                });
            }
        } catch(err) {
            console.error("Interest submission failed:", err);
            // Track form error in Google Analytics
            if (window.gtag) {
                window.gtag('event', 'form_error', {
                    event_category: 'Lead Form',
                    event_label: err.message
                });
            }
        }
    };    const handleNewsletterSubmit = async (email) => {
        if (!email) return;
        
        try {
            const uniqueId = leadFormData.uniqueId || uuidv4();
            const source = leadFormData.source || 'web';
            const campaign = 'newsletter';
            
            const submissionData = {
                email,
                uniqueId,
                source,
                campaign
            };

            // Track newsletter submission attempt in Google Analytics
            if (window.gtag) {
                window.gtag('event', 'newsletter_submission_start', {
                    event_category: 'Newsletter',
                    event_label: campaign,
                    source,
                    uniqueId
                });
            }

            const response = await addInterest(submissionData);
            
            // Track successful newsletter submission
            if (window.gtag) {
                window.gtag('event', 'newsletter_subscription', {
                    event_category: 'Newsletter',
                    event_label: campaign,
                    source,
                    uniqueId,
                    email_domain: email.split('@')[1]
                });
            }

            return response;
        } catch(err) {
            console.error("Newsletter submission failed:", err);
            if (window.gtag) {
                window.gtag('event', 'newsletter_error', {
                    event_category: 'Newsletter',
                    event_label: err.message
                });
            }
            throw err;
        }
    };

    useEffect(() => {
        if(isInterestDataSuccess){
            // Track successful submission
            if (window.gtag) {
                window.gtag('event', 'form_success', {
                    event_category: leadFormData.campaign === 'newsletter' ? 'Newsletter' : 'Lead Form',
                    event_label: leadFormData.campaign,
                    source: leadFormData.source
                });
            }
            dispatch(showMessage({
                message: 'Your interest is submitted successfully!',
                type: 'success'
            }));
            setLeadFormVisible(false);
            setShowNewsletterForm(false);
        }
    }, [isInterestDataSuccess]);

    useEffect(() => {
        if(interestDataError){
            dispatch(showMessage({
                message: 'Failed to submit. Please try again.',
                type: 'error'
            }));
        }
    }, [interestDataError]);    useEffect(() => {
        function checkLeadFormHash() {            if (window.location.hash === '#leadform') {
                // Get URL parameters before the hash
                const urlParams = new URLSearchParams(window.location.search);
                const uniqueIdParam = urlParams.get('uniqueId');
                const sourceParam = urlParams.get('source');
                const campaignParam = urlParams.get('campaign');

                console.log('Lead form params:', { uniqueIdParam, sourceParam, campaignParam });

                setLeadFormData(prevData => ({
                    ...prevData,
                    uniqueId: uniqueIdParam || uuidv4(),
                    source: sourceParam || 'web',
                    campaign: campaignParam || 'direct'
                }));

                // Add delay to ensure state updates and allow hash change to complete
                setTimeout(() => {
                    setLeadFormVisible(true);
                    // Track lead form open in GA
                    if (window.gtag) {
                        window.gtag('event', 'lead_form_open', {
                            event_category: 'Lead Form',
                            event_label: campaignParam || 'direct',
                            source: sourceParam || 'web',
                            uniqueId: uniqueIdParam
                        });
                    }
                }, 300);
            }
        }
        checkLeadFormHash();
        window.addEventListener('hashchange', checkLeadFormHash);
        return () => window.removeEventListener('hashchange', checkLeadFormHash);
    }, []);

    useEffect(() => {
        // Open newsletter form if #newsletter is present on load or hash changes
        function checkNewsletterHash() {            if (window.location.hash === '#newsletter') {
                const urlParams = new URLSearchParams(window.location.search);
                const uniqueId = urlParams.get('uniqueId') || uuidv4();
                const source = urlParams.get('source') || 'web';
                
                setLeadFormData(prevData => ({
                    ...prevData,
                    uniqueId,
                    source,
                    campaign: 'newsletter'
                }));
                
                // Track newsletter form view
                if (window.gtag) {
                    window.gtag('event', 'newsletter_form_view', {
                        event_category: 'Newsletter',
                        event_label: 'Form Viewed',
                        source,
                        uniqueId
                    });
                }
                
                setShowNewsletterForm(true);
            }
        }
        checkNewsletterHash();
        window.addEventListener('hashchange', checkNewsletterHash);
        function handleScroll() {
            if (
                window.location.hash === '#newsletter' &&
                (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 10)
            ) {
                setShowNewsletterForm(true);
                window.removeEventListener('scroll', handleScroll);
            }
        }
        if (window.location.hash === '#newsletter') {
            window.addEventListener('scroll', handleScroll);
            // If already at bottom on load, open immediately
            if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 10)) {
                setShowNewsletterForm(true);
                window.removeEventListener('scroll', handleScroll);
            }
        }
        return () => {
            window.removeEventListener('hashchange', checkNewsletterHash);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <View style={[styles.container, isMobile && styles.containerMobile]} onLayout={handleContainerLayout}>
            {/* Header Section */}
            <View style={[styles.header, isMobile && styles.headerMobile]}>
                <View style={[styles.logoContainer, isMobile && styles.logoContainerMobile]}>
                    <Image source={require('../assets/llama-mascot.png')} style={styles.headerLogo} />
                    <Text style={styles.headerTitle}>Dalai Llama</Text>
                </View>
                <View style={styles.navLinks}>
                    <TouchableOpacity
                        onPress={handleLogin}
                        style={[styles.loginButton, isMobile && styles.loginButtonMobile]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.loginButtonText, isMobile && styles.loginButtonTextMobile]}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Cookie Consent Banner */}
            {showCookieBanner && (
                <View style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#222',
                    padding: 18,
                    zIndex: 9999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{ color: '#fff', fontSize: 15, marginRight: 18 }}>
                        This website uses cookies to ensure you get the best experience on our website.
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 22 }}
                        onPress={handleAcceptCookies}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Accept</Text>
                    </TouchableOpacity>
                </View>
            )}
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Hero Section */}
                <View
                    ref={ref => sectionRefs.current[0] = ref}
                    onLayout={() => {}}
                    style={{ position: 'relative', marginBottom: 24 }}
                >
                    <FloatingSection viewable={true}>
                        {sections[0].render()}
                    </FloatingSection>
                </View>
                {/* Showcase Section (See Dalai Llama in Action, voice demo, video) */}
                <View
                    ref={ref => sectionRefs.current[1] = ref}
                    onLayout={() => {}}
                    style={{ position: 'relative', marginBottom: 24 }}
                >
                    <FloatingSection viewable={true}>
                        {sections[1].render()}
                    </FloatingSection>
                </View>
                {/* Load rest of the sections on drag up, lazy loaded */}
                {showAllSections && (
                    <Suspense fallback={<View style={{height: 200, justifyContent: 'center', alignItems: 'center'}}><Text>Loading...</Text></View>}>
                        <LazySections
                            isMobile={isMobile}
                            styles={styles}
                            sectionRefs={sectionRefs}
                            handleScheduleDemo={handleScheduleDemo}
                        />
                    </Suspense>
                )}
            </ScrollView>
            {/* Drag up button: show unless on last section */}
            {activeSection < (showAllSections ? 5 : 1) && (
                <DragUpHintFloating
                    visible={true}
                    isMobile={isMobile}
                    onPress={() => {
                        if (!showAllSections) {
                            setShowAllSections(true);
                        } else {
                            handleDragUpHint(activeSection);
                        }
                    }}
                    y={currentLayout.y}
                    height={currentLayout.h}
                    containerHeight={containerHeight}
                    mode={dragMode}
                />
            )}
            <Suspense fallback={null}>
                <LeadForm
                    visible={isLeadFormVisible}
                    onClose={() => setLeadFormVisible(false)}
                    initialData={leadFormData}
                    onSubmit={handleLeadSubmit}
                    modalStyle={{ maxHeight: isMobile ? '70%' : '50vh', minHeight: 320, width: '100%', overflow: 'auto' }}
                    scrollable={isMobile}
                />
            </Suspense>
            <Suspense fallback={null}>
                {showNewsletterForm && <NewsletterForm 
                    onClose={() => setShowNewsletterForm(false)} 
                    onSubmit={handleNewsletterSubmit}
                    initialData={leadFormData}
                />}
            </Suspense>
            <FloatingContactSparkle
                visible={!isLeadFormVisible}
                onPress={handleScheduleDemo}
                isMobile={isMobile}
            >
                <Ionicons name="chatbubbles" size={28} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>Contact Us</Text>
            </FloatingContactSparkle>
            {loginLoading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    zIndex: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{ fontSize: 22, color: '#7c3aed', fontWeight: 'bold' }}>Loading...</Text>
                </View>
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
    loginButtonMobile: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    loginButtonText: {
        fontSize: 16,
    },
    loginButtonTextMobile: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    heroSection: {
        alignItems: 'center',
        padding: 0,
        marginTop: 8, // Reduced top margin
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
    heroImage: {
        width: 220,
        height: 120,
        resizeMode: 'cover',
        borderRadius: 18,
        marginBottom: 24,
    },
    storyGrid: {
        flexDirection: 'row',
        gap: 18,
        marginTop: 32,
        width: '100%',
        maxWidth: 900,
        justifyContent: 'center',
    },
    storyGridMobile: {
        flexDirection: 'column',
        gap: 12,
    },
    storyCard: {
        backgroundColor: '#fff7e6',
        borderRadius: 16,
        padding: 18,
        flex: 1,
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#faad14',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    storyCardSolution: {
        backgroundColor: '#e6f7ff',
        borderRadius: 16,
        padding: 18,
        flex: 1,
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#1890ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    storyCardBenefit: {
        backgroundColor: '#f6ffed',
        borderRadius: 16,
        padding: 18,
        flex: 1,
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#52c41a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1a237e',
        textAlign: 'center',
    },
    illustrationImage: {
        width: 90,
        height: 90,
        resizeMode: 'cover',
        borderRadius: 12,
        marginBottom: 10,
    },
    painPoint: {
        fontSize: 15,
        color: '#d48806',
        marginBottom: 6,
        fontWeight: '500',
        textAlign: 'center',
    },
    solution: {
        fontSize: 15,
        color: '#096dd9',
        marginBottom: 6,
        fontWeight: '500',
        textAlign: 'center',
    },
    benefit: {
        fontSize: 15,
        color: '#389e0d',
        marginBottom: 6,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
    },
    logoContainerMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    navLinksMobileRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 0,
        marginLeft: 'auto',
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