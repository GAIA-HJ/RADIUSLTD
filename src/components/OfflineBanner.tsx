import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
}

export default function OfflineBanner({visible}: Props) {
  const translateY = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -48,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View style={[styles.banner, {transform: [{translateY}]}]}>
      <Icon name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
      <Icon name="circle-medium" size={12} color="rgba(255,255,255,0.5)" />
      <Text style={styles.subtext}>Working offline</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#37474f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  text: {color: '#fff', fontSize: 13, fontWeight: '600'},
  subtext: {color: 'rgba(255,255,255,0.7)', fontSize: 12},
});
