import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppAlert, AlertSeverity} from '../types';

const INITIAL_ALERTS: AppAlert[] = [
  {
    id: 'a1',
    title: 'Multiple failed attempts',
    body: 'ADMIN- OUTSIDE READER had 5 failed access attempts in the last hour.',
    severity: 'critical',
    lockId: '2',
    lockName: 'ADMIN- OUTSIDE READER',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    read: false,
  },
  {
    id: 'a2',
    title: 'Door held open',
    body: 'MAIN ENTRANCE READER has been open for more than 60 seconds.',
    severity: 'warning',
    lockId: '7',
    lockName: 'MAIN ENTRANCE READER',
    timestamp: new Date(Date.now() - 22 * 60 * 1000),
    read: false,
  },
  {
    id: 'a3',
    title: 'Invite accepted',
    body: 'Lena Torres accepted their invitation and activated their digital key.',
    severity: 'info',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
  },
  {
    id: 'a4',
    title: 'Reader offline',
    body: 'COMPASS- OUTSIDE READER went offline. Check device power and connectivity.',
    severity: 'warning',
    lockId: '4',
    lockName: 'COMPASS- OUTSIDE READER',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'a5',
    title: 'Digital key expiring soon',
    body: "Mike Davis's guest access expires in 7 days. Renew to maintain access.",
    severity: 'info',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'a6',
    title: 'Access outside schedule',
    body: 'John Smith accessed COMPASS- INSIDE READER outside of Business Hours.',
    severity: 'warning',
    lockId: '3',
    lockName: 'COMPASS- INSIDE READER',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    read: true,
  },
];

const SEVERITY_CONFIG: Record<AlertSeverity, {color: string; bg: string; icon: string}> = {
  critical: {color: '#f44336', bg: '#ffebee', icon: 'alert-circle'},
  warning: {color: '#f59e0b', bg: '#fffbeb', icon: 'alert'},
  info: {color: '#1565c0', bg: '#e3f2fd', icon: 'information'},
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  if (diff < 86400) {return `${Math.floor(diff / 3600)}h ago`;}
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  onClose: () => void;
}

export default function NotificationsScreen({onClose}: Props) {
  const [alerts, setAlerts] = useState<AppAlert[]>(INITIAL_ALERTS);
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');

  const unreadCount = alerts.filter(a => !a.read).length;

  const filtered = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  const markAllRead = () =>
    setAlerts(prev => prev.map(a => ({...a, read: true})));

  const markRead = (id: string) =>
    setAlerts(prev => prev.map(a => a.id === id ? {...a, read: true} : a));

  const dismiss = (id: string) =>
    setAlerts(prev => prev.filter(a => a.id !== id));

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear', style: 'destructive', onPress: () => setAlerts([])},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} style={styles.backBtn}>
          <Icon name="check-all" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'critical', 'warning', 'info'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}>
            {f !== 'all' && (
              <View
                style={[
                  styles.chipDot,
                  {backgroundColor: SEVERITY_CONFIG[f as AlertSeverity].color},
                ]}
              />
            )}
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const cfg = SEVERITY_CONFIG[item.severity];
          return (
            <TouchableOpacity
              style={[styles.alertCard, !item.read && styles.alertCardUnread]}
              onPress={() => markRead(item.id)}
              activeOpacity={0.8}>
              {/* Unread indicator */}
              {!item.read && <View style={[styles.unreadBar, {backgroundColor: cfg.color}]} />}

              <View style={[styles.alertIcon, {backgroundColor: cfg.bg}]}>
                <Icon name={cfg.icon} size={22} color={cfg.color} />
              </View>

              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, !item.read && styles.alertTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.alertTime}>{timeAgo(item.timestamp)}</Text>
                </View>
                <Text style={styles.alertBody} numberOfLines={2}>{item.body}</Text>
                {item.lockName && (
                  <View style={styles.lockTag}>
                    <Icon name="lock-outline" size={11} color="#888" />
                    <Text style={styles.lockTagText}>{item.lockName}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => dismiss(item.id)}>
                <Icon name="close" size={16} color="#ccc" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-check-outline" size={56} color="#ddd" />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>No notifications to show</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 && styles.emptyContainer}
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
  },
  backBtn: {padding: 4},
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  headerBadge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  chipActive: {backgroundColor: '#1565c0'},
  chipDot: {width: 7, height: 7, borderRadius: 3.5},
  chipText: {fontSize: 12, color: '#666', fontWeight: '500'},
  chipTextActive: {color: '#fff'},
  clearBtn: {marginLeft: 'auto'},
  clearText: {fontSize: 12, color: '#f44336', fontWeight: '500'},
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  alertCardUnread: {
    backgroundColor: '#fafcff',
    shadowOpacity: 0.08,
    elevation: 2,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 6,
  },
  alertContent: {flex: 1},
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    flex: 1,
    marginRight: 8,
  },
  alertTitleUnread: {fontWeight: '700', color: '#222'},
  alertTime: {fontSize: 11, color: '#aaa', marginTop: 1},
  alertBody: {fontSize: 13, color: '#666', lineHeight: 18},
  lockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  lockTagText: {fontSize: 11, color: '#888'},
  dismissBtn: {padding: 4, marginLeft: 4},
  empty: {alignItems: 'center', paddingTop: 80},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#bbb', marginTop: 16},
  emptyText: {fontSize: 14, color: '#ccc', marginTop: 4},
  emptyContainer: {flexGrow: 1},
});
