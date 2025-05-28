import React, { lazy, Suspense } from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image,Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from 'react-native';

import { DrawerItemList } from "@react-navigation/drawer";

import { useSelector } from 'react-redux';


import {selectIsLoggedIn, selectLlmData, selectUser, setLlm, setSelectedLlm} from './component/authSlice';

import User from "./assets/wordpress-logo.png";
const Home = lazy(() => import('./screens/Home'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const Agents = lazy(() => import('./screens/Agents'));
const CampaignLogs = lazy(() => import('./screens/CampaignLogs'));
const Campaigns = lazy(() => import('./screens/Campaigns'));


const LandingPage = lazy(() => import('./screens/LandingPage'));

import Logout from './component/LogOut';
const Auth = createStackNavigator();  

// Create stack navigator for cards
const ToolsStack = createStackNavigator();


const Drawer = createDrawerNavigator();



const HomeStack = () => {
    const user = useSelector(selectUser);
    const { width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenWidth < 600;

    return (
        <Drawer.Navigator
            drawerContent={props => (
                <SafeAreaView style={{ flex: 1, backgroundColor: '#d3d3d3', padding: 0, margin: 0, borderRadius: 0 }}>
                    <View style={{
                        height: 220,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#d3d3d3',
                        borderBottomColor: '#e3e3e3',
                        borderBottomWidth: 1,
                        marginBottom: 8,
                        paddingTop: 16,
                        borderRadius: 0,
                    }}>
                        <Image
                            source={User}
                            style={{
                                height: 110,
                                width: 110,
                                borderRadius: 55,
                                marginBottom: 8,
                                borderWidth: 2,
                                borderColor: '#7c3aed',
                            }}
                        />
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#7c3aed', marginBottom: 2 }}>AKASH</Text>
                        <Text style={{ fontSize: 15, color: '#444', opacity: 0.8 }}>AKASH</Text>
                    </View>
                    <DrawerItemList {...props} />
                    <View style={{ flex: 1 }} />
                    <View style={{ borderTopWidth: 1, borderTopColor: '#e3e3e3', marginVertical: 8 }} />
                    <Logout />
                </SafeAreaView>
            )}
            screenOptions={{
                drawerStyle: {
                    backgroundColor: '#d3d3d3',
                    width: 250,
                    borderRightWidth: 0,
                    overflow: 'hidden',
                },
                sceneContainerStyle: {
                    backgroundColor: '#d3d3d3',
                    overflow: 'hidden',
                },
                headerStyle: {
                    backgroundColor: '#d3d3d3',
                    borderBottomWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: '#7c3aed',
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#7c3aed',
                },
                drawerLabelStyle: {
                    color: '#222',
                    fontWeight: '500',
                    fontSize: 16,
                },
                drawerActiveTintColor: '#7c3aed',
                drawerInactiveTintColor: '#222',
                drawerActiveBackgroundColor: 'rgba(124,58,237,0.08)',
            }}
        >
            <Drawer.Screen name="Dashboard" options={{ headerTitle: "Dashboard" }}>
                {props => (
                    <Suspense fallback={null}>
                        <Dashboard {...props} />
                    </Suspense>
                )}
            </Drawer.Screen>
            <Drawer.Screen name="Agents" options={{ headerTitle: "Agents" }}>
                {props => (
                    <Suspense fallback={null}>
                        <Agents {...props} />
                    </Suspense>
                )}
            </Drawer.Screen>

            <Drawer.Screen name="Campaigns" options={{ headerTitle: "Campaigns" }}>
                {props => (
                    <Suspense fallback={null}>
                        <Campaigns {...props} />
                    </Suspense>
                )}
            </Drawer.Screen>

            <Drawer.Screen name="CampaignLogs" options={{ headerTitle: "CampaignLogs" }}>
                {props => (
                    <Suspense fallback={null}>
                        <CampaignLogs {...props} />
                    </Suspense>
                )}
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};



const AuthStack = () => {
  return (
    <Auth.Navigator initialRouteName="LandingPage" screenOptions={{ headerShown: false }}>
      <Auth.Screen name="LandingPage">
        {props => (
          <Suspense fallback={null}>
            <LandingPage {...props} />
          </Suspense>
        )}
      </Auth.Screen>
      <Auth.Screen name="Login">
        {props => (
          <Suspense fallback={null}>
            <Home {...props} />
          </Suspense>
        )}
      </Auth.Screen>
    </Auth.Navigator>
  );
}





export default function AppStack() {

  const isLoggedIn =  useSelector(selectIsLoggedIn);
  const user =  useSelector(selectUser);

  console.log(user);

  return (
      isLoggedIn? <HomeStack/>:<AuthStack/>
  );
};