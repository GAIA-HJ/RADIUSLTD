import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MOCK_PEOPLE, MOCK_ACCESS_GROUPS} from '../data/mockLocks';
import {Person} from '../types';
import InviteScreen from './InviteScreen';
import AccessGroupsScreen from './AccessGroupsScreen';

const ROLE_COLORS: Record<string, string> = {
  admin: '#1565c0',
  user: '#2e7d32',
  guest: '#e65100',
};

const INVITE_STATUS_COLORS: Record<string, string> = {
  active: '#4caf50',
  pending: '#ffa000',
  expired: '#bdbdbd',
};

type Filter = 'all' | 'admin' | 'user' | 'guest' | 'pending';

export default function PeopleScreen() {
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [filter, setFilter] = useState<Filter>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const filtered = people.filter(p => {
    if (filter === 'all') {return true;}
    if (filter === 'pending') {return p.inviteStatus === 'pending';}
    return p.role === filter;
  });

  const getGroupNames = (groupIds: string[]) =>
    MOCK_ACCESS_GROUPS.filter(g => groupIds.includes(g.id))
      .map(g => g.name)
      .join(', ') || 'No groups';

  const pendingCount = people.filter(p => p.inviteStatus === 'pending').length;

  const handleRevoke = (person: Person) => {
    Alert.alert(
      'Revoke Access',
      `Remove all access for ${person.name}? They will no longer be able to open any doors.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            setPeople(prev =>
              prev.map(p =>
                p.id === person.id
                  ? {...p, active: false, inviteStatus: 'expired', accessLocks: [], accessGroupIds: []}
                  : p,
              ),
            );
            setSelectedPerson(null);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>People</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowGroups(true)}>
          <Icon name="account-group-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowInvite(true)}>
          <Icon name="account-plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'admin', 'user', 'guest', 'pending'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => setSelectedPerson(item)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.avatar,
                !item.active && styles.avatarInactive,
              ]}>
              <Text style={styles.avatarText}>
                {item.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </Text>
            </View>

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, !item.active && styles.nameRevoked]}>
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.inviteDot,
                    {backgroundColor: INVITE_STATUS_COLORS[item.inviteStatus]},
                  ]}
                />
              </View>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.groups} numberOfLines={1}>
                {item.active ? getGroupNames(item.accessGroupIds) : 'Access revoked'}
              </Text>
            </View>

            {!item.active ? (
              <View style={styles.revokedBadge}>
                <Text style={styles.revokedText}>REVOKED</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.roleBadge,
                  {backgroundColor: ROLE_COLORS[item.role] + '22'},
                ]}>
                <Text style={[styles.roleText, {color: ROLE_COLORS[item.role]}]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="account-off-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No people found</Text>
          </View>
        }
      />

      {/* Person detail modal */}
      <Modal
        visible={selectedPerson !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPerson(null)}>
        {selectedPerson && (
          <View style={styles.detailOverlay}>
            <View style={styles.detailSheet}>
              <View style={styles.detailHandle} />

              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.detailAvatar,
                    {backgroundColor: ROLE_COLORS[selectedPerson.role]},
                  ]}>
                  <Text style={styles.detailAvatarText}>
                    {selectedPerson.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailName}>{selectedPerson.name}</Text>
                  <Text style={styles.detailEmail}>{selectedPerson.email}</Text>
                  {selectedPerson.phone && (
                    <Text style={styles.detailPhone}>{selectedPerson.phone}</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Role</Text>
                <View
                  style={[
                    styles.roleBadge,
                    {backgroundColor: ROLE_COLORS[selectedPerson.role] + '22'},
                  ]}>
                  <Text
                    style={[
                      styles.roleText,
                      {color: ROLE_COLORS[selectedPerson.role]},
                    ]}>
                    {selectedPerson.role.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Status</Text>
                <View style={styles.detailRowRight}>
                  <View
                    style={[
                      styles.inviteDot,
                      {
                        backgroundColor:
                          INVITE_STATUS_COLORS[selectedPerson.inviteStatus],
                      },
                    ]}
                  />
                  <Text style={styles.detailValue}>
                    {selectedPerson.inviteStatus.charAt(0).toUpperCase() +
                      selectedPerson.inviteStatus.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Groups</Text>
                <Text style={styles.detailValue}>
                  {getGroupNames(selectedPerson.accessGroupIds)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Doors</Text>
                <Text style={styles.detailValue}>
                  {selectedPerson.accessLocks.length} access points
                </Text>
              </View>

              {selectedPerson.validUntil && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Valid until</Text>
                  <Text style={styles.detailValue}>
                    {selectedPerson.validUntil.toLocaleDateString()}
                  </Text>
                </View>
              )}

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Icon name="pencil-outline" size={18} color="#1565c0" />
                  <Text style={styles.actionBtnText}>Edit Access</Text>
                </TouchableOpacity>
                {selectedPerson.active ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => handleRevoke(selectedPerson)}>
                    <Icon name="account-off-outline" size={18} color="#f44336" />
                    <Text style={[styles.actionBtnText, {color: '#f44336'}]}>
                      Revoke Access
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.actionBtn, styles.actionBtnRevoked]}>
                    <Icon name="account-off-outline" size={18} color="#bbb" />
                    <Text style={[styles.actionBtnText, {color: '#bbb'}]}>
                      Access Revoked
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedPerson(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Invite flow */}
      <Modal
        visible={showInvite}
        animationType="slide"
        onRequestClose={() => setShowInvite(false)}>
        <InviteScreen onClose={() => setShowInvite(false)} />
      </Modal>

      {/* Access groups */}
      <Modal
        visible={showGroups}
        animationType="slide"
        onRequestClose={() => setShowGroups(false)}>
        <AccessGroupsScreen onClose={() => setShowGroups(false)} />
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
  headerTitle: {flex: 1, color: '#fff', fontSize: 18, fontWeight: '700'},
  headerBtn: {padding: 4, marginLeft: 8},
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {backgroundColor: '#1565c0'},
  filterText: {fontSize: 12, color: '#666', fontWeight: '500'},
  filterTextActive: {color: '#fff'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInactive: {backgroundColor: '#bdbdbd'},
  avatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
  info: {flex: 1},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  name: {fontSize: 15, fontWeight: '600', color: '#222'},
  inviteDot: {width: 7, height: 7, borderRadius: 3.5},
  email: {fontSize: 13, color: '#888', marginTop: 1},
  groups: {fontSize: 12, color: '#4caf50', marginTop: 2},
  roleBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  roleText: {fontSize: 11, fontWeight: '700'},
  empty: {alignItems: 'center', paddingTop: 60},
  emptyText: {color: '#bbb', fontSize: 15, marginTop: 12},
  // Detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  detailHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  detailHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  detailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailAvatarText: {color: '#fff', fontWeight: '700', fontSize: 20},
  detailInfo: {flex: 1},
  detailName: {fontSize: 18, fontWeight: '700', color: '#222'},
  detailEmail: {fontSize: 13, color: '#888', marginTop: 3},
  detailPhone: {fontSize: 13, color: '#888', marginTop: 2},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailKey: {fontSize: 14, color: '#888'},
  detailValue: {fontSize: 14, color: '#333', fontWeight: '500'},
  detailRowRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
  detailActions: {flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 12},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1565c0',
    gap: 6,
  },
  actionBtnDanger: {borderColor: '#f44336'},
  actionBtnRevoked: {borderColor: '#e0e0e0'},
  actionBtnText: {fontSize: 13, fontWeight: '600', color: '#1565c0'},
  nameRevoked: {color: '#bbb', textDecorationLine: 'line-through'},
  revokedBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#fce4e4'},
  revokedText: {fontSize: 11, fontWeight: '700', color: '#f44336'},
  closeBtn: {alignItems: 'center', paddingVertical: 10},
  closeBtnText: {fontSize: 15, color: '#aaa'},
});
