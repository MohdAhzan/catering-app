import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { billingAPI } from '../api/client';
import { BillingItem } from '../types';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../constants/theme';
import { formatCurrency, parseAmount } from '../utils/helpers';
import { ItemRow, SectionHeader, EmptyState, TotalRow, Divider, PrimaryButton } from '../components';

export default function AddItemsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId, eventName } = route.params;

  const [items, setItems] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BillingItem | null>(null);

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await billingAPI.list(eventId);
      setItems(data || []);
    } catch {
      Alert.alert('Error', 'Failed to load billing items');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => {
    setEditingItem(null);
    setItemName(''); setDescription(''); setQuantity('1'); setRate('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item: BillingItem) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setDescription(item.description || '');
    setQuantity(String(item.quantity));
    setRate(String(item.rate));
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!itemName.trim()) errs.itemName = 'Item name is required';
    if (!quantity || parseAmount(quantity) <= 0) errs.quantity = 'Quantity must be > 0';
    if (!rate || parseAmount(rate) < 0) errs.rate = 'Rate must be a valid number';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        item_name: itemName.trim(),
        description: description.trim(),
        quantity: parseAmount(quantity),
        rate: parseAmount(rate),
        sort_order: editingItem ? editingItem.sort_order : items.length,
      };
      if (editingItem) {
        await billingAPI.update(eventId, editingItem.id, payload);
      } else {
        await billingAPI.create(eventId, payload);
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.error || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: BillingItem) => {
    Alert.alert('Delete Item', `Delete "${item.item_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await billingAPI.delete(eventId, item.id);
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.error || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const total = items.reduce((s, i) => s + i.amount, 0);
  const amount = parseAmount(quantity) * parseAmount(rate);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loadWrap}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Items list */}
          <View style={[styles.section, SHADOW.sm]}>
            <SectionHeader
              title="Line Items"
              count={items.length}
              right={
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                  <Ionicons name="add" size={16} color={COLORS.white} />
                  <Text style={styles.addBtnText}>Add Item</Text>
                </TouchableOpacity>
              }
            />

            {items.length === 0 ? (
              <EmptyState
                icon="list-outline"
                title="No billing items yet"
                subtitle="Add items like services, materials, or any chargeable line"
                action={{ label: 'Add First Item', onPress: openAdd }}
              />
            ) : (
              <>
                {items.map((item, i) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={i}
                    onEdit={() => openEdit(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
                <View style={styles.totalWrap}>
                  <Divider margin={8} />
                  <TotalRow label="Total Billing Amount" amount={total} bold />
                </View>
              </>
            )}
          </View>

          {/* Quick add hint */}
          {items.length > 0 && (
            <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.addMoreText}>Add Another Item</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Billing Item'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Item Name */}
                <Text style={styles.fieldLabel}>ITEM NAME *</Text>
                <TextInput
                  style={[styles.fieldInput, formErrors.itemName && styles.fieldErr]}
                  value={itemName}
                  onChangeText={(v) => { setItemName(v); if (formErrors.itemName) setFormErrors(p => ({ ...p, itemName: '' })); }}
                  placeholder="e.g., Chair Cover, Catering Service"
                  placeholderTextColor={COLORS.mutedLight}
                  autoFocus
                />
                {formErrors.itemName ? <Text style={styles.errText}>{formErrors.itemName}</Text> : null}

                {/* Description */}
                <Text style={styles.fieldLabel}>DESCRIPTION (optional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details"
                  placeholderTextColor={COLORS.mutedLight}
                />

                {/* Qty & Rate */}
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>QUANTITY *</Text>
                    <TextInput
                      style={[styles.fieldInput, formErrors.quantity && styles.fieldErr]}
                      value={quantity}
                      onChangeText={(v) => { setQuantity(v); if (formErrors.quantity) setFormErrors(p => ({ ...p, quantity: '' })); }}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={COLORS.mutedLight}
                    />
                    {formErrors.quantity ? <Text style={styles.errText}>{formErrors.quantity}</Text> : null}
                  </View>
                  <View style={{ width: SPACING.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>RATE (₹) *</Text>
                    <TextInput
                      style={[styles.fieldInput, formErrors.rate && styles.fieldErr]}
                      value={rate}
                      onChangeText={(v) => { setRate(v); if (formErrors.rate) setFormErrors(p => ({ ...p, rate: '' })); }}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={COLORS.mutedLight}
                    />
                    {formErrors.rate ? <Text style={styles.errText}>{formErrors.rate}</Text> : null}
                  </View>
                </View>

                {/* Live preview */}
                {parseAmount(quantity) > 0 && parseAmount(rate) > 0 && (
                  <View style={styles.preview}>
                    <Text style={styles.previewLabel}>
                      {quantity} × {formatCurrency(parseAmount(rate))} =
                    </Text>
                    <Text style={styles.previewAmount}>{formatCurrency(amount)}</Text>
                  </View>
                )}

                <PrimaryButton
                  label={saving ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}
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
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.round },
  addBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
  totalWrap: { marginTop: SPACING.sm },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: SPACING.lg },
  addMoreText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.secondary },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000060' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },

  fieldLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: SPACING.md },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical: 12, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, backgroundColor: COLORS.surface },
  fieldErr: { borderColor: COLORS.loss },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.loss, marginTop: 4 },
  twoCol: { flexDirection: 'row', marginTop: SPACING.xs },
  preview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.accentLight, borderRadius: RADIUS.sm, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.md },
  previewLabel: { fontSize: FONT_SIZE.sm, color: COLORS.accentDark },
  previewAmount: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.accentDark },
});
