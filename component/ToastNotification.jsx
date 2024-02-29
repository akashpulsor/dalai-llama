import React, { useRef, useEffect } from 'react';

import {View,Text} from "react-native";
import Animated , { useSharedValue, withSpring, withTiming, runOnJS }from "react-native-reanimated";

const ToastNotification = (message, messageStyle) =>{
    const opacity = useSharedValue(0); // Initialize opacity to 0

    useEffect(() => {
        const fadeInAndOut = () => {
            opacity.value = withSpring(1, {}, () => {
                // Fade out after fade in animation completes
                runOnJS(fadeOut)();
            });
        };

        const fadeOut = () => {
            opacity.value = withTiming(0, {}, () => {
                // Optionally, you can perform any cleanup here after fade out
            });
        };

        fadeInAndOut(); // Trigger the animation when the component mounts
    }, []); // Dependency array is empty to ensure this effect runs only once
    return (
        <Animated.View
                         style={{
                                 top: 70,
                                 backgroundColor: '#20639B',
                                 width: '90%',
                                 position: 'absolute',
                                 borderRadius: 5,
                                 padding: 20,
                                 flexDirection: 'row',
                                 justifyContent: 'center',
                                 alignItems: 'center',
                                 shadowColor: '#003049',
                                 shadowOpacity: 0.4,
                                 shadowRadius: 2,
                                 shadowOffset: {width: 0, height: 1},
                                 elevation: 2,
                             }}>
            <View>
                <Text style={[{
                    color: '#F6F4F4',
                    fontWeight: '500',
                    marginLeft: 10,
                    fontSize: 14,
                },messageStyle]}>{message}</Text>
            </View>
        </Animated.View>
    );
}

export default ToastNotification;

