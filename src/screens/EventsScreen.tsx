import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useLocks} from '../context/LocksContext';

const METHOD_ICON: Record<string, string> = {
  remote: 'cellphone-wireless',
  digital_key: 'nfc',
  card: 'card-account-details-outline',
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  if (diff < 86400) {return `${Math.floor(diff / 3600)}h ago`;}
  return date.toLocaleDateString();
}

export default function EventsScreen() {
  const {events} = useLocks();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerCount}>{events.length} total</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View
              style={[
                styles.methodIcon,
                !item.success && styles.methodIconFail,
              ]}>
              <Icon
                name={METHOD_ICON[item.method]}
                size={20}
                color={item.success ? '#1565c0' : '#f44336'}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.lockName}>{item.lockName}</Text>
              <Text style={styles.personName}>{item.personName}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
              <Icon
                name={item.success ? 'check-circle' : 'close-circle'}
                size={16}
                color={item.success ? '#4caf50' : '#f44336'}
                style={styles.statusIcon}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    backgroundColor: '#1565c0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  headerCount: {color: '#bbdefb', fontSize: 13},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconFail: {backgroundColor: '#ffebee'},
  info: {flex: 1},
  lockName: {fontSize: 14, fontWeight: '600', color: '#222'},
  personName: {fontSize: 13, color: '#888', marginTop: 2},
  right: {alignItems: 'flex-end'},
  time: {fontSize: 12, color: '#aaa'},
  statusIcon: {marginTop: 4},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyText: {color: '#bbb', fontSize: 15, marginTop: 12},
});
