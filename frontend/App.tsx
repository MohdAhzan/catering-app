
import React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from './src/store/useStore';

console.log(useAuthStore);

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>USESTORE TEST</Text>
    </View>
  );
}

//import React from 'react';
//import LoginScreen from './src/screens/LoginScreen';
//
//export default function App() {
//  return <LoginScreen />;
//}
//

//import 'react-native-gesture-handler';
//import React, { useEffect } from 'react';
//import { StatusBar } from 'expo-status-bar';
//import { NavigationContainer } from '@react-navigation/native';
//import { SafeAreaProvider } from 'react-native-safe-area-context';
//import { useAuthStore } from './src/store/useStore';
//import RootNavigator from './src/navigation/RootNavigator';
//import { LoadingScreen } from './src/components';
//
//export default function App() {
//  const { isLoading, loadStoredAuth } = useAuthStore();
//
//  useEffect(() => {
//    loadStoredAuth();
//  }, []);
//
//  if (isLoading) return <LoadingScreen />;
//
//  return (
//    <SafeAreaProvider>
//      <NavigationContainer>
//        <StatusBar style="light" backgroundColor="#0D1B2A" />
//        <RootNavigator />
//      </NavigationContainer>
//    </SafeAreaProvider>
//  );
//}
