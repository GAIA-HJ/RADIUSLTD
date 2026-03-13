import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useLocks} from '../context/LocksContext';

const METHOD_ICON: Record<string, string> = {
  remote: 'cellphone-wireless',
  digital_key: 'nfc',
  card: 'card-account-details-outline',
};

const METHOD_LABEL: Record<string, string> = {
  remote: 'Remote',
  digital_key: 'Digital Key',
  card: 'Card',
};

type Filter = 'all' | 'success' | 'failed' | 'remote' | 'digital_key' | 'card';

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  if (diff < 86400) {return `${Math.floor(diff / 3600)}h ago`;}
  return date.toLocaleDateString();
}

export default function EventsScreen() {
  const {events} = useLocks();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    let result = [...events];
    if (filter === 'success') {result = result.filter(e => e.success);}
    else if (filter === 'failed') {result = result.filter(e => !e.success);}
    else if (filter !== 'all') {result = result.filter(e => e.method === filter);}
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        e =>
          e.lockName.toLowerCase().includes(q) ||
          e.personName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [events, filter, search]);

  const successCount = events.filter(e => e.success).length;
  const failedCount = events.filter(e => !e.success).length;

  const handleExport = async () => {
    const csv = [
      'Lock,Person,Method,Result,Time',
      ...filtered.map(e =>
        [
          e.lockName,
          e.personName,
          METHOD_LABEL[e.method],
          e.success ? 'Granted' : 'Denied',
          e.timestamp.toLocaleString(),
        ].join(','),
      ),
    ].join('\n');

    try {
      await Share.share({message: csv, title: 'Access Events Export'});
    } catch {
      Alert.alert('Export', 'Could not share the export.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />

      <View style={styles.header}>
        {showSearch ? (
          <>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search lock or person..."
              placeholderTextColor="#99bbdd"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {setSearch(''); setShowSearch(false);}}
              style={styles.headerBtn}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Events</Text>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowSearch(true)}>
              <Icon name="magnify" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleExport}>
              <Icon name="export-variant" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{events.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, {color: '#4caf50'}]}>{successCount}</Text>
          <Text style={styles.summaryLabel}>Granted</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, {color: '#f44336'}]}>{failedCount}</Text>
          <Text style={styles.summaryLabel}>Denied</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(
          [
            {key: 'all', label: 'All'},
            {key: 'success', label: 'Granted'},
            {key: 'failed', label: 'Denied'},
            {key: 'remote', label: 'Remote'},
            {key: 'digital_key', label: 'Digital Key'},
            {key: 'card', label: 'Card'},
          ] as {key: Filter; label: string}[]
        ).map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={[styles.methodIcon, !item.success && styles.methodIconFail]}>
              <Icon
                name={METHOD_ICON[item.method]}
                size={20}
                color={item.success ? '#1565c0' : '#f44336'}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.lockName} numberOfLines={1}>{item.lockName}</Text>
              <View style={styles.metaRow}>
                <Icon name="account-outline" size={12} color="#aaa" />
                <Text style={styles.person}>{item.personName}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.method}>{METHOD_LABEL[item.method]}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
              <View style={styles.resultBadge}>
                <Icon
                  name={item.success ? 'check-circle' : 'close-circle'}
                  size={14}
                  color={item.success ? '#4caf50' : '#f44336'}
                />
                <Text style={[styles.resultText, {color: item.success ? '#4caf50' : '#f44336'}]}>
                  {item.success ? 'Granted' : 'Denied'}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={48} color="#ddd" />
            <Text style={styles.emptyText}>
              {search ? 'No results found' : 'No events yet'}
            </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {flex: 1, color: '#fff', fontSize: 18, fontWeight: '700'},
  headerBtn: {padding: 4},
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
    paddingVertical: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryValue: {fontSize: 22, fontWeight: '700', color: '#222'},
  summaryLabel: {fontSize: 11, color: '#aaa', marginTop: 1},
  summaryDivider: {width: 1, backgroundColor: '#f0f0f0'},
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#f0f0f0'},
  chipActive: {backgroundColor: '#1565c0'},
  chipText: {fontSize: 12, color: '#666', fontWeight: '500'},
  chipTextActive: {color: '#fff'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconFail: {backgroundColor: '#ffebee'},
  info: {flex: 1},
  lockName: {fontSize: 14, fontWeight: '600', color: '#222'},
  metaRow: {flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4},
  person: {fontSize: 12, color: '#888'},
  dot: {fontSize: 12, color: '#ccc'},
  method: {fontSize: 12, color: '#1565c0'},
  right: {alignItems: 'flex-end', marginLeft: 8},
  time: {fontSize: 11, color: '#aaa'},
  resultBadge: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4},
  resultText: {fontSize: 11, fontWeight: '600'},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyText: {color: '#bbb', fontSize: 15, marginTop: 12},
});
