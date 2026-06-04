import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { eventsAPI } from '../api/client';
import { Event } from '../types';
import { useAuthStore } from '../store/useStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../constants/theme';
import { formatDate, formatCurrency, formatPL } from '../utils/helpers';
import { StatusBadge, ItemRow, ExpenseRow, TotalRow, Divider, SectionHeader } from '../components';

export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { eventId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await eventsAPI.get(eventId);
      setEvent(data);
    } catch {
      Alert.alert('Error', 'Failed to load event', [
        { text: 'Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await eventsAPI.delete(eventId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e?.error || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const canEdit = user && event && (
    user.id === event.created_by || user.role === 'admin'
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loadWrap}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!event) return null;

  const totalExp = event.total_expenses + event.total_misc;
  const { text: plText, isProfit } = formatPL(event.profit_loss);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Header */}
        <View style={[styles.headerCard, SHADOW.sm]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.billNum}>Bill #{event.bill_number}</Text>
            </View>
            <StatusBadge status={event.status} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.muted} />
              <Text style={styles.metaText}>{formatDate(event.date)}</Text>
            </View>
            {!!event.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={COLORS.muted} />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={15} color={COLORS.muted} />
              <Text style={styles.metaText}>By {event.creator?.name || '—'}</Text>
            </View>
          </View>

          {!!event.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{event.notes}</Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={[styles.plCard, isProfit ? styles.plCardProfit : styles.plCardLoss, SHADOW.sm]}>
          <View style={styles.plRow}>
            <View>
              <Text style={styles.plLabel}>NET {isProfit ? 'PROFIT' : 'LOSS'}</Text>
              <Text style={[styles.plValue, { color: isProfit ? COLORS.profit : COLORS.loss }]}>
                {plText}
              </Text>
            </View>
            <Ionicons
              name={isProfit ? 'trending-up' : 'trending-down'}
              size={36}
              color={isProfit ? COLORS.profit : COLORS.loss}
              style={{ opacity: 0.4 }}
            />
          </View>
          <View style={styles.plBreakdown}>
            <TotalRow label="Total Revenue" amount={event.total_billing} />
            <TotalRow label="Regular Expenses" amount={event.total_expenses} />
            <TotalRow label="Misc Expenses" amount={event.total_misc} />
            <Divider margin={6} />
            <TotalRow
              label={isProfit ? 'Net Profit' : 'Net Loss'}
              amount={event.profit_loss}
              bold
              color={isProfit ? COLORS.profit : COLORS.loss}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AddItems', { eventId: event.id, eventName: event.name })}
          >
            <Ionicons name="list-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Billing Items</Text>
            <Text style={styles.actionBtnCount}>{event.billing_items?.length ?? 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Expenses', { eventId: event.id, eventName: event.name })}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Expenses</Text>
            <Text style={styles.actionBtnCount}>
              {(event.expenses?.length ?? 0) + (event.misc_expenses?.length ?? 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('InvoicePreview', { eventId: event.id, billNumber: event.bill_number })}
          >
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ActivityLogScreen', { eventId: event.id, eventName: event.name })}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Billing Items Preview */}
        {event.billing_items && event.billing_items.length > 0 && (
          <View style={[styles.section, SHADOW.sm]}>
            <SectionHeader
              title="Billing Items"
              count={event.billing_items.length}
              right={
                <TouchableOpacity onPress={() => navigation.navigate('AddItems', { eventId: event.id, eventName: event.name })}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              }
            />
            {event.billing_items.slice(0, 5).map((item, i) => (
              <ItemRow key={item.id} item={item} index={i} readonly />
            ))}
            {event.billing_items.length > 5 && (
              <TouchableOpacity
                style={styles.showMore}
                onPress={() => navigation.navigate('AddItems', { eventId: event.id, eventName: event.name })}
              >
                <Text style={styles.showMoreText}>+{event.billing_items.length - 5} more items</Text>
              </TouchableOpacity>
            )}
            <View style={styles.totalBox}>
              <TotalRow label="Total Billing" amount={event.total_billing} bold />
            </View>
          </View>
        )}

        {/* Expenses Preview */}
        {((event.expenses?.length ?? 0) > 0 || (event.misc_expenses?.length ?? 0) > 0) && (
          <View style={[styles.section, SHADOW.sm]}>
            <SectionHeader
              title="Expenses"
              count={(event.expenses?.length ?? 0) + (event.misc_expenses?.length ?? 0)}
              right={
                <TouchableOpacity onPress={() => navigation.navigate('Expenses', { eventId: event.id, eventName: event.name })}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              }
            />
            {event.expenses?.slice(0, 3).map(exp => (
              <ExpenseRow key={exp.id} expense={exp} />
            ))}
            {event.misc_expenses?.slice(0, 2).map(exp => (
              <ExpenseRow key={exp.id} expense={exp} isMisc />
            ))}
            <View style={styles.totalBox}>
              <TotalRow label="Total Expenses" amount={totalExp} bold />
            </View>
          </View>
        )}

        {/* Edit / Delete */}
        {canEdit && (
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.editFullBtn}
              onPress={() => navigation.navigate('CreateEvent', { eventId: event.id })}
            >
              <Ionicons name="pencil-outline" size={18} color={COLORS.white} />
              <Text style={styles.editFullBtnText}>Edit Event Details</Text>
            </TouchableOpacity>

            {user?.role === 'admin' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={COLORS.loss} />
                <Text style={styles.deleteBtnText}>Delete Event</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  eventName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  billNum: { fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 3 },
  metaGrid: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  notesBox: { backgroundColor: COLORS.accentLight, borderRadius: RADIUS.xs, padding: SPACING.sm, marginTop: SPACING.sm },
  notesText: { fontSize: FONT_SIZE.sm, color: COLORS.accentDark, fontStyle: 'italic' },

  plCard: { borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1 },
  plCardProfit: { backgroundColor: COLORS.profitLight, borderColor: COLORS.profit + '30' },
  plCardLoss: { backgroundColor: COLORS.lossLight, borderColor: COLORS.loss + '30' },
  plRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  plLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  plValue: { fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.heavy },
  plBreakdown: { backgroundColor: COLORS.white + '80', borderRadius: RADIUS.xs, padding: SPACING.md },

  actions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight, gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textSecondary, textAlign: 'center' },
  actionBtnCount: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight },
  editLink: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.secondary },
  showMore: { paddingVertical: 10, alignItems: 'center' },
  showMoreText: { fontSize: FONT_SIZE.sm, color: COLORS.secondary, fontWeight: FONT_WEIGHT.medium },
  totalBox: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xs, padding: SPACING.sm, marginTop: SPACING.sm },

  dangerZone: { gap: SPACING.sm, marginTop: SPACING.sm },
  editFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 14 },
  editFullBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.loss, borderRadius: RADIUS.sm, paddingVertical: 12 },
  deleteBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.loss },
});
