// Import necessary components from React Native
import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions, StyleSheet, Animated, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectUser } from '../component/authSlice';
import useEventSource from '../component/useEventSource';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateAgentModal = lazy(() => import('../component/CreateAgentModel'));
const CreateCampaignModal = lazy(() => import('../component/CreateCampaignModal'));
const AddLeadModal = lazy(() => import('../component/AddLeadModal'));

const PhoneModal = lazy(() => import('../component/PhoneModal'));
const LlmModal = lazy(() => import('../component/LlmModal'));

const DURATION_OPTIONS = [
    { label: 'Past Month', value: 'month' },
    { label: 'Past Six Months', value: 'six_months' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' },
];

// Create your functional component
const Dashboard = ({ navigation }) => {
    const [showCreateCampaignModal, setCreateCampaignModal] = useState(false);
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [PhoneDataModal, setPhoneDataModal] = useState(false);
    const [llmDataModel, setLlmDataModal] = useState(false);
    const [duration, setDuration] = useState('month');
    const [showCtaDropdown, setShowCtaDropdown] = useState(false);
    const [customFrom, setCustomFrom] = useState(null);
    const [customTo, setCustomTo] = useState(null);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const user = useSelector(selectUser);
    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 600;
    const { callLogs, charges, campaignRuns } = useEventSource(user?.id, duration);

    // Animation for hero KPI
    const heroScale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(heroScale, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
                Animated.timing(heroScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const styles = StyleSheet.create({
        background: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            width: '80vw',
            height: '80vh',
            maxWidth: '80vw',
            maxHeight: '80vh',
            backgroundColor: '#d3d3d3', // match Home.jsx gray
            borderRadius: 0,
            boxShadow: '0 0 32px 0 rgba(124,58,237,0.18)',
            overflow: 'hidden',
        },
        card: {
            backgroundColor: '#fff',
            borderRadius: 24,
            width: isMobile ? '96vw' : '80vw',
            minWidth: isMobile ? '96vw' : 400,
            maxWidth: isMobile ? '98vw' : '80vw',
            height: isMobile ? 'auto' : '80vh',
            minHeight: isMobile ? 420 : '60vh',
            maxHeight: isMobile ? undefined : '80vh',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 32,
            elevation: 16,
            padding: isMobile ? 10 : 0,
            marginTop: isMobile ? 16 : 0,
            marginBottom: isMobile ? 16 : 0,
            alignSelf: 'center',
        },
        ctaStack: {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            marginLeft: isMobile ? 0 : 32,
            marginTop: isMobile ? 24 : 0,
        },
        ctaCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'linear-gradient(135deg, #a7bfe8 0%, #7c3aed 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.16,
            shadowRadius: 10,
            elevation: 8,
        },
        mascot: {
            width: 60,
            height: 60,
            alignSelf: 'center',
            marginBottom: 4,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: 2,
            textAlign: 'center',
            letterSpacing: 0.5,
        },
        subtitle: {
            fontSize: 14,
            color: '#222',
            marginBottom: 10,
            textAlign: 'center',
            fontWeight: '500',
        },
        gradientBg: {
            ...StyleSheet.absoluteFillObject,
            zIndex: -1,
            backgroundColor: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%, #a7bfe8 100%)',
        },
        outerCard: {
            backgroundColor: '#d3d3d3', // match background gray
            borderRadius: 24,
            padding: isMobile ? 16 : 24,
            alignItems: 'center',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 8,
            width: isMobile ? '99%' : '100%',
            maxWidth: 800,
            minHeight: isMobile ? 0 : 400,
            position: 'relative',
        },
        infoCardGlass: {
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 24,
            padding: 24,
            marginBottom: 18,
            shadowColor: '#8e24aa',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 1.5,
            borderColor: 'rgba(140, 82, 255, 0.12)',
            backdropFilter: 'blur(8px)',
        },
        avatarRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
        },
        avatarCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#7c3aed',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 18,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
        },
        avatarText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 28,
            letterSpacing: 1,
        },
        businessNameBig: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#222',
            marginBottom: 2,
            textAlign: 'left',
            letterSpacing: 0.5,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: '#444',
        },
        value: {
            fontSize: 14,
            color: '#666',
        },
        dashboardGrid: {
            width: '100%',
            maxWidth: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 10,
        },
        metricTile: {
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 20,
            padding: 22,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 0,
            marginTop: 0,
            marginHorizontal: 0,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.13,
            shadowRadius: 12,
            elevation: 7,
            borderWidth: 1.2,
            borderColor: 'rgba(140, 82, 255, 0.09)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.18s',
            flexBasis: isMobile ? '45%' : '22%',
            minWidth: isMobile ? 120 : 140,
            maxWidth: isMobile ? '48%' : 160,
        },
        metricIcon: {
            fontSize: 32,
            marginBottom: 6,
        },
        iconCircleCalls: {
            backgroundColor: '#e1bee7',
            borderRadius: 18,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        iconCircleCost: {
            backgroundColor: '#ffe0b2',
            borderRadius: 18,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        iconCircleTokens: {
            backgroundColor: '#b2dfdb',
            borderRadius: 18,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        iconCircleLeads: {
            backgroundColor: '#c5e1a5',
            borderRadius: 18,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        iconCircleCampaigns: {
            backgroundColor: '#b3e5fc',
            borderRadius: 18,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        tileCalls: {
            borderLeftWidth: 6,
            borderLeftColor: '#8e24aa',
        },
        tileCost: {
            borderLeftWidth: 6,
            borderLeftColor: '#ff9800',
        },
        tileTokens: {
            borderLeftWidth: 6,
            borderLeftColor: '#009688',
        },
        tileLeads: {
            borderLeftWidth: 6,
            borderLeftColor: '#689f38',
        },
        tileCampaigns: {
            borderLeftWidth: 6,
            borderLeftColor: '#0288d1',
        },
        cardLabel: {
            fontSize: 18,
            fontWeight: '500',
            color: '#333',
            marginBottom: 10,
            textAlign: 'center',
        },
        cardValue: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            marginBottom: 2,
        },
        fabRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 18,
            flexWrap: 'wrap',
        },
        fab: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#7c3aed',
            borderRadius: 24,
            paddingVertical: 10,
            paddingHorizontal: 18,
            elevation: 4,
            marginHorizontal: 6,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
        },
        fabText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 15,
            marginLeft: 8,
        },
        configRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginTop: 12,
            flexWrap: 'wrap',
        },
        configBtn: {
            backgroundColor: '#e0e7ff',
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 24,
            elevation: 3,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
        },
        configBtnText: {
            color: '#4f46e5',
            fontWeight: '500',
            fontSize: 14,
        },
        businessInfoSection: {
            marginTop: 24,
            width: '100%',
            backgroundColor: '#f8fafd',
            borderRadius: 18,
            padding: 18,
            alignItems: 'flex-start',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
        },
        businessTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: 8,
        },
        businessInfo: {
            fontSize: 15,
            color: '#444',
            marginBottom: 4,
        },
        actionBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#7c3aed',
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginTop: 8,
            width: '100%',
        },
        actionBtnText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 15,
            marginLeft: 8,
        },
        heroKPI: {
            backgroundColor: '#fff',
            borderRadius: 32,
            paddingVertical: 36,
            paddingHorizontal: 48,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.13,
            shadowRadius: 24,
            elevation: 10,
            marginBottom: 18,
            marginTop: 18,
        },
        heroKPINumber: {
            fontSize: 64,
            fontWeight: 'bold',
            color: '#7c3aed',
            letterSpacing: 1,
        },
        heroKPILabel: {
            fontSize: 20,
            color: '#333',
            fontWeight: '500',
            marginTop: 6,
        },
        durationPickerRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
        },
        durationOption: {
            backgroundColor: '#f3f4f6',
            borderRadius: 16,
            paddingVertical: 6,
            paddingHorizontal: 14,
            marginHorizontal: 2,
        },
        durationOptionActive: {
            backgroundColor: '#7c3aed',
        },
        durationOptionText: {
            color: '#7c3aed',
            fontWeight: '500',
            fontSize: 14,
        },
        durationOptionTextActive: {
            color: '#fff',
        },
        semiCircleMetrics: {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
        },
        metricTileCircle: {
            backgroundColor: '#fff',
            borderRadius: 32,
            width: 110,
            height: 110,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
            elevation: 6,
            position: 'absolute',
        },
        metricTileIcon: {
            fontSize: 28,
            marginBottom: 4,
        },
        metricTileValue: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#7c3aed',
        },
        metricTileLabel: {
            fontSize: 13,
            color: '#333',
            fontWeight: '500',
        },
    });

    // Semi-circular arrangement for metrics
    const metricPositions = [
        { top: 0, left: '50%', transform: [{ translateX: -55 }] }, // Top center
        { top: 60, left: '85%', transform: [{ translateX: -55 }] }, // Top right
        { top: 140, left: '75%', transform: [{ translateX: -55 }] }, // Bottom right
        { top: 140, left: '25%', transform: [{ translateX: -55 }] }, // Bottom left
        { top: 60, left: '15%', transform: [{ translateX: -55 }] }, // Top left
    ];
    const metricData = [
        { icon: '🏢', value: callLogs?.length || 0, label: 'Business' },
        { icon: '📞', value: callLogs?.length || 0, label: 'Total Calls' },
        { icon: '💸', value: `$${charges?.total || 0}`, label: 'Total Cost' },
        { icon: '🪙', value: charges?.tokens || 0, label: 'Total Tokens' },
        { icon: '👥', value: user?.leads?.length || 0, label: 'Total Leads' },
        { icon: '🚀', value: campaignRuns?.length || 0, label: 'Total Campaigns' },
    ];

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#d3d3d3', width: '100vw', height: '100vh' }}>
            {isMobile ? (
                <>
                    {/* Foldable duration picker above the card, does not shift card position */}
                    <View style={{ width: '100%', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200 }}>
                        <TouchableOpacity
                            onPress={() => setShowDurationPicker(v => !v)}
                            style={{ backgroundColor: '#ede9fe', borderRadius: 12, padding: 10, marginTop: 12, marginBottom: 6, width: 180, alignItems: 'center', alignSelf: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 }}
                        >
                            <Text style={{ color: '#7c3aed', fontWeight: 'bold' }}>{showDurationPicker ? 'Hide' : 'Show'} Date Range</Text>
                        </TouchableOpacity>
                        {showDurationPicker && (
                            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, marginTop: 2, alignItems: 'center', width: 220, alignSelf: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 }}>
                                <View style={{ flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                    <View style={[styles.durationPickerRow, { flexDirection: 'column', marginBottom: 0, gap: 8 }]}> 
                                        {DURATION_OPTIONS.map(opt => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[styles.durationOption, duration === opt.value && styles.durationOptionActive, { width: 180, marginVertical: 2 }]}
                                                onPress={() => setDuration(opt.value)}
                                            >
                                                <Text style={[styles.durationOptionText, duration === opt.value && styles.durationOptionTextActive]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    
                                </View>
                            </View>
                        )}
                    </View>
                    {/* Add paddingTop to card container to avoid overlap */}
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingTop: 90 }} style={{ width: '100%',    marginRight:40, }}>
                        <View style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#8e24aa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,

    marginTop: 0, // Remove extra marginTop
    marginRight: 0, // Remove extra marginRight
    width: 360,
    maxWidth: '80%',
                        }}>
                            <View style={{ alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                                <Text style={styles.title}>AI-Powered Outbound Calling</Text>
                                <Text style={styles.subtitle}>Scale Your Sales & Support Operations</Text>
                                <Text style={styles.subtitle}>Increase Revenue by 200%</Text>
                                {/* Duration picker floating bar for mobile view */}

                                {/* ...other dashboard content... */}
                                {isMobile ? (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
    <View style={{
      width: '98%',
      backgroundColor: '#f5f3ff',
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: 'center',
      shadowColor: '#7c3aed',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 18,
    }}>
      {metricData.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '98%',
            backgroundColor: index === 0 ? '#ede7f6' : 'rgba(255,255,255,0.97)',
            borderRadius: 20,
            marginBottom: index === metricData.length - 1 ? 0 : 14,
            paddingVertical: 14,
            paddingHorizontal: 12,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 3,
            borderLeftWidth: 6,
            borderLeftColor: ['#8e24aa','#ff9800','#009688','#689f38','#0288d1','#00bcd4'][index % 6],
          }}
        >
          <View style={{
            backgroundColor: ['#e1bee7','#ffe0b2','#b2dfdb','#c5e1a5','#b3e5fc','#f3e7e9'][index % 6],
            borderRadius: 16,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}>
            <Text style={{ fontSize: 26 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2 }}>{item.value}</Text>
            <Text style={{ fontSize: 14, color: '#333', fontWeight: '600', letterSpacing: 0.2 }}>{item.label}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
) : (
  <View style={[styles.dashboardGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'stretch', gap: 24, width: '100%' }]}> 
    {metricData.map((item, index) => (
      <View
        key={index}
        style={[
          styles.metricTile,
          { flex: '1 1 220px', minWidth: 180, maxWidth: 240, margin: 0, borderRadius: 28, marginBottom: 0 },
          {
            background: index === 0 ? 'linear-gradient(135deg, #a7bfe8 0%, #7c3aed 100%)' : undefined,
            backgroundColor: index === 0 ? undefined : 'rgba(255,255,255,0.85)',
            borderLeftWidth: 6,
            borderLeftColor: ['#8e24aa','#ff9800','#009688','#689f38','#0288d1','#00bcd4'][index % 6],
            boxShadow: '0 4px 24px 0 rgba(124,58,237,0.10)',
            transition: 'transform 0.18s',
          },
        ]}
      >
        <View
          style={{
            backgroundColor: ['#e1bee7','#ffe0b2','#b2dfdb','#c5e1a5','#b3e5fc','#f3e7e9'][index % 6],
            borderRadius: 18,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 30 }}>{item.icon}</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2, letterSpacing: 0.5 }}>{item.value}</Text>
        <Text style={{ fontSize: 15, color: '#333', fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 }}>{item.label}</Text>
      </View>
    ))}
  </View>
)}
                            </View>
                        </View>
                    </ScrollView>
                    {/* Floating CTA stack at bottom, 2 in first row, 3 in second row (triangle) */}
                    <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center', marginBottom: 8 }}>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setCreateCampaignModal(true)}>
                                <MaterialIcons name="campaign" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setShowCreateAgentModal(true)}>
                                <MaterialIcons name="person-add" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center' }}>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setShowAddLeadModal(true)}>
                                <MaterialIcons name="add-circle" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setPhoneDataModal(true)}>
                                <MaterialIcons name="settings-phone" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setLlmDataModal(true)}>
                                <MaterialIcons name="settings" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh' }}>
                        <View style={{ ...styles.card, maxHeight: '90vh', overflow: 'auto', marginTop: 0, marginBottom: 0 }}>
                            <View style={{ width: 420, maxWidth: '100%', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', marginRight: 'auto', padding: 24, paddingBottom:40}}>
                                        <View style={[styles.durationPickerRow, { justifyContent: 'center', alignItems: 'center', width: '100%' }]}> 
                                            {DURATION_OPTIONS.map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    style={[styles.durationOption, duration === opt.value && styles.durationOptionActive]}
                                                    onPress={() => setDuration(opt.value)}
                                                >
                                                    <Text style={[styles.durationOptionText, duration === opt.value && styles.durationOptionTextActive]}>{opt.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        
                            </View>
                                    {isMobile ? (
  <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
    <View style={{
      width: '98%',
      backgroundColor: '#f5f3ff',
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: 'center',
      shadowColor: '#7c3aed',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 18,
    }}>
      {metricData.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '98%',
            backgroundColor: index === 0 ? '#ede7f6' : 'rgba(255,255,255,0.97)',
            borderRadius: 20,
            marginBottom: index === metricData.length - 1 ? 0 : 14,
            paddingVertical: 14,
            paddingHorizontal: 12,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 3,
            borderLeftWidth: 6,
            borderLeftColor: ['#8e24aa','#ff9800','#009688','#689f38','#0288d1','#00bcd4'][index % 6],
          }}
        >
          <View style={{
            backgroundColor: ['#e1bee7','#ffe0b2','#b2dfdb','#c5e1a5','#b3e5fc','#f3e7e9'][index % 6],
            borderRadius: 16,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}>
            <Text style={{ fontSize: 26 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2 }}>{item.value}</Text>
            <Text style={{ fontSize: 14, color: '#333', fontWeight: '600', letterSpacing: 0.2 }}>{item.label}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
) : (
  <View style={[styles.dashboardGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'stretch', gap: 24, width: '100%' }]}> 
    {metricData.map((item, index) => (
      <View
        key={index}
        style={[
          styles.metricTile,
          { flex: '1 1 220px', minWidth: 180, maxWidth: 240, margin: 0, borderRadius: 28, marginBottom: 0 },
          {
            background: index === 0 ? 'linear-gradient(135deg, #a7bfe8 0%, #7c3aed 100%)' : undefined,
            backgroundColor: index === 0 ? undefined : 'rgba(255,255,255,0.85)',
            borderLeftWidth: 6,
            borderLeftColor: ['#8e24aa','#ff9800','#009688','#689f38','#0288d1','#00bcd4'][index % 6],
            boxShadow: '0 4px 24px 0 rgba(124,58,237,0.10)',
            transition: 'transform 0.18s',
          },
        ]}
      >
        <View
          style={{
            backgroundColor: ['#e1bee7','#ffe0b2','#b2dfdb','#c5e1a5','#b3e5fc','#f3e7e9'][index % 6],
            borderRadius: 18,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            shadowColor: '#7c3aed',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 30 }}>{item.icon}</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2, letterSpacing: 0.5 }}>{item.value}</Text>
        <Text style={{ fontSize: 15, color: '#333', fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 }}>{item.label}</Text>
      </View>
    ))}
  </View>
)}
                        </View>
                        {/* CTA Buttons on right, vertically centered */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, marginLeft: 32, alignSelf: 'center' }}>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setCreateCampaignModal(true)}>
                                <MaterialIcons name="campaign" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setShowCreateAgentModal(true)}>
                                <MaterialIcons name="person-add" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setShowAddLeadModal(true)}>
                                <MaterialIcons name="add-circle" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setPhoneDataModal(true)}>
                                <MaterialIcons name="settings-phone" size={28} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.ctaCircle, { backgroundColor: '#7c3aed' }]} onPress={() => setLlmDataModal(true)}>
                                <MaterialIcons name="settings" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}

            {/* Modals */}
            <Suspense fallback={null}>
                {showCreateAgentModal && (
                    <CreateAgentModal 
                        openModal={showCreateAgentModal} 
                        onClose={() => setShowCreateAgentModal(false)}
                        onSaveAgent={() => setShowCreateAgentModal(false)}
                        user={user?.id}
                    />
                )}
                {showCreateCampaignModal && (
                    <CreateCampaignModal 
                        onClose={() => setCreateCampaignModal(false)} 
                        openModal={showCreateCampaignModal} 
                    />
                )}
                {showAddLeadModal && (
                    <AddLeadModal 
                        onClose={() => setShowAddLeadModal(false)} 
                        openModal={showAddLeadModal}
                    />
                )}
                {PhoneDataModal && (
                    <PhoneModal 
                        onClose={() => setPhoneDataModal(false)} 
                        openModal={PhoneDataModal}
                    />
                )}
                {llmDataModel && (
                    <LlmModal 
                        onClose={() => setLlmDataModal(false)} 
                        openModal={llmDataModel}
                    />
                )}
            </Suspense>
        </View>
    );
};

// Export the component
export default Dashboard;




