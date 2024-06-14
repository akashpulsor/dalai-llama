import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image,Button, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Home from './component/home';
import Tools from './component/tools';
import llamaSeo from './component/llamaSeo';
import LlamaContent from './component/llamaContent';
import BuisnessLogin from './component/BuisnessLogin';
import DalaiLLamaSearch from './component/DalaiLLamaSearch';
import Payment from './component/Payment';
import Account from './component/Account';
import Search from './component/Search';
import CustomHeader from './component/CustomHeader';
import { NavigationContainer } from "@react-navigation/native";
import { DrawerItemList } from "@react-navigation/drawer";
import styles from './styles';
import User from "./assets/wordpress-logo.png";
import Logout from './component/LogOut';
import llamaContent from './component/llamaContent';
import { useSelector } from 'react-redux';

import { useDispatch } from 'react-redux';
import {useGetLlmQuery, useLoginMutation} from './component/authApi';
import {selectIsLoggedIn, selectLlmData, selectUser, setLlm, setSelectedLlm} from './component/authSlice';
import DropDownPicker from "react-native-dropdown-picker";
const Auth = createStackNavigator();

// Create stack navigator for cards
const ToolsStack = createStackNavigator();


const Drawer = createDrawerNavigator();

const HomeStack = () => {
    const [open, setOpen] = useState(false);
    const [llmValue, setLlmValue] = useState(null);
    const user =  useSelector(selectUser);
    const { data: llmsData, error: llmError, isLoading: llmsLoading } =useGetLlmQuery();
    const [placeholder, setPlaceholder] = useState('Choose an llm.');
    useEffect(() => {
        if (llmsData) {
            console.log(llmsData);

        }
    }, [llmsData]);
    const dispatch = useDispatch();
    const handleSelectItem = (item) => {
        setLlmValue(item.value);
        dispatch(setSelectedLlm(item));
        setPlaceholder(item.label); // Update the placeholder text
        setOpen(false); // Close the dropdown after selection
    };
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
              >{user.userName}</Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#111"
                }}
              >Product Manager</Text>
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
         <Drawer.Screen name="Search" component={Search} options={
              {
                headerTitle:"Search",
                headerRight:()=>
                    <DropDownPicker
                        open={open}
                        items={llmsData}
                        setOpen={setOpen}
                        value={llmValue}
                        setValue={setLlmValue}
                        placeholder={placeholder}
                        dropDownStyle={{backgroundColor: '#fafafa'}}
                        containerStyle={styles.LLM}
                        onSelectItem={(item) => handleSelectItem(item)}
                    />

              }
          } />
          <Drawer.Screen name="Tools" component={Tools} options={
              {
                headerTitle:"Tools",
                headerRight:()=>
                    <DropDownPicker
                        open={open}
                        items={llmsData}
                        setOpen={setOpen}
                        value={llmValue}
                        setValue={setLlmValue}
                        placeholder={placeholder}
                        dropDownStyle={{backgroundColor: '#fafafa'}}
                        containerStyle={styles.LLM}
                        onSelectItem={(item) => handleSelectItem(item)}
                    />

              }
          }/>
          <Drawer.Screen name="Account" component={Account} />
          <Drawer.Screen name="Payment" component={Payment} />
          
      </Drawer.Navigator>

  );
};



const AuthStack = () => {
  return (
    <Auth.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={DalaiLLamaSearch} options={{headerShown:false}}/>
    </Auth.Navigator>
  );
}

const BusinessTools = () =>{

  return (
    <ToolsStack.Navigator>
      <ToolsStack.Screen name="Tools" component={Tools}  />
      
      <ToolsStack.Screen name="llamaContent" component={llamaContent}  options={{headerShown:true, title: 'Content',
            headerStyle: {
              backgroundColor: 'gray'
           }
      }}/>
    </ToolsStack.Navigator>
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