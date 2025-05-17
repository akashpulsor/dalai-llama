// Helper components and static arrays for LandingPage
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Platform, TouchableOpacity, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const industrySolutions = [
    { icon: '📞', title: 'Insurance Sales', metrics: '3x Lead Qualification', description: 'Policy renewal reminders, cross-selling opportunities, claim follow-ups' },
    { icon: '🏠', title: 'Real Estate', metrics: '45% More Appointments', description: 'Property listings, viewing schedules, follow-up with potential buyers' },
    { icon: '💳', title: 'Banking & Finance', metrics: '60% Cost Reduction', description: 'Credit card sales, loan applications, payment reminders' },
    { icon: '🎓', title: 'Education', metrics: '2x Enrollment Rate', description: 'Admission inquiries, course registration, fee reminder calls' },
];

export const featureIcons = [
    { icon: 'target-variant', color: '#007AFF' },
    { icon: 'translate', color: '#43a047' },
    { icon: 'autorenew', color: '#ff9800' },
    { icon: 'database-sync', color: '#8e24aa' },
];

export const AnimatedCard = ({ children, delay = 0, style = {}, ...props }) => {
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

export const FloatingSection = ({ children, viewable, style = {}, ...props }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(40)).current;
    useEffect(() => {
        if (viewable) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 700, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 40, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [viewable]);
    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]} {...props}>
            {children}
        </Animated.View>
    );
};

export const FrequencyBars = ({ playing }) => {
    const anims = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
    useEffect(() => {
        if (playing) {
            const animations = anims.map((anim, i) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, { toValue: 2, duration: 200 + i * 60, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 1, duration: 200 + i * 60, useNativeDriver: true }),
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
                        height: anim.interpolate({ inputRange: [1, 2], outputRange: [10, 24] }),
                    }}
                />
            ))}
        </View>
    );
};

export const VoiceCallAnimation = ({ playing }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 4 }}>
        <MaterialCommunityIcons name="robot" size={32} color="#007AFF" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginHorizontal: 8 }}>Voice Call</Text>
        <MaterialCommunityIcons name="phone" size={24} color="#222" style={{ marginHorizontal: 8 }} />
        <FrequencyBars playing={playing} />
        <MaterialCommunityIcons name="account-circle" size={32} color="#43a047" style={{ marginLeft: 8 }} />
    </View>
);
