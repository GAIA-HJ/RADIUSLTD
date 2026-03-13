import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Lock, Person, AccessEvent} from '../types';
import {MOCK_PEOPLE, MOCK_EVENTS, MOCK_ACCESS_GROUPS} from '../data/mockLocks';

interface Props {
  lock: Lock;
  onClose: () => void;
  onRemoteOpen: (lockId: string) => void;
}

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

export default function LockDetailScreen({lock, onClose, onRemoteOpen}: Props) {
  const [autoLock, setAutoLock] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [alwaysUnlocked, setAlwaysUnlocked] = useState(false);

  const accessPeople: Person[] = MOCK_PEOPLE.filter(p =>
    p.accessLocks.includes(lock.id),
  );

  const recentEvents: AccessEvent[] = MOCK_EVENTS.filter(
    e => e.lockId === lock.id,
  ).slice(0, 5);

  const groups = MOCK_ACCESS_GROUPS.filter(g => g.lockIds.includes(lock.id));

  const handleRemoteOpen = () => {
    Alert.alert(
      'Open Door',
      `Remotely open "${lock.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open', onPress: () => onRemoteOpen(lock.id)},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lock.name}
          </Text>
          <Text style={styles.headerSub}>{lock.location}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Icon name="dots-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status hero card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.lockIconCircle,
              lock.status === 'offline' && styles.lockIconCircleOffline,
            ]}>
            <Icon
              name={lock.isOpen ? 'lock-open-outline' : 'lock-outline'}
              size={40}
              color={lock.status === 'offline' ? '#bbb' : '#1565c0'}
            />
          </View>
          <View style={styles.heroStatus}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  lock.status === 'offline' && styles.statusDotOffline,
                ]}
              />
              <Text style={styles.statusText}>
                {lock.status === 'offline' ? 'Offline' : lock.isOpen ? 'Open' : 'Locked'}
              </Text>
            </View>
            <Text style={styles.heroMeta}>
              {accessPeople.length} people · {groups.length} group
              {groups.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.openBtn,
              lock.status === 'offline' && styles.openBtnDisabled,
            ]}
            onPress={handleRemoteOpen}
            disabled={lock.status === 'offline'}>
            <Icon name="lock-open-variant-outline" size={18} color="#fff" />
            <Text style={styles.openBtnText}>Open</Text>
          </TouchableOpacity>
        </View>

        {/* Access groups */}
        {groups.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Access Groups</Text>
            <View style={styles.groupsRow}>
              {groups.map(g => (
                <View key={g.id} style={[styles.groupChip, {borderColor: g.color}]}>
                  <View style={[styles.groupDot, {backgroundColor: g.color}]} />
                  <Text style={[styles.groupChipText, {color: g.color}]}>
                    {g.name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* People with access */}
        <Text style={styles.sectionTitle}>
          Who Has Access ({accessPeople.length})
        </Text>
        {accessPeople.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No one assigned to this door</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {accessPeople.map((person, idx) => (
              <View
                key={person.id}
                style={[
                  styles.personRow,
                  idx < accessPeople.length - 1 && styles.personRowBorder,
                ]}>
                <View style={styles.personAvatar}>
                  <Text style={styles.personInitials}>
                    {person.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRole}>{person.role}</Text>
                </View>
                <View
                  style={[
                    styles.inviteDot,
                    person.inviteStatus !== 'active' && styles.inviteDotPending,
                  ]}
                />
              </View>
            ))}
          </View>
        )}

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {recentEvents.map((event, idx) => (
              <View
                key={event.id}
                style={[
                  styles.eventRow,
                  idx < recentEvents.length - 1 && styles.eventRowBorder,
                ]}>
                <View
                  style={[
                    styles.eventIcon,
                    !event.success && styles.eventIconFail,
                  ]}>
                  <Icon
                    name={METHOD_ICON[event.method]}
                    size={16}
                    color={event.success ? '#1565c0' : '#f44336'}
                  />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventPerson}>{event.personName}</Text>
                  <Text style={styles.eventMethod}>{event.method.replace('_', ' ')}</Text>
                </View>
                <View style={styles.eventRight}>
                  <Text style={styles.eventTime}>{timeAgo(event.timestamp)}</Text>
                  <Icon
                    name={event.success ? 'check-circle' : 'close-circle'}
                    size={14}
                    color={event.success ? '#4caf50' : '#f44336'}
                    style={styles.eventStatus}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Door settings */}
        <Text style={styles.sectionTitle}>Door Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="lock-clock" size={20} color="#555" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>Auto-lock</Text>
                <Text style={styles.settingDesc}>Lock after 5 seconds</Text>
              </View>
            </View>
            <Switch
              value={autoLock}
              onValueChange={setAutoLock}
              trackColor={{false: '#ddd', true: '#bbdefb'}}
              thumbColor={autoLock ? '#1565c0' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Icon name="bell-outline" size={20} color="#555" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>Access notifications</Text>
                <Text style={styles.settingDesc}>Alert on each access</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{false: '#ddd', true: '#bbdefb'}}
              thumbColor={notifications ? '#1565c0' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Icon name="lock-open-outline" size={20} color="#e65100" style={styles.settingIcon} />
              <View>
                <Text style={[styles.settingLabel, {color: '#e65100'}]}>
                  Always unlocked
                </Text>
                <Text style={styles.settingDesc}>Override schedule</Text>
              </View>
            </View>
            <Switch
              value={alwaysUnlocked}
              onValueChange={v => {
                if (v) {
                  Alert.alert(
                    'Always Unlocked',
                    'This will keep the door open regardless of schedule. Continue?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {text: 'Enable', onPress: () => setAlwaysUnlocked(true)},
                    ],
                  );
                } else {
                  setAlwaysUnlocked(false);
                }
              }}
              trackColor={{false: '#ddd', true: '#ffccbc'}}
              thumbColor={alwaysUnlocked ? '#e65100' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* BLE device ID */}
        {lock.bleDeviceId && (
          <>
            <Text style={styles.sectionTitle}>Hardware</Text>
            <View style={styles.card}>
              <View style={styles.hardwareRow}>
                <Icon name="bluetooth" size={16} color="#888" />
                <Text style={styles.hardwareLabel}>BLE Device ID</Text>
                <Text style={styles.hardwareValue}>{lock.bleDeviceId}</Text>
              </View>
            </View>
          </>
        )}

        <View style={{height: 32}} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {padding: 4},
  headerCenter: {flex: 1, alignItems: 'center', marginHorizontal: 8},
  headerTitle: {color: '#fff', fontSize: 16, fontWeight: '700'},
  headerSub: {color: '#bbdefb', fontSize: 11, marginTop: 1},
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  lockIconCircleOffline: {backgroundColor: '#f5f5f5'},
  heroStatus: {flex: 1},
  statusRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 6,
  },
  statusDotOffline: {backgroundColor: '#bdbdbd'},
  statusText: {fontSize: 15, fontWeight: '700', color: '#222'},
  heroMeta: {fontSize: 12, color: '#888'},
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565c0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  openBtnDisabled: {backgroundColor: '#bdbdbd'},
  openBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  groupsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    gap: 6,
  },
  groupDot: {width: 8, height: 8, borderRadius: 4},
  groupChipText: {fontSize: 12, fontWeight: '600'},
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {color: '#bbb', fontSize: 14},
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  personRowBorder: {borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitials: {color: '#fff', fontWeight: '700', fontSize: 12},
  personInfo: {flex: 1},
  personName: {fontSize: 14, fontWeight: '600', color: '#222'},
  personRole: {fontSize: 12, color: '#888', marginTop: 1, textTransform: 'capitalize'},
  inviteDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50'},
  inviteDotPending: {backgroundColor: '#ffa000'},
  eventRow: {flexDirection: 'row', alignItems: 'center', padding: 12},
  eventRowBorder: {borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  eventIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventIconFail: {backgroundColor: '#ffebee'},
  eventInfo: {flex: 1},
  eventPerson: {fontSize: 14, fontWeight: '600', color: '#222'},
  eventMethod: {fontSize: 12, color: '#888', marginTop: 1, textTransform: 'capitalize'},
  eventRight: {alignItems: 'flex-end'},
  eventTime: {fontSize: 12, color: '#aaa'},
  eventStatus: {marginTop: 3},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingRowBorder: {borderTopWidth: 1, borderTopColor: '#f5f5f5'},
  settingLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  settingIcon: {marginRight: 12},
  settingLabel: {fontSize: 14, fontWeight: '600', color: '#222'},
  settingDesc: {fontSize: 12, color: '#888', marginTop: 1},
  hardwareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  hardwareLabel: {fontSize: 13, color: '#888', flex: 1},
  hardwareValue: {fontSize: 12, color: '#555', fontFamily: 'monospace'},
});
