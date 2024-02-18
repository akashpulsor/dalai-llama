import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Home from './component/home';
import Tools from './component/tools';
import llamaSeo from './component/llamaSeo';
import llamaContent from './component/llamaContent';
import BuisnessLogin from './component/BuisnessLogin';
import Payment from './component/Payment';
import Account from './component/Account';
import CustomHeader from './component/CustomHeader';
import { NavigationContainer } from "@react-navigation/native";
import { DrawerItemList } from "@react-navigation/drawer";
import styles from './styles';
import User from "./assets/wordpress-logo.png";
const Auth = createStackNavigator();

// Create stack navigator for cards
const Stack = createStackNavigator();


const Drawer = createDrawerNavigator();

const HomeStack = () => {
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
              >Isabella Joanna</Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#111"
                }}
              >Product Manager</Text>
            </View>
            <DrawerItemList {...props} />
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
          <Drawer.Screen name="Tools" component={Tools} />
          <Drawer.Screen name="Account" component={Account} />
          <Drawer.Screen name="Payment" component={Payment} />

      </Drawer.Navigator>

  );
};

const AuthStack = () => {
  return (
    <Auth.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={BuisnessLogin} options={{headerShown:false}}/>
    </Auth.Navigator>
  );
}



export default function AppStack() {

    const isLoggedIn = true;
    console.log("Called Auth Stack");
  return (
      !isLoggedIn? <AuthStack/> : <HomeStack/>
  );
};