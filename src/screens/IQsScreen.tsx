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
import {MOCK_IQS} from '../data/mockLocks';

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function IQsScreen() {
  const totalEntries = MOCK_IQS.reduce((s, m) => s + m.totalEntries, 0);
  const totalFailed = MOCK_IQS.reduce((s, m) => s + m.failedAttempts, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IQs</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalFailed}</Text>
        </View>
      </View>

      {/* Summary cards */}
      <View style={styles.cards}>
        <View style={styles.card}>
          <Icon name="door-open" size={28} color="#1565c0" />
          <Text style={styles.cardValue}>{totalEntries}</Text>
          <Text style={styles.cardLabel}>Total Entries</Text>
        </View>
        <View style={styles.card}>
          <Icon name="alert-circle-outline" size={28} color="#f44336" />
          <Text style={[styles.cardValue, {color: '#f44336'}]}>
            {totalFailed}
          </Text>
          <Text style={styles.cardLabel}>Failed Attempts</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>By Reader</Text>

      <FlatList
        data={MOCK_IQS}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.lockName}>{item.lockName}</Text>
              <Text style={styles.lastActivity}>
                Last activity: {timeAgo(item.lastActivity)}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.entries}>{item.totalEntries}</Text>
              {item.failedAttempts > 0 && (
                <Text style={styles.failed}>
                  {item.failedAttempts} failed
                </Text>
              )}
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700', flex: 1},
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  cards: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1565c0',
    marginTop: 6,
  },
  cardLabel: {fontSize: 12, color: '#888', marginTop: 2},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLeft: {flex: 1},
  lockName: {fontSize: 14, fontWeight: '600', color: '#222'},
  lastActivity: {fontSize: 12, color: '#aaa', marginTop: 2},
  rowRight: {alignItems: 'flex-end'},
  entries: {fontSize: 18, fontWeight: '700', color: '#1565c0'},
  failed: {fontSize: 12, color: '#f44336', marginTop: 2},
});
