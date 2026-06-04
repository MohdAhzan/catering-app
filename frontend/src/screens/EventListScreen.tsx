import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { eventsAPI } from '../api/client';
import { Event } from '../types';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW, STATUS_COLORS } from '../constants/theme';
import { formatDate, formatCurrency, formatPL, truncate } from '../utils/helpers';
import { StatusBadge, EmptyState } from '../components';

const STATUS_FILTERS = ['', 'draft', 'confirmed', 'completed', 'cancelled'];

export default function EventListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(route.params?.filterStatus || '');

  const load = useCallback(async (pg = 1, clear = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await eventsAPI.list({
        page: pg, limit: 20,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (clear || pg === 1) {
        setEvents(data.data || []);
      } else {
        setEvents(prev => [...prev, ...(data.data || [])]);
      }
      setTotal(data.total);
      setPage(pg);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(1, true); }, [search, statusFilter]);

  const onRefresh = () => { setRefreshing(true); load(1, true); };
  const onEndReached = () => {
    if (!loadingMore && events.length < total) load(page + 1);
  };

  const renderItem = ({ item }: { item: Event }) => {
    const { text: plText, isProfit } = formatPL(item.profit_loss);
    return (
      <TouchableOpacity
        style={[styles.card, SHADOW.sm]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.billNum}>#{item.bill_number}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
            <Text style={styles.metaText}>{formatDate(item.date, true)}</Text>
          </View>
          {!!item.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={COLORS.muted} />
              <Text style={styles.metaText} numberOfLines={1}>{truncate(item.location, 20)}</Text>
            </View>
          )}
        </View>

        <View style={styles.financials}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Revenue</Text>
            <Text style={styles.finVal}>{formatCurrency(item.total_billing, true)}</Text>
          </View>
          <View style={styles.finDot} />
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Expenses</Text>
            <Text style={styles.finVal}>{formatCurrency(item.total_expenses + item.total_misc, true)}</Text>
          </View>
          <View style={styles.finDot} />
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>P/L</Text>
            <Text style={[styles.finVal, styles.finPL, { color: isProfit ? COLORS.profit : COLORS.loss }]}>
              {plText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search events, locations, bill #…"
            placeholderTextColor={COLORS.mutedLight}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map(s => {
          const cfg = STATUS_COLORS[s] || { bg: '#EDE9E1', text: COLORS.muted, label: 'All' };
          const active = statusFilter === s;
          return (
            <TouchableOpacity
              key={s || 'all'}
              style={[styles.filterChip, active && { backgroundColor: COLORS.primary }]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterText, active && { color: COLORS.white }]}>
                {s ? cfg.label : 'All'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{total} event{total !== 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')} style={styles.addBtn}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>New Event</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No events found"
              subtitle={search ? 'Try a different search term' : 'Tap "New Event" to create your first event'}
              action={{ label: 'Create Event', onPress: () => navigation.navigate('CreateEvent') }}
            />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.muted} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  searchBar: { backgroundColor: COLORS.primary, padding: SPACING.md, paddingBottom: SPACING.sm },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDark + 'CC', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#FFFFFF20' },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.white },
  filtersRow: { flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.round, backgroundColor: '#FFFFFF20' },
  filterText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, color: COLORS.mutedLight },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  countText: { fontSize: FONT_SIZE.sm, color: COLORS.muted, fontWeight: FONT_WEIGHT.medium },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.round },
  addBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SPACING.md, paddingBottom: 80 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  eventName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  billNum: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.muted },
  financials: { flexDirection: 'row', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  finItem: { flex: 1, alignItems: 'center' },
  finLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 2 },
  finVal: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  finPL: { fontWeight: FONT_WEIGHT.bold },
  finDot: { width: 1, backgroundColor: COLORS.border },
});
