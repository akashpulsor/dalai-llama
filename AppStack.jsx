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
import Home from './screens/Home';
const Auth = createStackNavigator();  

// Create stack navigator for cards
const ToolsStack = createStackNavigator();


const Drawer = createDrawerNavigator();

const HomeStack = () => {
  
};



const AuthStack = () => {
  return (
    <Auth.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
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