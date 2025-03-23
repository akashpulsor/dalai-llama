import 'react-native-gesture-handler';
import { View, Platform } from 'react-native';
import styles from './styles';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import store from './component/store';
import FlashMessage from './component/FlashMessage';
import { Suspense, lazy } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Lazy load the AppStack component
const AppStack = lazy(() => import('./AppStack'));

// Loading component
const LoadingScreen = () => (
  <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
    {/* You can add a loading spinner here */}
  </View>
);

export default function App() {
  // Enable screens for web platform
  if (Platform.OS === 'web') {
    require('react-native-screens').enableScreens();
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <View style={styles.container}>
            <NavigationContainer>
              <Suspense fallback={<LoadingScreen />}>
                <AppStack />
              </Suspense>
            </NavigationContainer>
            <FlashMessage position="center" />
          </View>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}


