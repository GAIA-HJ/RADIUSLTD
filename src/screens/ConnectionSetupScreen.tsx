/**
 * ConnectionSetupScreen — in-app SALTO KS connection wizard
 *
 * Lets users connect to SALTO KS without editing source code.
 * Supports two paths:
 *   1. Seam (easiest) — enter a single API key from console.seam.co
 *   2. SALTO KS Direct — enter Client ID, Client Secret, Site ID from KSConnect Partner
 */
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CredentialStore, {StoredCredentials} from '../services/api/CredentialStore';
import {ApiProviderType} from '../services/api/ApiProvider';

type Tab = 'seam' | 'salto' | 'mock';

interface Props {
  onClose: () => void;
  onConnected: (provider: ApiProviderType) => void;
}

export default function ConnectionSetupScreen({onClose, onConnected}: Props) {
  const [tab, setTab] = useState<Tab>('seam');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Seam fields
  const [seamApiKey, setSeamApiKey] = useState('');
  const [showSeamKey, setShowSeamKey] = useState(false);

  // SALTO direct fields
  const [saltoClientId, setSaltoClientId] = useState('');
  const [saltoClientSecret, setSaltoClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saltoSiteId, setSaltoSiteId] = useState('');
  const [saltoBaseUrl, setSaltoBaseUrl] = useState('https://api.saltoks.com/v1');

  // Success animation
  const checkScale = useRef(new Animated.Value(0)).current;

  const animateSuccess = () => {
    Animated.spring(checkScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 5,
    }).start();
  };

  // ─── Seam test ─────────────────────────────────────────────────────────────
  const testSeam = async () => {
    if (!seamApiKey.trim()) {
      Alert.alert('Missing API Key', 'Please enter your Seam API key.');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('https://connect.getseam.com/devices/list', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${seamApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
      }
      await saveAndFinish({provider: 'seam', seamApiKey: seamApiKey.trim()});
    } catch (err: any) {
      setTesting(false);
      Alert.alert('Connection Failed', err?.message ?? 'Could not reach Seam API.');
    }
  };

  // ─── SALTO direct test ──────────────────────────────────────────────────────
  const testSalto = async () => {
    if (!saltoClientId.trim() || !saltoClientSecret.trim() || !saltoSiteId.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Client ID, Client Secret, and Site ID.');
      return;
    }
    setTesting(true);
    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: saltoClientId.trim(),
        client_secret: saltoClientSecret.trim(),
        scope: 'locks:read',
      });
      const res = await fetch('https://auth.saltoks.com/oauth2/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Auth failed (${res.status}): ${text.slice(0, 120)}`);
      }
      await saveAndFinish({
        provider: 'salto',
        saltoClientId: saltoClientId.trim(),
        saltoClientSecret: saltoClientSecret.trim(),
        saltoSiteId: saltoSiteId.trim(),
        saltoBaseUrl: saltoBaseUrl.trim() || 'https://api.saltoks.com/v1',
      });
    } catch (err: any) {
      setTesting(false);
      Alert.alert('Connection Failed', err?.message ?? 'Could not authenticate with SALTO KS.');
    }
  };

  // ─── Mock / offline ─────────────────────────────────────────────────────────
  const useMock = async () => {
    setTesting(true);
    await saveAndFinish({provider: 'mock'});
  };

  // ─── Save + finish ───────────────────────────────────────────────────────────
  const saveAndFinish = async (creds: StoredCredentials) => {
    await CredentialStore.save(creds);
    setTesting(false);
    setConnected(true);
    animateSuccess();
    setTimeout(() => onConnected(creds.provider), 1400);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (connected) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successCenter}>
          <Animated.View style={[styles.successCircle, {transform: [{scale: checkScale}]}]}>
            <Icon name="check-bold" size={52} color="#fff" />
          </Animated.View>
          <Text style={styles.successTitle}>Connected!</Text>
          <Text style={styles.successSub}>Your SALTO KS credentials have been saved.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Icon name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Connect to SALTO KS</Text>
          <Text style={styles.headerSub}>No code editing required</Text>
        </View>
        <View style={{width: 36}} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Tab selector */}
        <View style={styles.tabRow}>
          {([
            {key: 'seam', label: 'Seam', icon: 'lightning-bolt'},
            {key: 'salto', label: 'SALTO Direct', icon: 'api'},
            {key: 'mock', label: 'Offline', icon: 'wifi-off'},
          ] as const).map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}>
              <Icon name={t.icon} size={16} color={tab === t.key ? '#1565c0' : '#888'} />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Seam panel ── */}
        {tab === 'seam' && (
          <View style={styles.panel}>
            <View style={styles.infoBox}>
              <Icon name="information-outline" size={16} color="#1565c0" style={{marginTop: 1}} />
              <Text style={styles.infoText}>
                Seam wraps SALTO KS behind a single API key — the fastest way to get started.
                Sign up free at{' '}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL('https://console.seam.co')}>
                  console.seam.co
                </Text>
              </Text>
            </View>

            <Text style={styles.label}>Seam API Key</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                placeholder="seam_test2ZTo_… or seam_prod…"
                placeholderTextColor="#aaa"
                value={seamApiKey}
                onChangeText={setSeamApiKey}
                secureTextEntry={!showSeamKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowSeamKey(v => !v)}>
                <Icon name={showSeamKey ? 'eye-off' : 'eye'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              In Seam Console → API Keys → Create API Key. Use a sandbox key to test with mock
              devices, or a production key for real hardware.
            </Text>

            <TouchableOpacity
              style={[styles.connectBtn, testing && styles.connectBtnDisabled]}
              onPress={testSeam}
              disabled={testing}>
              {testing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="connection" size={18} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.connectBtnText}>Test & Connect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── SALTO Direct panel ── */}
        {tab === 'salto' && (
          <View style={styles.panel}>
            <View style={styles.infoBox}>
              <Icon name="shield-key-outline" size={16} color="#1565c0" style={{marginTop: 1}} />
              <Text style={styles.infoText}>
                Direct KSConnect Partner API access. Apply at{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://developer.saltosystems.com/ks/connect-api/')
                  }>
                  developer.saltosystems.com
                </Text>
              </Text>
            </View>

            <Text style={styles.label}>Client ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Your KSConnect Client ID"
              placeholderTextColor="#aaa"
              value={saltoClientId}
              onChangeText={setSaltoClientId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Client Secret</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                placeholder="Your KSConnect Client Secret"
                placeholderTextColor="#aaa"
                value={saltoClientSecret}
                onChangeText={setSaltoClientSecret}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowSecret(v => !v)}>
                <Icon name={showSecret ? 'eye-off' : 'eye'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Site ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Found in SALTO KS dashboard"
              placeholderTextColor="#aaa"
              value={saltoSiteId}
              onChangeText={setSaltoSiteId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Base URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://api.saltoks.com/v1"
              placeholderTextColor="#aaa"
              value={saltoBaseUrl}
              onChangeText={setSaltoBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <TouchableOpacity
              style={[styles.connectBtn, testing && styles.connectBtnDisabled]}
              onPress={testSalto}
              disabled={testing}>
              {testing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="connection" size={18} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.connectBtnText}>Test & Connect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Offline/Mock panel ── */}
        {tab === 'mock' && (
          <View style={styles.panel}>
            <View style={styles.infoBox}>
              <Icon name="database-outline" size={16} color="#1565c0" style={{marginTop: 1}} />
              <Text style={styles.infoText}>
                Use built-in mock data. No API credentials needed. Perfect for demos and UI
                development.
              </Text>
            </View>

            <View style={styles.mockFeatures}>
              {[
                '8 pre-configured mock readers',
                'Simulated remote open (1.2 s delay)',
                'Mock audit log with sample events',
                'Full UI works without internet',
              ].map(f => (
                <View key={f} style={styles.mockFeatureRow}>
                  <Icon name="check-circle-outline" size={16} color="#43a047" />
                  <Text style={styles.mockFeatureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.connectBtn, styles.connectBtnMock, testing && styles.connectBtnDisabled]}
              onPress={useMock}
              disabled={testing}>
              {testing ? (
                <ActivityIndicator color="#1565c0" />
              ) : (
                <>
                  <Icon name="play-circle-outline" size={18} color="#1565c0" style={{marginRight: 8}} />
                  <Text style={[styles.connectBtnText, {color: '#1565c0'}]}>Use Mock Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    backgroundColor: '#1565c0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  closeBtn: {padding: 6},
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {color: '#fff', fontSize: 17, fontWeight: '700'},
  headerSub: {color: '#bbdefb', fontSize: 11, marginTop: 1},
  scroll: {flex: 1},

  // Tabs
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#e8eef8',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  tabBtnActive: {backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2},
  tabLabel: {fontSize: 12, color: '#888', fontWeight: '600'},
  tabLabelActive: {color: '#1565c0'},

  // Panel
  panel: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {fontSize: 13, color: '#1565c0', flex: 1, lineHeight: 19},
  link: {textDecorationLine: 'underline', fontWeight: '600'},

  label: {fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5},
  inputRow: {flexDirection: 'row', alignItems: 'center'},
  input: {
    backgroundColor: '#f5f7fb',
    borderWidth: 1,
    borderColor: '#dde3ee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#222',
  },
  eyeBtn: {padding: 10, marginLeft: 4},
  hint: {fontSize: 12, color: '#888', marginTop: 8, lineHeight: 17},

  connectBtn: {
    backgroundColor: '#1565c0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  connectBtnDisabled: {opacity: 0.6},
  connectBtnMock: {backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9'},
  connectBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},

  // Mock features
  mockFeatures: {gap: 10, marginBottom: 8},
  mockFeatureRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  mockFeatureText: {fontSize: 14, color: '#333'},

  // Success
  successCenter: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40},
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#43a047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#43a047',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {fontSize: 26, fontWeight: '800', color: '#222', marginBottom: 8},
  successSub: {fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22},
});
