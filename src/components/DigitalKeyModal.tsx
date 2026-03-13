import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NfcService from '../services/NfcService';
import BleService from '../services/BleService';
import {Lock} from '../types';

type Status = 'idle' | 'scanning' | 'success' | 'error';

interface Props {
  visible: boolean;
  lock: Lock | null;
  onClose: () => void;
}

export default function DigitalKeyModal({visible, lock, onClose}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Hold your phone near the reader');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && lock) {
      startSession();
    }
    return () => {
      NfcService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, lock]);

  useEffect(() => {
    if (status === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const startSession = async () => {
    if (!lock) {return;}
    setStatus('scanning');
    setMessage('Hold your phone near the reader');

    // Try NFC first on supported platforms
    const nfcSupported = await NfcService.init();

    if (nfcSupported && Platform.OS !== 'android') {
      // iOS: use NFC
      await NfcService.startDigitalKeySession(
        lock.id,
        'CREDENTIAL_' + lock.id,
        () => {
          setStatus('success');
          setMessage('Access granted!');
          setTimeout(handleClose, 2000);
        },
        err => {
          setStatus('error');
          setMessage(err);
        },
      );
    } else if (lock.bleDeviceId) {
      // Android or fallback: use BLE
      await BleService.connectToReader(
        lock.bleDeviceId,
        msg => setMessage(msg),
        () => {
          setStatus('success');
          setMessage('Access granted!');
          setTimeout(handleClose, 2000);
        },
        err => {
          setStatus('error');
          setMessage(err);
        },
      );
    } else {
      setStatus('error');
      setMessage('No wireless method available for this reader');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setMessage('Hold your phone near the reader');
    NfcService.stop();
    onClose();
  };

  const iconName =
    status === 'success'
      ? 'check-circle'
      : status === 'error'
      ? 'alert-circle'
      : 'nfc';

  const iconColor =
    status === 'success'
      ? '#4caf50'
      : status === 'error'
      ? '#f44336'
      : '#1565c0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>DIGITAL KEY</Text>
          {lock && <Text style={styles.lockName}>{lock.name}</Text>}

          <Animated.View
            style={[
              styles.iconWrapper,
              status === 'scanning' && {transform: [{scale: pulseAnim}]},
            ]}>
            <Icon name={iconName} size={72} color={iconColor} />
          </Animated.View>

          <Text style={styles.message}>{message}</Text>

          {status === 'error' && (
            <TouchableOpacity style={styles.retryBtn} onPress={startSession}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565c0',
    letterSpacing: 1,
    marginBottom: 4,
  },
  lockName: {
    fontSize: 13,
    color: '#888',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 15,
  },
});
