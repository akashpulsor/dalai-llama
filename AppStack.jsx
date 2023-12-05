import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Home from './component/home';
import Tools from './component/tools';
import llamaSeo from './component/llamaSeo';
import llamaContent from './component/llamaContent';

const Stack = createStackNavigator();

export default function AppStack() {
    console.log("Called Auth Stack");
  return (
    
    <Stack.Navigator  options={{headerShown:false}} initialRouteName='Home'>
      <Stack.Screen name="Home" component={Home} options={{headerShown:false}} />
      <Stack.Screen name="LLAMACONTENT" component={llamaContent} options={{headerShown:false}}/>
      <Stack.Screen name="LLAMASEO" component={llamaSeo} options={{headerShown:false}}/>
      <Stack.Screen name="Tools" component={Tools} options={{headerShown:false}} />
    </Stack.Navigator>
  );
};