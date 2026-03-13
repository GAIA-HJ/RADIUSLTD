import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MOCK_LOCKS} from '../data/mockLocks';
import {MOCK_ACCESS_GROUPS} from '../data/mockLocks';
import {MOCK_SCHEDULES} from '../data/mockLocks';

type Role = 'admin' | 'user' | 'guest';

const ROLE_OPTIONS: {value: Role; label: string; desc: string; color: string}[] = [
  {value: 'admin', label: 'Admin', desc: 'Full access, manage users', color: '#1565c0'},
  {value: 'user', label: 'User', desc: 'Access assigned doors', color: '#2e7d32'},
  {value: 'guest', label: 'Guest', desc: 'Temporary / limited access', color: '#e65100'},
];

interface Props {
  onClose: () => void;
}

export default function InviteScreen({onClose}: Props) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedLockIds, setSelectedLockIds] = useState<string[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('s1');
  const [useCustomLocks, setUseCustomLocks] = useState(false);
  const [validDays, setValidDays] = useState(30);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const toggleGroup = (id: string) =>
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id],
    );

  const toggleLock = (id: string) =>
    setSelectedLockIds(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id],
    );

  const sendInvite = () => {
    if (!email && !phone) {
      Alert.alert('Required', 'Please enter an email or phone number.');
      return;
    }
    Alert.alert(
      'Invite Sent',
      `Invitation sent to ${email || phone}.\nThey'll receive a link to activate their digital key.`,
      [{text: 'Done', onPress: onClose}],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Person</Text>
        <View style={{width: 40}} />
      </View>

      {/* Step indicators */}
      <View style={styles.steps}>
        {['Contact', 'Access', 'Schedule'].map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, step > i + 1 && styles.stepDotDone, step === i + 1 && styles.stepDotActive]}>
              {step > i + 1 ? (
                <Icon name="check" size={12} color="#fff" />
              ) : (
                <Text style={[styles.stepNum, step === i + 1 && styles.stepNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>
              {label}
            </Text>
            {i < 2 && <View style={[styles.stepLine, step > i + 1 && styles.stepLineDone]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 1: Contact */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555-0000"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.sectionTitle}>Role</Text>
            {ROLE_OPTIONS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
                onPress={() => setRole(r.value)}>
                <View style={[styles.roleIndicator, {backgroundColor: r.color}]} />
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
                {role === r.value && (
                  <Icon name="check-circle" size={20} color="#1565c0" />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step 2: Access */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Access Groups</Text>
            <Text style={styles.hint}>Groups assign multiple doors at once</Text>
            {MOCK_ACCESS_GROUPS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.groupCard, selectedGroupIds.includes(g.id) && styles.groupCardSelected]}
                onPress={() => toggleGroup(g.id)}>
                <View style={[styles.groupDot, {backgroundColor: g.color}]} />
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupLocks}>
                    {g.lockIds.length} door{g.lockIds.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={[styles.checkbox, selectedGroupIds.includes(g.id) && styles.checkboxChecked]}>
                  {selectedGroupIds.includes(g.id) && (
                    <Icon name="check" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.customToggleRow}>
              <Text style={styles.customToggleLabel}>Custom door selection</Text>
              <Switch
                value={useCustomLocks}
                onValueChange={setUseCustomLocks}
                trackColor={{false: '#ddd', true: '#bbdefb'}}
                thumbColor={useCustomLocks ? '#1565c0' : '#f4f3f4'}
              />
            </View>

            {useCustomLocks && (
              <>
                <Text style={styles.sectionTitle}>Individual Doors</Text>
                {MOCK_LOCKS.map(l => (
                  <TouchableOpacity
                    key={l.id}
                    style={styles.lockRow}
                    onPress={() => toggleLock(l.id)}>
                    <Icon
                      name="lock-outline"
                      size={18}
                      color={selectedLockIds.includes(l.id) ? '#1565c0' : '#aaa'}
                    />
                    <Text style={styles.lockRowName}>{l.name}</Text>
                    <View style={[styles.checkbox, selectedLockIds.includes(l.id) && styles.checkboxChecked]}>
                      {selectedLockIds.includes(l.id) && (
                        <Icon name="check" size={14} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>Access Schedule</Text>
            <Text style={styles.hint}>When can this person access the doors?</Text>
            {MOCK_SCHEDULES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.schedCard, selectedScheduleId === s.id && styles.schedCardSelected]}
                onPress={() => setSelectedScheduleId(s.id)}>
                <View style={styles.schedInfo}>
                  <Text style={styles.schedName}>{s.name}</Text>
                  <Text style={styles.schedDays}>{s.days.join(', ')}</Text>
                  <Text style={styles.schedTime}>{s.startTime} – {s.endTime}</Text>
                </View>
                {selectedScheduleId === s.id && (
                  <Icon name="check-circle" size={20} color="#1565c0" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Validity Period</Text>
            <View style={styles.validityRow}>
              {[7, 14, 30, 90, 365].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.validityChip, validDays === d && styles.validityChipSelected]}
                  onPress={() => setValidDays(d)}>
                  <Text style={[styles.validityText, validDays === d && styles.validityTextSelected]}>
                    {d === 365 ? '1 year' : `${d}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.validityNote}>
              Access expires {new Date(Date.now() + validDays * 86400000).toLocaleDateString()}
            </Text>

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>To: </Text>
                {email || phone}
              </Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Role: </Text>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Groups: </Text>
                {selectedGroupIds.length > 0
                  ? MOCK_ACCESS_GROUPS.filter(g => selectedGroupIds.includes(g.id))
                      .map(g => g.name)
                      .join(', ')
                  : 'None'}
              </Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Schedule: </Text>
                {MOCK_SCHEDULES.find(s => s.id === selectedScheduleId)?.name}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer navigation */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.footerBack}
            onPress={() => setStep((step - 1) as 1 | 2)}>
            <Text style={styles.footerBackText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.footerNext, step === 1 && styles.footerNextFull]}
          onPress={() => (step < 3 ? setStep((step + 1) as 2 | 3) : sendInvite())}>
          <Text style={styles.footerNextText}>
            {step === 3 ? 'Send Invite' : 'Next'}
          </Text>
          <Icon name={step === 3 ? 'send' : 'arrow-right'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
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
  headerTitle: {flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center'},
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepItem: {flexDirection: 'row', alignItems: 'center'},
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {backgroundColor: '#1565c0'},
  stepDotDone: {backgroundColor: '#4caf50'},
  stepNum: {fontSize: 12, color: '#888', fontWeight: '600'},
  stepNumActive: {color: '#fff'},
  stepLabel: {fontSize: 12, color: '#aaa', marginLeft: 6},
  stepLabelActive: {color: '#1565c0', fontWeight: '600'},
  stepLine: {width: 28, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 6},
  stepLineDone: {backgroundColor: '#4caf50'},
  content: {padding: 16, paddingBottom: 32},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  hint: {fontSize: 13, color: '#aaa', marginBottom: 10, marginTop: -4},
  field: {marginBottom: 14},
  label: {fontSize: 13, color: '#555', marginBottom: 5, fontWeight: '500'},
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  roleCardSelected: {borderColor: '#1565c0', backgroundColor: '#f0f4ff'},
  roleIndicator: {width: 10, height: 10, borderRadius: 5, marginRight: 12},
  roleInfo: {flex: 1},
  roleName: {fontSize: 15, fontWeight: '600', color: '#222'},
  roleDesc: {fontSize: 12, color: '#888', marginTop: 2},
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  groupCardSelected: {borderColor: '#1565c0'},
  groupDot: {width: 12, height: 12, borderRadius: 6, marginRight: 12},
  groupInfo: {flex: 1},
  groupName: {fontSize: 15, fontWeight: '600', color: '#222'},
  groupLocks: {fontSize: 12, color: '#888', marginTop: 2},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {backgroundColor: '#1565c0', borderColor: '#1565c0'},
  customToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  customToggleLabel: {fontSize: 15, color: '#333', fontWeight: '500'},
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lockRowName: {flex: 1, fontSize: 14, color: '#333', marginLeft: 10},
  schedCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedCardSelected: {borderColor: '#1565c0', backgroundColor: '#f0f4ff'},
  schedInfo: {flex: 1},
  schedName: {fontSize: 15, fontWeight: '600', color: '#222'},
  schedDays: {fontSize: 12, color: '#888', marginTop: 2},
  schedTime: {fontSize: 12, color: '#1565c0', marginTop: 2},
  validityRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8},
  validityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  validityChipSelected: {backgroundColor: '#1565c0', borderColor: '#1565c0'},
  validityText: {fontSize: 13, color: '#555', fontWeight: '500'},
  validityTextSelected: {color: '#fff'},
  validityNote: {fontSize: 12, color: '#888', marginTop: 4},
  summary: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 10},
  summaryRow: {fontSize: 14, color: '#555', marginBottom: 5, lineHeight: 20},
  summaryKey: {fontWeight: '600', color: '#333'},
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  footerBack: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerBackText: {fontSize: 15, color: '#555', fontWeight: '600'},
  footerNext: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerNextFull: {flex: 1},
  footerNextText: {fontSize: 15, color: '#fff', fontWeight: '700'},
});
