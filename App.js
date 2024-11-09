import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import styles from './styles';
import  FlashMessage from "react-native-flash-message";
import {NavigationContainer} from '@react-navigation/native';
import AppStack from './AppStack';
import { Provider } from 'react-redux';
import { store } from './component/store';

export default function App() {
  return (
    <Provider store={store}>
        <View style={styles.container}>
          <NavigationContainer>
               <AppStack/> 
          </NavigationContainer>
            <FlashMessage position={"center"} />
      </View>
    </Provider>

  );
}


