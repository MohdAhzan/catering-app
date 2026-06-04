import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { dashboardAPI } from '../api/client';
import { DashboardStats, Event } from '../types';
import { useAuthStore } from '../store/useStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../constants/theme';
import { formatCurrency, formatDate, formatPL } from '../utils/helpers';
import { StatCard, StatusBadge, ErrorBanner } from '../components';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await dashboardAPI.stats();
      setStats(data);
    } catch (e: any) {
      setError(e?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const pl = stats ? formatPL(stats.net_profit_loss) : null;
  const thisMonth = stats?.this_month;
  const lastMonth = stats?.last_month;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetSub}>{greeting()},</Text>
            <Text style={styles.greetName}>{user?.name?.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('Reports')}>
            <Ionicons name="bar-chart-outline" size={16} color={COLORS.accent} />
            <Text style={styles.reportBtnText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {/* Main P/L Banner */}
        <View style={[styles.plBanner, pl?.isProfit ? styles.plProfit : styles.plLoss]}>
          <View>
            <Text style={styles.plLabel}>Net Profit / Loss (All Time)</Text>
            <Text style={[styles.plValue, { color: pl?.isProfit ? COLORS.profit : COLORS.loss }]}>
              {pl?.text || '—'}
            </Text>
          </View>
          <Ionicons
            name={pl?.isProfit ? 'trending-up' : 'trending-down'}
            size={40}
            color={pl?.isProfit ? COLORS.profit : COLORS.loss}
            style={{ opacity: 0.3 }}
          />
        </View>

        {/* Stat Cards Row 1 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Events"
            value={String(stats?.total_events ?? 0)}
            icon="calendar-outline"
            color={COLORS.primary}
            bgColor="#E8EDF5"
          />
          <View style={{ width: SPACING.sm }} />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats?.total_revenue ?? 0, true)}
            icon="cash-outline"
            color={COLORS.secondary}
            bgColor={COLORS.secondaryLight}
          />
        </View>

        {/* Stat Cards Row 2 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Expenses"
            value={formatCurrency(stats?.total_expenses ?? 0, true)}
            icon="receipt-outline"
            color={COLORS.loss}
            bgColor={COLORS.lossLight}
          />
          <View style={{ width: SPACING.sm }} />
          <StatCard
            label="Net P/L"
            value={formatCurrency(Math.abs(stats?.net_profit_loss ?? 0), true)}
            icon="analytics-outline"
            color={pl?.isProfit ? COLORS.profit : COLORS.loss}
            bgColor={pl?.isProfit ? COLORS.profitLight : COLORS.lossLight}
          />
        </View>

        {/* This Month vs Last Month */}
        {thisMonth && lastMonth && (
          <View style={[styles.card, SHADOW.sm]}>
            <Text style={styles.cardTitle}>This Month vs Last Month</Text>
            <View style={styles.monthGrid}>
              <View style={styles.monthCol}>
                <Text style={styles.monthLabel}>THIS MONTH</Text>
                <Text style={styles.monthValue}>{formatCurrency(thisMonth.revenue, true)}</Text>
                <Text style={styles.monthSub}>Revenue · {thisMonth.event_count} events</Text>
                <Text style={[
                  styles.monthPL,
                  { color: thisMonth.profit_loss >= 0 ? COLORS.profit : COLORS.loss },
                ]}>
                  {formatPL(thisMonth.profit_loss).text}
                </Text>
              </View>
              <View style={styles.monthDivider} />
              <View style={styles.monthCol}>
                <Text style={styles.monthLabel}>LAST MONTH</Text>
                <Text style={styles.monthValue}>{formatCurrency(lastMonth.revenue, true)}</Text>
                <Text style={styles.monthSub}>Revenue · {lastMonth.event_count} events</Text>
                <Text style={[
                  styles.monthPL,
                  { color: lastMonth.profit_loss >= 0 ? COLORS.profit : COLORS.loss },
                ]}>
                  {formatPL(lastMonth.profit_loss).text}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Events By Status */}
        {stats?.events_by_status && (
          <View style={[styles.card, SHADOW.sm]}>
            <Text style={styles.cardTitle}>Events by Status</Text>
            <View style={styles.statusGrid}>
              {Object.entries(stats.events_by_status).map(([status, count]) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusChip}
                  onPress={() => navigation.navigate('Events', { filterStatus: status })}
                >
                  <StatusBadge status={status} />
                  <Text style={styles.statusCount}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Bar Chart (simple) */}
        {stats?.monthly_revenue && stats.monthly_revenue.length > 0 && (
          <View style={[styles.card, SHADOW.sm]}>
            <Text style={styles.cardTitle}>Last 6 Months Revenue</Text>
            <View style={styles.chartWrap}>
              {stats.monthly_revenue.map((m, i) => {
                const maxRev = Math.max(...stats.monthly_revenue.map(x => x.revenue), 1);
                const barH = Math.max((m.revenue / maxRev) * 80, 4);
                const expH = Math.max((m.expenses / maxRev) * 80, 4);
                return (
                  <View key={i} style={styles.barGroup}>
                    <View style={styles.bars}>
                      <View style={[styles.bar, styles.barRev, { height: barH }]} />
                      <View style={[styles.bar, styles.barExp, { height: expH }]} />
                    </View>
                    <Text style={styles.barLabel}>{m.month}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={styles.legendText}>Revenue</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.loss + '99' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Events */}
        {stats?.recent_events && stats.recent_events.length > 0 && (
          <View style={[styles.card, SHADOW.sm]}>
            <View style={styles.recentHeader}>
              <Text style={styles.cardTitle}>Recent Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {stats.recent_events.map((event: Event) => {
              const { text: plText, isProfit } = formatPL(event.profit_loss);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.recentRow}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentLeft}>
                    <Text style={styles.recentName} numberOfLines={1}>{event.name}</Text>
                    <Text style={styles.recentDate}>{formatDate(event.date, true)} · #{event.bill_number}</Text>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={[styles.recentPL, { color: isProfit ? COLORS.profit : COLORS.loss }]}>
                      {plText}
                    </Text>
                    <StatusBadge status={event.status} size="sm" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadText: { fontSize: FONT_SIZE.sm, color: COLORS.muted },

  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  greetSub: { fontSize: FONT_SIZE.sm, color: COLORS.muted },
  greetName: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.round },
  reportBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, color: COLORS.accent },

  plBanner: {
    borderRadius: RADIUS.md, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md, borderWidth: 1,
  },
  plProfit: { backgroundColor: COLORS.profitLight, borderColor: COLORS.profit + '30' },
  plLoss: { backgroundColor: COLORS.lossLight, borderColor: COLORS.loss + '30' },
  plLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  plValue: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.heavy },

  statsRow: { flexDirection: 'row', marginBottom: SPACING.sm },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.md },

  monthGrid: { flexDirection: 'row' },
  monthCol: { flex: 1 },
  monthDivider: { width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SPACING.md },
  monthLabel: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.muted, letterSpacing: 1, marginBottom: 6 },
  monthValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  monthSub: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  monthPL: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 6 },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  statusCount: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: SPACING.sm },
  barGroup: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 },
  bar: { flex: 1, borderRadius: 2 },
  barRev: { backgroundColor: COLORS.secondary },
  barExp: { backgroundColor: COLORS.loss + '99' },
  barLabel: { fontSize: 9, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FONT_SIZE.xs, color: COLORS.muted },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  seeAll: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, color: COLORS.secondary },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  recentLeft: { flex: 1, marginRight: 8 },
  recentName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  recentDate: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  recentRight: { alignItems: 'flex-end', gap: 4 },
  recentPL: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
});
