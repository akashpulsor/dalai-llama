// Import necessary components from React Native
import React, { useState, useEffect, useRef } from 'react';
import { View, Text,  TouchableOpacity } from 'react-native';
import styles from '../styles';
import { useDispatch } from 'react-redux';
import {useLogoutMutation} from "./authApi";
// Create your functional component


const Logout = ({navigation}) => {
    const dispatch = useDispatch();
    const [logoutMutation, { isError, error }] = useLogoutMutation();
    const handleLogOut = async () =>{

        await logoutMutation();
    }
      

  return (
    // Main container with a gray background
    <View style={styles.container}>
       
       <View style={{marginTop:'98%',justifyContent:'center'}}>
              <TouchableOpacity onPress={()=>{handleLogOut()}} style={{ backgroundColor: '#d3d3d3', padding: 10, borderRadius: 10, height: 40 }}>
                    <Text style={{ fontSize: 14,marginVertical: 6,fontWeight: "bold",color: "#111", textAlign: 'center' }}>Logout</Text>
              </TouchableOpacity>
            </View>
    </View>
  );
};

// Export the component
export default Logout;
