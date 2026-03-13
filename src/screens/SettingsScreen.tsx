import React, {useState} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
}

function SettingRow({
  icon,
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={toggle && !onPress}>
      <Icon name={icon} size={22} color="#1565c0" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {toggle !== undefined && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{false: '#ddd', true: '#bbdefb'}}
          thumbColor={toggleValue ? '#1565c0' : '#f4f4f4'}
        />
      )}
      {!toggle && !value && (
        <Icon name="chevron-right" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [bleEnabled, setBleEnabled] = useState(true);
  const [nfcEnabled, setNfcEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoLock, setAutoLock] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView>
        {/* Profile section */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>RA</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Radius Admin</Text>
            <Text style={styles.profileEmail}>admin@radius.com</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Wireless</Text>
        <View style={styles.section}>
          <SettingRow
            icon="bluetooth"
            label="Bluetooth (BLE)"
            toggle
            toggleValue={bleEnabled}
            onToggle={setBleEnabled}
          />
          <SettingRow
            icon="nfc"
            label="NFC Digital Key"
            toggle
            toggleValue={nfcEnabled}
            onToggle={setNfcEnabled}
          />
        </View>

        <Text style={styles.sectionTitle}>Access</Text>
        <View style={styles.section}>
          <SettingRow
            icon="bell-outline"
            label="Push Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            icon="lock-clock"
            label="Auto-lock After Opening"
            toggle
            toggleValue={autoLock}
            onToggle={setAutoLock}
          />
          <SettingRow
            icon="map-marker-outline"
            label="Current Site"
            value="AL. MASHTAL"
          />
        </View>

        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.section}>
          <SettingRow icon="information-outline" label="Version" value="1.0.0" />
          <SettingRow icon="shield-check-outline" label="Privacy Policy" />
          <SettingRow icon="file-document-outline" label="Terms of Service" />
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Icon name="logout" size={18} color="#f44336" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    gap: 14,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {color: '#fff', fontWeight: '700', fontSize: 18},
  profileName: {fontSize: 16, fontWeight: '700', color: '#222'},
  profileEmail: {fontSize: 13, color: '#888', marginTop: 2},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowIcon: {marginRight: 14},
  rowLabel: {flex: 1, fontSize: 15, color: '#333'},
  rowValue: {fontSize: 14, color: '#888', marginRight: 8},
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 8,
  },
  logoutText: {color: '#f44336', fontSize: 15, fontWeight: '600'},
});
