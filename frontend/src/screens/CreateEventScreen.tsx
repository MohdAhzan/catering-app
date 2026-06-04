import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { eventsAPI } from '../api/client';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../constants/theme';
import { generateBillNumber, toAPIDate } from '../utils/helpers';
import { InputField, PrimaryButton } from '../components';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CreateEventScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isEdit = !!route.params?.eventId;

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(toAPIDate(new Date()));
  const [billNumber, setBillNumber] = useState(generateBillNumber());
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const suggestTimeout = useRef<any>(null);

  useEffect(() => {
    if (isEdit) loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      const ev = await eventsAPI.get(route.params.eventId);
      setName(ev.name);
      setLocation(ev.location || '');
      setDate(ev.date ? ev.date.split('T')[0] : toAPIDate(new Date()));
      setBillNumber(ev.bill_number);
      setStatus(ev.status);
      setNotes(ev.notes || '');
    } catch {
      Alert.alert('Error', 'Failed to load event');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    clearTimeout(suggestTimeout.current);
    suggestTimeout.current = setTimeout(async () => {
      try {
        const data = await eventsAPI.suggestions(q);
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {}
    }, 300);
  };

  const onNameChange = (v: string) => {
    setName(v);
    fetchSuggestions(v);
    if (errors.name) setErrors(p => ({ ...p, name: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Event name is required';
    if (!date.trim()) errs.date = 'Date is required';
    if (!billNumber.trim()) errs.billNumber = 'Bill number is required';
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (date && !dateRegex.test(date)) errs.date = 'Use format YYYY-MM-DD';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        date: date.trim(),
        bill_number: billNumber.trim(),
        status,
        notes: notes.trim(),
      };
      if (isEdit) {
        await eventsAPI.update(route.params.eventId, payload);
        Alert.alert('Success', 'Event updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const ev = await eventsAPI.create(payload);
        Alert.alert('Success', 'Event created successfully', [
          { text: 'OK', onPress: () => navigation.navigate('EventDetail', { eventId: ev.id }) },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.error || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loadWrap}><ActivityIndicator size="large" color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Event Name with Autocomplete */}
          <View style={{ zIndex: 10 }}>
            <Text style={styles.fieldLabel}>EVENT NAME *</Text>
            <View style={[styles.fieldWrap, errors.name && styles.fieldErr]}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={onNameChange}
                placeholder="e.g., Sharma Wedding Reception"
                placeholderTextColor={COLORS.mutedLight}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {name.length > 0 && (
                <TouchableOpacity onPress={() => { setName(''); setSuggestions([]); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
                </TouchableOpacity>
              )}
            </View>
            {errors.name ? <Text style={styles.errText}>{errors.name}</Text> : null}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestBox, SHADOW.md]}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestItem}
                    onPress={() => { setName(s); setShowSuggestions(false); setSuggestions([]); }}
                  >
                    <Ionicons name="time-outline" size={14} color={COLORS.muted} />
                    <Text style={styles.suggestText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LOCATION</Text>
            <View style={styles.fieldWrap}>
              <Ionicons name="location-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Venue / Address"
                placeholderTextColor={COLORS.mutedLight}
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DATE * (YYYY-MM-DD)</Text>
            <View style={[styles.fieldWrap, errors.date && styles.fieldErr]}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={date}
                onChangeText={(v) => { setDate(v); if (errors.date) setErrors(p => ({ ...p, date: '' })); }}
                placeholder="2025-12-31"
                placeholderTextColor={COLORS.mutedLight}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {errors.date ? <Text style={styles.errText}>{errors.date}</Text> : null}
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-12-25)</Text>
          </View>

          {/* Bill Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BILL NUMBER *</Text>
            <View style={[styles.fieldWrap, errors.billNumber && styles.fieldErr]}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={billNumber}
                onChangeText={(v) => { setBillNumber(v); if (errors.billNumber) setErrors(p => ({ ...p, billNumber: '' })); }}
                placeholder="INV-2501-1234"
                placeholderTextColor={COLORS.mutedLight}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={() => setBillNumber(generateBillNumber())}
                style={styles.genBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.genBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>
            {errors.billNumber ? <Text style={styles.errText}>{errors.billNumber}</Text> : null}
          </View>

          {/* Status */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>STATUS</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusBtn, status === opt.value && styles.statusBtnActive]}
                  onPress={() => setStatus(opt.value)}
                >
                  <Text style={[styles.statusBtnText, status === opt.value && styles.statusBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NOTES</Text>
            <View style={[styles.fieldWrap, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions or notes…"
                placeholderTextColor={COLORS.mutedLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <PrimaryButton
            label={saving ? 'Saving…' : isEdit ? 'Update Event' : 'Create Event'}
            onPress={handleSave}
            loading={saving}
            icon={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'}
            size="lg"
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 6, marginTop: SPACING.md, textTransform: 'uppercase' },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface },
  fieldErr: { borderColor: COLORS.loss },
  fieldIcon: { paddingLeft: SPACING.md },
  fieldInput: { flex: 1, paddingVertical: 13, paddingHorizontal: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text },
  notesInput: { paddingTop: 13, minHeight: 80 },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.loss, marginTop: 4 },
  hint: { fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 3 },
  genBtn: { backgroundColor: COLORS.accentLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.xs, marginRight: 8 },
  genBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.accentDark },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.round, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  statusBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.muted },
  statusBtnTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
  suggestBox: { position: 'absolute', top: 'auto', left: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, zIndex: 100, marginTop: 2 },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  suggestText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
});
