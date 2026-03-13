import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MOCK_IQS, MOCK_LOCKS, MOCK_EVENTS} from '../data/mockLocks';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const BAR_CHART_WIDTH = SCREEN_WIDTH - 48;

type Period = 'today' | 'week' | 'month';

// Simulated hourly activity for "today" (0-23h)
const HOURLY_DATA = [
  0, 0, 0, 0, 0, 0, 2, 8, 15, 18, 12, 9,
  14, 11, 8, 13, 16, 10, 6, 3, 2, 1, 0, 0,
];

// Simulated daily data for "this week" (Mon-Sun)
const DAILY_DATA = [24, 31, 28, 35, 29, 12, 5];
const DAILY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Simulated weekly data for "this month"
const WEEKLY_DATA = [68, 82, 75, 91, 79];
const WEEKLY_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) {return `${diff}s ago`;}
  if (diff < 3600) {return `${Math.floor(diff / 60)}m ago`;}
  return `${Math.floor(diff / 3600)}h ago`;
}

interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

function BarChart({data, labels, color = '#1565c0', height = 120}: BarChartProps) {
  const max = Math.max(...data, 1);
  const barWidth = (BAR_CHART_WIDTH - (data.length - 1) * 4) / data.length;

  return (
    <View style={[barStyles.container, {height: height + 28}]}>
      <View style={[barStyles.barsRow, {height}]}>
        {data.map((val, i) => {
          const barH = Math.max((val / max) * height, val > 0 ? 4 : 0);
          return (
            <View key={i} style={[barStyles.barWrapper, {width: barWidth}]}>
              {val > 0 && barH > 16 && (
                <Text style={barStyles.barValue}>{val}</Text>
              )}
              <View style={[barStyles.bar, {height: barH, backgroundColor: color}]} />
            </View>
          );
        })}
      </View>
      <View style={barStyles.labelsRow}>
        {labels.map((label, i) => (
          <Text key={i} style={[barStyles.label, {width: barWidth}]} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MiniDonutBar({value, max, color}: {value: number; max: number; color: string}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={donutStyles.track}>
      <View style={[donutStyles.fill, {width: `${pct * 100}%` as any, backgroundColor: color}]} />
    </View>
  );
}

export default function IQsScreen() {
  const [period, setPeriod] = useState<Period>('today');

  const totalEntries = MOCK_IQS.reduce((s, m) => s + m.totalEntries, 0);
  const totalFailed = MOCK_IQS.reduce((s, m) => s + m.failedAttempts, 0);
  const successRate = totalEntries > 0
    ? Math.round(((totalEntries - totalFailed) / totalEntries) * 100)
    : 100;

  const methodCounts = MOCK_EVENTS.reduce(
    (acc, e) => {
      acc[e.method] = (acc[e.method] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const activeLocks = MOCK_LOCKS.filter(l => l.status === 'online').length;

  const chartData = period === 'today' ? HOURLY_DATA
    : period === 'week' ? DAILY_DATA
    : WEEKLY_DATA;
  const chartLabels = period === 'today'
    ? HOURLY_DATA.map((_, i) => (i % 4 === 0 ? `${i}h` : ''))
    : period === 'week' ? DAILY_LABELS
    : WEEKLY_LABELS;
  const chartTotal = chartData.reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1565c0" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IQs</Text>
        {totalFailed > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalFailed}</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPI row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Icon name="door-open" size={22} color="#1565c0" />
            <Text style={styles.kpiValue}>{totalEntries}</Text>
            <Text style={styles.kpiLabel}>Total Entries</Text>
          </View>
          <View style={styles.kpiCard}>
            <Icon name="check-circle-outline" size={22} color="#4caf50" />
            <Text style={[styles.kpiValue, {color: '#4caf50'}]}>{successRate}%</Text>
            <Text style={styles.kpiLabel}>Success Rate</Text>
          </View>
          <View style={styles.kpiCard}>
            <Icon name="alert-circle-outline" size={22} color="#f44336" />
            <Text style={[styles.kpiValue, {color: '#f44336'}]}>{totalFailed}</Text>
            <Text style={styles.kpiLabel}>Denied</Text>
          </View>
          <View style={styles.kpiCard}>
            <Icon name="lock-outline" size={22} color="#888" />
            <Text style={styles.kpiValue}>{activeLocks}/{MOCK_LOCKS.length}</Text>
            <Text style={styles.kpiLabel}>Online</Text>
          </View>
        </View>

        {/* Activity chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Access Activity</Text>
              <Text style={styles.chartSubtitle}>{chartTotal} entries</Text>
            </View>
            <View style={styles.periodTabs}>
              {(['today', 'week', 'month'] as Period[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodTab, period === p && styles.periodTabActive]}
                  onPress={() => setPeriod(p)}>
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <BarChart data={chartData} labels={chartLabels} />
        </View>

        {/* Access method breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Access Methods</Text>
          {[
            {key: 'remote', label: 'Remote Open', icon: 'cellphone-wireless', color: '#1565c0'},
            {key: 'digital_key', label: 'Digital Key', icon: 'nfc', color: '#6a1b9a'},
            {key: 'card', label: 'Access Card', icon: 'card-account-details-outline', color: '#2e7d32'},
          ].map(m => {
            const count = methodCounts[m.key] ?? 0;
            const total = Object.values(methodCounts).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <View key={m.key} style={styles.methodRow}>
                <View style={[styles.methodDot, {backgroundColor: m.color + '22'}]}>
                  <Icon name={m.icon} size={16} color={m.color} />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodLabelRow}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodCount}>{count} ({pct}%)</Text>
                  </View>
                  <MiniDonutBar value={count} max={total} color={m.color} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Per-reader breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>By Reader</Text>
          {MOCK_IQS.map((item, idx) => {
            const maxEntries = Math.max(...MOCK_IQS.map(i => i.totalEntries), 1);
            const barW = (item.totalEntries / maxEntries) * (BAR_CHART_WIDTH - 100);
            const failPct = item.totalEntries > 0
              ? Math.round((item.failedAttempts / item.totalEntries) * 100)
              : 0;
            return (
              <View
                key={item.id}
                style={[
                  styles.readerRow,
                  idx < MOCK_IQS.length - 1 && styles.readerRowBorder,
                ]}>
                <View style={styles.readerLeft}>
                  <Text style={styles.readerName} numberOfLines={1}>
                    {item.lockName}
                  </Text>
                  <View style={styles.readerBarTrack}>
                    <View
                      style={[styles.readerBar, {width: barW}]}
                    />
                    {item.failedAttempts > 0 && (
                      <View
                        style={[
                          styles.readerBarFail,
                          {width: (item.failedAttempts / item.totalEntries) * barW},
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.readerMeta}>
                    Last: {timeAgo(item.lastActivity)}
                    {item.failedAttempts > 0 && (
                      <Text style={styles.readerFail}>
                        {' · '}{failPct}% denied
                      </Text>
                    )}
                  </Text>
                </View>
                <Text style={styles.readerEntries}>{item.totalEntries}</Text>
              </View>
            );
          })}
        </View>

        {/* Peak hours insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Icon name="lightbulb-outline" size={18} color="#f59e0b" />
            <Text style={styles.insightTitle}>Peak Hours</Text>
          </View>
          <Text style={styles.insightText}>
            Highest activity is between{' '}
            <Text style={styles.insightHighlight}>8:00 – 10:00</Text> and{' '}
            <Text style={styles.insightHighlight}>15:00 – 17:00</Text>.
            Consider scheduling maintenance outside these windows.
          </Text>
        </View>

        <View style={{height: 24}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const barStyles = StyleSheet.create({
  container: {paddingHorizontal: 4},
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
    minHeight: 0,
  },
  barValue: {
    fontSize: 9,
    color: '#888',
    marginBottom: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  label: {
    fontSize: 9,
    color: '#aaa',
    textAlign: 'center',
  },
});

const donutStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 5,
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    backgroundColor: '#1565c0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {flex: 1, color: '#fff', fontSize: 18, fontWeight: '700'},
  badge: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  kpiRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1565c0',
    marginTop: 5,
  },
  kpiLabel: {fontSize: 10, color: '#aaa', marginTop: 2, textAlign: 'center'},
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {fontSize: 15, fontWeight: '700', color: '#222'},
  chartSubtitle: {fontSize: 12, color: '#aaa', marginTop: 2},
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  periodTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  periodTabActive: {backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1},
  periodText: {fontSize: 12, color: '#888'},
  periodTextActive: {color: '#1565c0', fontWeight: '600'},
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {flex: 1},
  methodLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodLabel: {fontSize: 13, fontWeight: '600', color: '#333'},
  methodCount: {fontSize: 12, color: '#888'},
  readerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  readerRowBorder: {borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  readerLeft: {flex: 1, marginRight: 12},
  readerName: {fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 6},
  readerBarTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  readerBar: {
    height: 8,
    backgroundColor: '#1565c0',
    borderRadius: 4,
  },
  readerBarFail: {
    height: 8,
    backgroundColor: '#f44336',
    marginLeft: -4,
    borderRadius: 4,
  },
  readerMeta: {fontSize: 11, color: '#aaa', marginTop: 4},
  readerFail: {color: '#f44336'},
  readerEntries: {fontSize: 18, fontWeight: '700', color: '#1565c0', minWidth: 40, textAlign: 'right'},
  insightCard: {
    backgroundColor: '#fffbeb',
    marginHorizontal: 10,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  insightHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  insightTitle: {fontSize: 14, fontWeight: '700', color: '#92400e'},
  insightText: {fontSize: 13, color: '#78350f', lineHeight: 20},
  insightHighlight: {fontWeight: '700', color: '#b45309'},
});
