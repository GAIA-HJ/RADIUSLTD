import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MOCK_ACCESS_GROUPS, MOCK_SCHEDULES, MOCK_LOCKS, MOCK_PEOPLE} from '../data/mockLocks';
import {AccessGroup} from '../types';

interface Props {
  onClose: () => void;
}

export default function AccessGroupsScreen({onClose}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null);

  const getMemberCount = (groupId: string) =>
    MOCK_PEOPLE.filter(p => p.accessGroupIds.includes(groupId)).length;

  const getScheduleName = (schedId?: string) =>
    MOCK_SCHEDULES.find(s => s.id === schedId)?.name ?? 'No schedule';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Access Groups</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_ACCESS_GROUPS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedGroup(item)}>
            <View style={[styles.colorBar, {backgroundColor: item.color}]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.groupName}>{item.name}</Text>
                <View style={[styles.badge, {backgroundColor: item.color + '22'}]}>
                  <Text style={[styles.badgeText, {color: item.color}]}>
                    {getMemberCount(item.id)} members
                  </Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <Icon name="clock-outline" size={13} color="#aaa" />
                <Text style={styles.metaText}>{getScheduleName(item.scheduleId)}</Text>
                <Icon name="lock-outline" size={13} color="#aaa" style={styles.metaIcon} />
                <Text style={styles.metaText}>
                  {item.lockIds.length} door{item.lockIds.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      />

      {/* Group detail modal */}
      <Modal
        visible={selectedGroup !== null}
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}>
        {selectedGroup && (
          <SafeAreaView style={styles.safe}>
            <View style={[styles.header, {backgroundColor: selectedGroup.color}]}>
              <TouchableOpacity
                onPress={() => setSelectedGroup(null)}
                style={styles.backBtn}>
                <Icon name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{selectedGroup.name}</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Icon name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Schedule */}
              <Text style={styles.sectionTitle}>Schedule</Text>
              {(() => {
                const sched = MOCK_SCHEDULES.find(
                  s => s.id === selectedGroup.scheduleId,
                );
                return sched ? (
                  <View style={styles.scheduleCard}>
                    <Icon name="clock-outline" size={20} color="#1565c0" />
                    <View style={styles.schedInfo}>
                      <Text style={styles.schedName}>{sched.name}</Text>
                      <Text style={styles.schedDays}>{sched.days.join(' · ')}</Text>
                      <Text style={styles.schedTime}>
                        {sched.startTime} – {sched.endTime}
                      </Text>
                    </View>
                  </View>
                ) : null;
              })()}

              {/* Doors */}
              <Text style={styles.sectionTitle}>
                Doors ({selectedGroup.lockIds.length})
              </Text>
              {MOCK_LOCKS.filter(l => selectedGroup.lockIds.includes(l.id)).map(
                lock => (
                  <View key={lock.id} style={styles.lockRow}>
                    <View
                      style={[
                        styles.lockDot,
                        lock.status === 'offline' && styles.lockDotOffline,
                      ]}
                    />
                    <Text style={styles.lockName}>{lock.name}</Text>
                  </View>
                ),
              )}

              {/* Members */}
              <Text style={styles.sectionTitle}>
                Members ({getMemberCount(selectedGroup.id)})
              </Text>
              {MOCK_PEOPLE.filter(p =>
                p.accessGroupIds.includes(selectedGroup.id),
              ).map(person => (
                <View key={person.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitials}>
                      {person.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{person.name}</Text>
                    <Text style={styles.memberEmail}>{person.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      person.inviteStatus !== 'active' && styles.statusDotPending,
                    ]}
                  />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {padding: 4},
  addBtn: {padding: 4},
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {padding: 12},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  colorBar: {width: 5, alignSelf: 'stretch'},
  cardBody: {flex: 1, padding: 14},
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupName: {fontSize: 15, fontWeight: '700', color: '#222'},
  badge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  badgeText: {fontSize: 11, fontWeight: '700'},
  cardMeta: {flexDirection: 'row', alignItems: 'center'},
  metaText: {fontSize: 12, color: '#888', marginLeft: 4},
  metaIcon: {marginLeft: 12},
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
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  schedInfo: {flex: 1},
  schedName: {fontSize: 15, fontWeight: '600', color: '#222'},
  schedDays: {fontSize: 12, color: '#888', marginTop: 2},
  schedTime: {fontSize: 12, color: '#1565c0', marginTop: 2},
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  lockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 12,
  },
  lockDotOffline: {backgroundColor: '#ccc'},
  lockName: {fontSize: 14, color: '#333'},
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitials: {color: '#fff', fontWeight: '700', fontSize: 13},
  memberInfo: {flex: 1},
  memberName: {fontSize: 14, fontWeight: '600', color: '#222'},
  memberEmail: {fontSize: 12, color: '#888', marginTop: 2},
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  statusDotPending: {backgroundColor: '#ffa000'},
});
