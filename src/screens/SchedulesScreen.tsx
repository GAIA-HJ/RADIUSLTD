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
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Schedule, WeekDay} from '../types';
import {MOCK_SCHEDULES, MOCK_ACCESS_GROUPS} from '../data/mockLocks';

const ALL_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  onClose: () => void;
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor="#bbb"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );
}

export default function SchedulesScreen({onClose}: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState<WeekDay[]>([]);
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('18:00');

  const openNew = () => {
    setEditingSchedule(null);
    setFormName('');
    setFormDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setFormStart('08:00');
    setFormEnd('18:00');
    setShowForm(true);
  };

  const openEdit = (sched: Schedule) => {
    setEditingSchedule(sched);
    setFormName(sched.name);
    setFormDays([...sched.days]);
    setFormStart(sched.startTime);
    setFormEnd(sched.endTime);
    setShowForm(true);
  };

  const toggleDay = (day: WeekDay) =>
    setFormDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter a schedule name.');
      return;
    }
    if (formDays.length === 0) {
      Alert.alert('Required', 'Please select at least one day.');
      return;
    }
    if (editingSchedule) {
      setSchedules(prev =>
        prev.map(s =>
          s.id === editingSchedule.id
            ? {...s, name: formName, days: formDays, startTime: formStart, endTime: formEnd}
            : s,
        ),
      );
    } else {
      setSchedules(prev => [
        ...prev,
        {
          id: 's' + Date.now(),
          name: formName,
          days: formDays,
          startTime: formStart,
          endTime: formEnd,
        },
      ]);
    }
    setShowForm(false);
  };

  const handleDelete = (schedId: string) => {
    const usedIn = MOCK_ACCESS_GROUPS.filter(g => g.scheduleId === schedId);
    if (usedIn.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This schedule is used by ${usedIn.map(g => g.name).join(', ')}. Remove it from those groups first.`,
      );
      return;
    }
    Alert.alert('Delete Schedule', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setSchedules(prev => prev.filter(s => s.id !== schedId)),
      },
    ]);
  };

  const getGroupCount = (schedId: string) =>
    MOCK_ACCESS_GROUPS.filter(g => g.scheduleId === schedId).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedules</Text>
        <TouchableOpacity style={styles.backBtn} onPress={openNew}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openEdit(item)}
            activeOpacity={0.8}>
            {/* Day pills */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  style={styles.iconBtn}>
                  <Icon name="pencil-outline" size={18} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.iconBtn}>
                  <Icon name="trash-can-outline" size={18} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.daysRow}>
              {ALL_DAYS.map(d => (
                <View
                  key={d}
                  style={[
                    styles.dayPill,
                    item.days.includes(d) && styles.dayPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.dayPillText,
                      item.days.includes(d) && styles.dayPillTextActive,
                    ]}>
                    {d[0]}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.timeChip}>
                <Icon name="clock-outline" size={13} color="#1565c0" />
                <Text style={styles.timeChipText}>
                  {item.startTime} – {item.endTime}
                </Text>
              </View>
              {getGroupCount(item.id) > 0 && (
                <Text style={styles.groupCount}>
                  Used by {getGroupCount(item.id)} group
                  {getGroupCount(item.id) !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="clock-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No schedules yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openNew}>
              <Text style={styles.emptyBtnText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create/Edit form modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setShowForm(false)}
              style={styles.backBtn}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.formLabel}>Schedule Name</Text>
            <TextInput
              style={styles.formInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Business Hours"
              placeholderTextColor="#bbb"
            />

            <Text style={styles.formLabel}>Active Days</Text>
            <View style={styles.daysGrid}>
              {ALL_DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayToggle,
                    formDays.includes(d) && styles.dayToggleActive,
                  ]}
                  onPress={() => toggleDay(d)}>
                  <Text
                    style={[
                      styles.dayToggleText,
                      formDays.includes(d) && styles.dayToggleTextActive,
                    ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick presets */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.preset}
                onPress={() =>
                  setFormDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
                }>
                <Text style={styles.presetText}>Weekdays</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.preset}
                onPress={() => setFormDays(['Sat', 'Sun'])}>
                <Text style={styles.presetText}>Weekend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.preset}
                onPress={() => setFormDays([...ALL_DAYS])}>
                <Text style={styles.presetText}>Every day</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Access Hours</Text>
            <View style={styles.timeRow}>
              <TimeInput label="From" value={formStart} onChange={setFormStart} />
              <View style={styles.timeDash}>
                <Text style={styles.timeDashText}>–</Text>
              </View>
              <TimeInput label="Until" value={formEnd} onChange={setFormEnd} />
            </View>

            {/* 24/7 shortcut */}
            <TouchableOpacity
              style={styles.allDayBtn}
              onPress={() => {
                setFormStart('00:00');
                setFormEnd('23:59');
              }}>
              <Icon name="infinity" size={16} color="#1565c0" />
              <Text style={styles.allDayText}>Set to 24/7</Text>
            </TouchableOpacity>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewText}>
                {formName || '(unnamed)'} · {formDays.join(', ') || 'no days'}
              </Text>
              <Text style={styles.previewTime}>
                {formStart} – {formEnd}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveBtn: {paddingHorizontal: 4, paddingVertical: 4},
  saveBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
  list: {padding: 12},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardName: {flex: 1, fontSize: 16, fontWeight: '700', color: '#222'},
  cardActions: {flexDirection: 'row', gap: 4},
  iconBtn: {padding: 4},
  daysRow: {flexDirection: 'row', gap: 6, marginBottom: 10},
  dayPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {backgroundColor: '#1565c0'},
  dayPillText: {fontSize: 12, fontWeight: '600', color: '#888'},
  dayPillTextActive: {color: '#fff'},
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeChipText: {fontSize: 12, color: '#1565c0', fontWeight: '600'},
  groupCount: {fontSize: 12, color: '#888'},
  empty: {alignItems: 'center', paddingTop: 80},
  emptyText: {color: '#bbb', fontSize: 15, marginTop: 12, marginBottom: 20},
  emptyBtn: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
  },
  emptyBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  // Form
  formContent: {padding: 16, paddingBottom: 40},
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#222',
  },
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dayToggle: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
  },
  dayToggleActive: {backgroundColor: '#e3f2fd', borderColor: '#1565c0'},
  dayToggleText: {fontSize: 13, fontWeight: '600', color: '#888'},
  dayToggleTextActive: {color: '#1565c0'},
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetText: {fontSize: 12, color: '#555'},
  timeRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  timeField: {flex: 1},
  timeLabel: {fontSize: 12, color: '#888', marginBottom: 4},
  timeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  timeDash: {paddingBottom: 10},
  timeDashText: {fontSize: 20, color: '#bbb'},
  allDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 4,
  },
  allDayText: {fontSize: 14, color: '#1565c0', fontWeight: '500'},
  preview: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#c7d7f7',
  },
  previewTitle: {fontSize: 11, fontWeight: '700', color: '#1565c0', marginBottom: 6, textTransform: 'uppercase'},
  previewText: {fontSize: 14, color: '#333', fontWeight: '500'},
  previewTime: {fontSize: 14, color: '#1565c0', marginTop: 3},
});
