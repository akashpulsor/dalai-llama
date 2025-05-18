import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Pressable } from 'react-native';
import { industrySolutions, AnimatedCard } from './screens/LandingPageHelpers';
import { MaterialIcons } from '@expo/vector-icons';

const LazySections = ({ isMobile, styles, sectionRefs, handleScheduleDemo }) => ([
    // Industry Section
    <View key="industry" ref={ref => sectionRefs.current[2] = ref} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
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
    </View>,
    // Features Section
    <View key="features" ref={ref => sectionRefs.current[3] = ref} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
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
    </View>,
    // Metrics Section
    <View key="metrics" ref={ref => sectionRefs.current[4] = ref} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile]}>
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
    </View>,
    // Contact Section
    <View key="contact" ref={ref => sectionRefs.current[5] = ref} style={[styles.sectionCardModern, isMobile && styles.sectionCardMobile, styles.contactSection, isMobile && styles.contactSectionMobile]}>
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
]);

export default LazySections;
