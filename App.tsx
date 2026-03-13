import React, {useState, useEffect} from 'react';
import {Modal, View, ActivityIndicator, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LocksProvider} from './src/context/LocksContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ConnectionSetupScreen from './src/screens/ConnectionSetupScreen';
import {api} from './src/services/api/ApiProvider';
import {ApiProviderType} from './src/services/api/ApiProvider';

type AppState = 'loading' | 'login' | 'setup' | 'main';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [activeProvider, setActiveProvider] = useState<ApiProviderType>('mock');
  const [showConnectionSetup, setShowConnectionSetup] = useState(false);

  useEffect(() => {
    api.init().then(provider => {
      setActiveProvider(provider);
      setAppState('login');
    });
  }, []);

  const handleLogin = () => {
    setAppState('main');
  };

  const handleConnected = (provider: ApiProviderType) => {
    setActiveProvider(provider);
    api.switchTo(provider);
    setShowConnectionSetup(false);
  };

  if (appState === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        {appState === 'login' && (
          <LoginScreen onLogin={handleLogin} />
        )}
        {appState === 'main' && (
          <LocksProvider>
            <RootNavigator
              onOpenConnectionSetup={() => setShowConnectionSetup(true)}
              activeProvider={activeProvider}
            />
          </LocksProvider>
        )}

        {/* Connection setup modal — accessible from Settings at any time */}
        <Modal
          visible={showConnectionSetup}
          animationType="slide"
          onRequestClose={() => setShowConnectionSetup(false)}>
          <ConnectionSetupScreen
            onClose={() => setShowConnectionSetup(false)}
            onConnected={handleConnected}
          />
        </Modal>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5'},
});
