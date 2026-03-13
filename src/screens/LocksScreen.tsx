import React, {useState, useMemo} from 'react';
import {
  View,
  SectionList,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useLocks} from '../context/LocksContext';
import LockListItem from '../components/LockListItem';
import SearchBar from '../components/SearchBar';
import DigitalKeyModal from '../components/DigitalKeyModal';
import LockDetailScreen from './LockDetailScreen';
import NotificationsScreen from './NotificationsScreen';
import {Lock} from '../types';

// Extract zone from lock name, e.g. "ADMIN- INSIDE READER" → "ADMIN"
function getZone(name: string): string {
  const match = name.match(/^([A-Z\s]+?)[-\s]/);
  return match ? match[1].trim() : 'OTHER';
}

export default function LocksScreen() {
  const {locks, openingLockId, remoteOpen, loading, error, refresh} = useLocks();
  const [search, setSearch] = useState('');
  const [digitalKeyLock, setDigitalKeyLock] = useState<Lock | null>(null);
  const [detailLock, setDetailLock] = useState<Lock | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const UNREAD_ALERTS = 2; // would come from context in production

  const location =
    locks.length > 0 ? locks[0].location + ', All' : 'All Locations';

  // Group filtered locks by zone for SectionList
  const sections = useMemo(() => {
    const filtered = locks.filter(l =>
      l.name.toLowerCase().includes(search.toLowerCase()),
    );
    const map: Record<string, Lock[]> = {};
    for (const lock of filtered) {
      const zone = getZone(lock.name);
      if (!map[zone]) {map[zone] = [];}
      map[zone].push(lock);
    }
    return Object.entries(map).map(([zone, data]) => ({title: zone, data}));
  }, [locks, search]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="map-marker-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Locks</Text>
          <Text style={styles.headerSubtitle}>{location}</Text>
        </View>
        {/* Notification bell with badge */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setShowNotifications(true)}>
          <Icon name="bell-outline" size={22} color="#fff" />
          {UNREAD_ALERTS > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{UNREAD_ALERTS}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="dots-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* API error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Grouped list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({section}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
              {section.data.length} reader{section.data.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        renderItem={({item}) => (
          <LockListItem
            lock={item}
            isOpening={openingLockId === item.id}
            onPress={() => setDetailLock(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="lock-question" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No locks found</Text>
          </View>
        }
        contentContainerStyle={sections.length === 0 && styles.emptyContainer}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#1565c0" />
        }
      />

      {/* Digital Key FAB */}
      <TouchableOpacity
        style={styles.digitalKeyFab}
        onPress={() => setDigitalKeyLock(locks[6] ?? locks[0])}>
        <Icon name="nfc" size={20} color="#1565c0" />
        <Text style={styles.digitalKeyText}>DIGITAL KEY</Text>
      </TouchableOpacity>

      <DigitalKeyModal
        visible={digitalKeyLock !== null}
        lock={digitalKeyLock}
        onClose={() => setDigitalKeyLock(null)}
      />

      {/* Lock detail */}
      <Modal
        visible={detailLock !== null}
        animationType="slide"
        onRequestClose={() => setDetailLock(null)}>
        {detailLock && (
          <LockDetailScreen
            lock={detailLock}
            onClose={() => setDetailLock(null)}
            onRemoteOpen={id => {
              setDetailLock(null);
              remoteOpen(id);
            }}
          />
        )}
      </Modal>

      {/* Notifications */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}>
        <NotificationsScreen onClose={() => setShowNotifications(false)} />
      </Modal>
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
    gap: 4,
  },
  headerBtn: {padding: 4},
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  headerSubtitle: {color: '#bbdefb', fontSize: 12, marginTop: 1},
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f44336',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {color: '#fff', fontSize: 9, fontWeight: '700'},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4fa',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565c0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {fontSize: 11, color: '#888'},
  errorBanner: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  errorText: {fontSize: 13, color: '#c62828', textAlign: 'center'},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyText: {color: '#bbb', fontSize: 15, marginTop: 12},
  emptyContainer: {flexGrow: 1},
  digitalKeyFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  digitalKeyText: {
    color: '#1565c0',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
