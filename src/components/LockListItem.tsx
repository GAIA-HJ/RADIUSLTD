import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Lock} from '../types';

interface Props {
  lock: Lock;
  isOpening: boolean;
  onPress: () => void;
}

export default function LockListItem({lock, isOpening, onPress}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, lock.isOpen && styles.iconOpen]}>
        {isOpening ? (
          <ActivityIndicator size="small" color="#2e7d32" />
        ) : (
          <Icon
            name={lock.isOpen ? 'lock-open-outline' : 'crop-square'}
            size={28}
            color={lock.isOpen ? '#2e7d32' : '#4caf50'}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{lock.name}</Text>
        <Text style={styles.subtitle}>
          {isOpening
            ? 'Opening...'
            : lock.isOpen
            ? 'Open — closes automatically'
            : 'Tap to activate remote opening'}
        </Text>
      </View>

      <View
        style={[
          styles.statusDot,
          lock.status === 'offline' && styles.statusDotOffline,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: '#f9fffe',
  },
  iconOpen: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginLeft: 8,
  },
  statusDotOffline: {
    backgroundColor: '#bdbdbd',
  },
});
