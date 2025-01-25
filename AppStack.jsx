import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image,Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { DrawerItemList } from "@react-navigation/drawer";
import styles from './styles';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import {useGetLlmQuery, useLoginMutation} from './component/authApi';
import {selectIsLoggedIn, selectLlmData, selectUser, setLlm, setSelectedLlm} from './component/authSlice';
import DropDownPicker from "react-native-dropdown-picker";
import User from "./assets/wordpress-logo.png";
import Home from './screens/Home';
import Dashboard from './screens/Dashboard';
import Agents from './screens/Agents';
import Business from './screens/Business';
import CampaignLogs from './screens/CampaignLogs';
import Campaigns from './screens/Campaigns';

import LandingPage from './screens/LandingPage';
import CallLogs from './screens/CallLogs';
import Logout from './component/LogOut';
const Auth = createStackNavigator();  

// Create stack navigator for cards
const ToolsStack = createStackNavigator();


const Drawer = createDrawerNavigator();



const HomeStack = () => {
    const user =  useSelector(selectUser);
    
  return (

    <Drawer.Navigator
    drawerContent={
      (props) => {
        return (
          <SafeAreaView>
            <View
              style={{
                height: 200,
                width: '100%',
                justifyContent: "center",
                alignItems: "center",
                borderBottomColor: "#f4f4f4",
                borderBottomWidth: 1
              }}
            >
              <Image
                source={User}
                style={{
                  height: 130,
                  width: 130,
                  borderRadius: 65
                }}
              />
              <Text
                style={{
                  fontSize: 22,
                  marginVertical: 6,
                  fontWeight: "bold",
                  color: "#111"
                }}
              >AKASH</Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#111"
                }}
              >AKASH</Text>
            </View>
            <DrawerItemList {...props} />
            
            <Logout/>
            
          </SafeAreaView>
        )
      }
    }
    screenOptions={{
      drawerStyle: {
        backgroundColor: "#d3d3d3",
        width: 250
      },
      headerStyle: {
        backgroundColor: "#d3d3d3",
      },
      headerTintColor: "black",
      headerTitleStyle: {
        fontWeight: "bold"
      },
      
      drawerLabelStyle: {
        color: "#111"
      }
    }}
    >
         <Drawer.Screen name="Dashboard" component={Dashboard} options={
              {
                headerTitle:"Dashboard"
              }
          } />
          <Drawer.Screen name="Agents" component={Agents} options={
              {
                headerTitle:"Agents"
              }
          }/>

          <Drawer.Screen name="Campaigns" component={Campaigns}  options={
              {
                headerTitle:"Campaigns"
              }
          }/>

          
      </Drawer.Navigator>

  );
};



const AuthStack = () => {
  return (
    <Auth.Navigator initialRouteName="LandingPage" screenOptions={{ headerShown: false }}>
      <Auth.Screen name="LandingPage" component={LandingPage} options={{headerShown:false}}/>
      <Auth.Screen name="Login" component={Home} options={{headerShown:false}}/>
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