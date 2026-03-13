import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MOCK_PEOPLE} from '../data/mockLocks';

const ROLE_COLORS: Record<string, string> = {
  admin: '#1565c0',
  user: '#2e7d32',
  guest: '#e65100',
};

export default function PeopleScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>People</Text>
        <TouchableOpacity>
          <Icon name="account-plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_PEOPLE}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.access}>
                {item.accessLocks.length} door
                {item.accessLocks.length !== 1 ? 's' : ''} access
              </Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                {backgroundColor: ROLE_COLORS[item.role] + '22'},
              ]}>
              <Text
                style={[styles.roleText, {color: ROLE_COLORS[item.role]}]}>
                {item.role.toUpperCase()}
              </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  avatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '600', color: '#222'},
  email: {fontSize: 13, color: '#888', marginTop: 1},
  access: {fontSize: 12, color: '#4caf50', marginTop: 2},
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {fontSize: 11, fontWeight: '700'},
});
