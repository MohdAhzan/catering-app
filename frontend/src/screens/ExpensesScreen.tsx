import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { expensesAPI, miscExpensesAPI } from '../api/client';
import { Expense, MiscExpense } from '../types';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW, EXPENSE_CATEGORIES } from '../constants/theme';
import { formatCurrency, parseAmount } from '../utils/helpers';
import { ExpenseRow, SectionHeader, EmptyState, TotalRow, Divider, PrimaryButton } from '../components';

type ModalType = 'expense' | 'misc' | null;

export default function ExpensesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId } = route.params;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [exp, misc] = await Promise.all([
        expensesAPI.list(eventId),
        miscExpensesAPI.list(eventId),
      ]);
      setExpenses(exp || []);
      setMiscExpenses(misc || []);
    } catch {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openModal = (type: ModalType) => {
    setDescription(''); setAmount(''); setCategory(''); setNote('');
    setFormErrors({});
    setModalType(type);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Description is required';
    if (!amount || parseAmount(amount) <= 0) errs.amount = 'Amount must be > 0';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (modalType === 'expense') {
        await expensesAPI.create(eventId, {
          description: description.trim(),
          amount: parseAmount(amount),
          category: category || 'Other',
        });
      } else {
        await miscExpensesAPI.create(eventId, {
          description: description.trim(),
          amount: parseAmount(amount),
          note: note.trim(),
        });
      }
      setModalType(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.error || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExp = (exp: Expense) => {
    Alert.alert('Delete Expense', `Delete "${exp.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await expensesAPI.delete(eventId, exp.id); load(); }
          catch (e: any) { Alert.alert('Error', e?.error || 'Failed to delete'); }
        },
      },
    ]);
  };

  const handleDeleteMisc = (exp: MiscExpense) => {
    Alert.alert('Delete Misc Expense', `Delete "${exp.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await miscExpensesAPI.delete(eventId, exp.id); load(); }
          catch (e: any) { Alert.alert('Error', e?.error || 'Failed to delete'); }
        },
      },
    ]);
  };

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMisc = miscExpenses.reduce((s, e) => s + e.amount, 0);
  const grandTotal = totalExp + totalMisc;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loadWrap}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Grand Total Banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerLabel}>Total Expenses</Text>
          <Text style={styles.totalBannerVal}>{formatCurrency(grandTotal)}</Text>
        </View>

        {/* Add Buttons */}
        <View style={styles.addRow}>
          <TouchableOpacity style={[styles.addCard, { flex: 1 }]} onPress={() => openModal('expense')}>
            <Ionicons name="receipt-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.addCardTitle}>Add Expense</Text>
            <Text style={styles.addCardSub}>Regular business expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addCard, { flex: 1 }, styles.addCardMisc]} onPress={() => openModal('misc')}>
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.warning} />
            <Text style={styles.addCardTitle}>Add Misc</Text>
            <Text style={styles.addCardSub}>Unexpected expense</Text>
          </TouchableOpacity>
        </View>

        {/* Regular Expenses */}
        <View style={[styles.section, SHADOW.sm]}>
          <SectionHeader title="Regular Expenses" count={expenses.length} />
          {expenses.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No expenses yet" subtitle="Add expenses like transport, food, decoration" />
          ) : (
            <>
              {expenses.map(exp => (
                <ExpenseRow key={exp.id} expense={exp} onDelete={() => handleDeleteExp(exp)} />
              ))}
              <View style={styles.subtotalWrap}>
                <TotalRow label="Regular Expenses Total" amount={totalExp} bold />
              </View>
            </>
          )}
        </View>

        {/* Misc Expenses */}
        <View style={[styles.section, SHADOW.sm]}>
          <View style={styles.miscHeader}>
            <SectionHeader title="Miscellaneous / Unexpected" count={miscExpenses.length} />
          </View>
          <Text style={styles.miscNote}>Unplanned expenses that weren't part of billing</Text>
          {miscExpenses.length === 0 ? (
            <EmptyState icon="alert-circle-outline" title="No misc expenses" subtitle="Add unexpected or unplanned expenses here" />
          ) : (
            <>
              {miscExpenses.map(exp => (
                <ExpenseRow key={exp.id} expense={exp} isMisc onDelete={() => handleDeleteMisc(exp)} />
              ))}
              <View style={styles.subtotalWrap}>
                <TotalRow label="Misc Expenses Total" amount={totalMisc} bold />
              </View>
            </>
          )}
        </View>

        {/* Grand Total */}
        {(expenses.length > 0 || miscExpenses.length > 0) && (
          <View style={[styles.grandTotalCard, SHADOW.sm]}>
            <TotalRow label="Regular Expenses" amount={totalExp} />
            <TotalRow label="Misc Expenses" amount={totalMisc} />
            <Divider margin={8} />
            <TotalRow label="GRAND TOTAL EXPENSES" amount={grandTotal} bold color={COLORS.loss} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!modalType} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'expense' ? 'Add Expense' : 'Add Misc Expense'}
                </Text>
                <TouchableOpacity onPress={() => setModalType(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.fieldLabel}>DESCRIPTION *</Text>
                <TextInput
                  style={[styles.fieldInput, formErrors.description && styles.fieldErr]}
                  value={description}
                  onChangeText={(v) => { setDescription(v); if (formErrors.description) setFormErrors(p => ({ ...p, description: '' })); }}
                  placeholder={modalType === 'expense' ? 'e.g., Transport to venue' : 'e.g., Emergency equipment replacement'}
                  placeholderTextColor={COLORS.mutedLight}
                  autoFocus
                />
                {formErrors.description ? <Text style={styles.errText}>{formErrors.description}</Text> : null}

                <Text style={styles.fieldLabel}>AMOUNT (₹) *</Text>
                <TextInput
                  style={[styles.fieldInput, formErrors.amount && styles.fieldErr]}
                  value={amount}
                  onChangeText={(v) => { setAmount(v); if (formErrors.amount) setFormErrors(p => ({ ...p, amount: '' })); }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.mutedLight}
                />
                {formErrors.amount ? <Text style={styles.errText}>{formErrors.amount}</Text> : null}

                {modalType === 'expense' && (
                  <>
                    <Text style={styles.fieldLabel}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                      <View style={{ flexDirection: 'row', gap: SPACING.xs, paddingVertical: 4 }}>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.catChip, category === cat && styles.catChipActive]}
                            onPress={() => setCategory(cat)}
                          >
                            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                {modalType === 'misc' && (
                  <>
                    <Text style={styles.fieldLabel}>NOTE (optional)</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Why was this expense incurred?"
                      placeholderTextColor={COLORS.mutedLight}
                    />
                  </>
                )}

                <PrimaryButton
                  label={saving ? 'Saving…' : `Add ${modalType === 'misc' ? 'Misc ' : ''}Expense`}
                  onPress={handleSave}
                  loading={saving}
                  size="lg"
                />
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { padding: SPACING.lg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  totalBanner: { backgroundColor: COLORS.loss, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, alignItems: 'center' },
  totalBannerLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: '#FFB3B3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  totalBannerVal: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.white },
  addRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  addCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.borderLight },
  addCardMisc: { borderColor: COLORS.warningLight, backgroundColor: '#FFFBF5' },
  addCardTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  addCardSub: { fontSize: FONT_SIZE.xs, color: COLORS.muted, textAlign: 'center' },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight },
  miscHeader: {},
  miscNote: { fontSize: FONT_SIZE.xs, color: COLORS.muted, fontStyle: 'italic', marginBottom: SPACING.sm },
  subtotalWrap: { marginTop: SPACING.sm, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xs, padding: SPACING.sm },
  grandTotalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000060' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  fieldLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: SPACING.md },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical: 12, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, backgroundColor: COLORS.surface },
  fieldErr: { borderColor: COLORS.loss },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.loss, marginTop: 4 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium, color: COLORS.muted },
  catTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
});
