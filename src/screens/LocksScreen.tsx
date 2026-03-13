import React, {useState, useMemo} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useLocks} from '../context/LocksContext';
import LockListItem from '../components/LockListItem';
import SearchBar from '../components/SearchBar';
import DigitalKeyModal from '../components/DigitalKeyModal';
import LockDetailScreen from './LockDetailScreen';
import {Lock} from '../types';

export default function LocksScreen() {
  const {locks, openingLockId, remoteOpen} = useLocks();
  const [search, setSearch] = useState('');
  const [digitalKeyLock, setDigitalKeyLock] = useState<Lock | null>(null);
  const [detailLock, setDetailLock] = useState<Lock | null>(null);

  const filtered = useMemo(
    () =>
      locks.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [locks, search],
  );

  const location =
    locks.length > 0 ? locks[0].location + ', All' : 'All Locations';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft}>
          <Icon name="map-marker-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Locks</Text>
          <Text style={styles.headerSubtitle}>{location}</Text>
        </View>
        <TouchableOpacity style={styles.headerRight}>
          <Icon name="dots-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
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
        contentContainerStyle={filtered.length === 0 && styles.emptyContainer}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1565c0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#bbdefb',
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 15,
    marginTop: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
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
