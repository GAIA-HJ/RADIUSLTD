import React, {useState} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LocksProvider} from './src/context/LocksContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        {isLoggedIn ? (
          <LocksProvider>
            <RootNavigator />
          </LocksProvider>
        ) : (
          <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
