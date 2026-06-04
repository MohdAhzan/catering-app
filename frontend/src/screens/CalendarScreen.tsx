import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { eventsAPI } from '../api/client';
import { Event } from '../types';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW, STATUS_COLORS } from '../constants/theme';
import { formatCurrency, formatPL } from '../utils/helpers';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number | null>(now.getDate());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventsAPI.calendar(year, month);
      setEvents(data || []);
    } catch {}
    finally { setLoading(false); }
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map date -> events
  const eventsByDate: Record<number, Event[]> = {};
  events.forEach(ev => {
    const d = new Date(ev.date).getDate();
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>{MONTHS[month - 1]} {year}</Text>
            {loading && <ActivityIndicator size="small" color={COLORS.accent} style={{ marginLeft: 8 }} />}
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;
            const hasEvents = !!eventsByDate[day];
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = day === selectedDate;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.cell,
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                  hasEvents && !isSelected && styles.cellHasEvents,
                ]}
                onPress={() => setSelectedDate(day === selectedDate ? null : day)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cellText,
                  isToday && styles.cellTextToday,
                  isSelected && styles.cellTextSelected,
                ]}>
                  {day}
                </Text>
                {hasEvents && (
                  <View style={styles.dotRow}>
                    {eventsByDate[day].slice(0, 3).map((_, di) => (
                      <View
                        key={di}
                        style={[styles.dot, { backgroundColor: isSelected ? COLORS.white : COLORS.accent }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected date events */}
        <View style={styles.eventsSection}>
          {selectedDate ? (
            <>
              <Text style={styles.selectedDateLabel}>
                {MONTHS[month - 1]} {selectedDate}, {year}
                {selectedEvents.length > 0 ? ` · ${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}` : ''}
              </Text>
              {selectedEvents.length === 0 ? (
                <View style={styles.noEvents}>
                  <Ionicons name="calendar-outline" size={32} color={COLORS.mutedLight} />
                  <Text style={styles.noEventsText}>No events on this date</Text>
                </View>
              ) : (
                selectedEvents.map(ev => {
                  const { text: plText, isProfit } = formatPL(ev.profit_loss);
                  const statusCfg = STATUS_COLORS[ev.status] || STATUS_COLORS.draft;
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[styles.eventItem, SHADOW.sm]}
                      onPress={() => navigation.navigate('EventDetail', { eventId: ev.id })}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.eventStatusBar, { backgroundColor: statusCfg.text }]} />
                      <View style={styles.eventItemBody}>
                        <View style={styles.eventItemTop}>
                          <Text style={styles.eventItemName} numberOfLines={1}>{ev.name}</Text>
                          <Text style={[styles.eventItemPL, { color: isProfit ? COLORS.profit : COLORS.loss }]}>
                            {plText}
                          </Text>
                        </View>
                        <Text style={styles.eventItemMeta}>
                          #{ev.bill_number}{ev.location ? ` · ${ev.location}` : ''}
                        </Text>
                        <View style={styles.eventItemFinRow}>
                          <Text style={styles.eventItemFinText}>Rev: {formatCurrency(ev.total_billing, true)}</Text>
                          <Text style={styles.eventItemFinText}>Exp: {formatCurrency(ev.total_expenses + ev.total_misc, true)}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          ) : (
            <View style={styles.noEvents}>
              <Text style={styles.noEventsText}>Tap a date to see events</Text>
              <Text style={styles.noEventsSub}>Dates with dots have scheduled events</Text>
            </View>
          )}
        </View>

        {/* Month summary */}
        {events.length > 0 && (
          <View style={styles.monthSummary}>
            <Text style={styles.monthSummaryTitle}>This Month Summary</Text>
            <View style={styles.monthSummaryRow}>
              <View style={styles.monthSummaryItem}>
                <Text style={styles.monthSummaryVal}>{events.length}</Text>
                <Text style={styles.monthSummaryLabel}>Events</Text>
              </View>
              <View style={styles.monthSummaryItem}>
                <Text style={styles.monthSummaryVal}>{formatCurrency(events.reduce((s, e) => s + e.total_billing, 0), true)}</Text>
                <Text style={styles.monthSummaryLabel}>Revenue</Text>
              </View>
              <View style={styles.monthSummaryItem}>
                <Text style={[styles.monthSummaryVal, {
                  color: events.reduce((s, e) => s + e.profit_loss, 0) >= 0 ? COLORS.profit : COLORS.loss,
                }]}>
                  {formatCurrency(Math.abs(events.reduce((s, e) => s + e.profit_loss, 0)), true)}
                </Text>
                <Text style={styles.monthSummaryLabel}>Net P/L</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  monthNav: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  navArrow: { padding: 4 },
  monthCenter: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
  dayHeaders: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingBottom: SPACING.sm },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.mutedLight, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  cell: { width: '14.28%', minHeight: 52, alignItems: 'center', paddingTop: 8, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.borderLight },
  cellToday: { backgroundColor: COLORS.accentLight },
  cellSelected: { backgroundColor: COLORS.primary },
  cellHasEvents: { backgroundColor: '#F0F4FF' },
  cellText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.text },
  cellTextToday: { fontWeight: FONT_WEIGHT.bold, color: COLORS.accentDark },
  cellTextSelected: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.accent },

  eventsSection: { padding: SPACING.lg },
  selectedDateLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  noEvents: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: 8 },
  noEventsText: { fontSize: FONT_SIZE.md, color: COLORS.muted, textAlign: 'center' },
  noEventsSub: { fontSize: FONT_SIZE.sm, color: COLORS.mutedLight, textAlign: 'center' },

  eventItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  eventStatusBar: { width: 4, alignSelf: 'stretch' },
  eventItemBody: { flex: 1, padding: SPACING.md },
  eventItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  eventItemName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text, flex: 1, marginRight: 8 },
  eventItemPL: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  eventItemMeta: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginBottom: 4 },
  eventItemFinRow: { flexDirection: 'row', gap: SPACING.md },
  eventItemFinText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

  monthSummary: { margin: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  monthSummaryTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.md },
  monthSummaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  monthSummaryItem: { alignItems: 'center' },
  monthSummaryVal: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  monthSummaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 3 },
});
