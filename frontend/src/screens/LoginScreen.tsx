
import React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../store/useStore';

console.log(useAuthStore);

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>LOGIN WORKS</Text>
    </View>
  );
}

//import React, { useState } from 'react';
//import {
//  View, Text, StyleSheet, TextInput, TouchableOpacity,
//  KeyboardAvoidingView, Platform, ActivityIndicator,
//  Alert, ScrollView, StatusBar,
//} from 'react-native';
//import { SafeAreaView } from 'react-native-safe-area-context';
//import { Ionicons } from '@expo/vector-icons';
//import { useAuthStore } from '../store/useStore';
//import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../constants/theme';
//
//export default function LoginScreen() {
//
//    console.log('COLORS', COLORS);
//console.log('SPACING', SPACING);
//console.log('RADIUS', RADIUS);
//console.log('SHADOW', SHADOW);
//
//  const [email, setEmail] = useState('');
//  const [password, setPassword] = useState('');
//  const [showPass, setShowPass] = useState(false);
//  const [loading, setLoading] = useState(false);
//  const { login } = useAuthStore();
//
//  const handleLogin = async () => {
//    const trimEmail = email.trim().toLowerCase();
//    const trimPass = password.trim();
//    if (!trimEmail || !trimPass) {
//      Alert.alert('Error', 'Please enter your email and password.');
//      return;
//    }
//    setLoading(true);
//    try {
//      await login(trimEmail, trimPass);
//    } catch (err: any) {
//      Alert.alert('Login Failed', err?.error || 'Invalid email or password. Please try again.');
//    } finally {
//      setLoading(false);
//    }
//  };
//
//  return (
//    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
//      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
//      <KeyboardAvoidingView
//        style={{ flex: 1 }}
//        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//      >
//        <ScrollView
//          contentContainerStyle={styles.scroll}
//          keyboardShouldPersistTaps="handled"
//          showsVerticalScrollIndicator={false}
//        >
//          {/* Header */}
//          <View style={styles.header}>
//            <View style={styles.logoCircle}>
//              <Ionicons name="restaurant-outline" size={34} color={COLORS.accent} />
//            </View>
//            <Text style={styles.appName}>CATERI</Text>
//            <Text style={styles.appTagline}>Business Management System</Text>
//          </View>
//
//          {/* Form Card */}
//          <View style={[styles.card, SHADOW.lg]}>
//            <Text style={styles.cardTitle}>Welcome Back</Text>
//            <Text style={styles.cardSub}>Sign in to continue</Text>
//
//            {/* Email */}
//            <View style={styles.fieldGroup}>
//              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
//              <View style={styles.fieldWrap}>
//                <Ionicons name="mail-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
//                <TextInput
//                  style={styles.fieldInput}
//                  value={email}
//                  onChangeText={setEmail}
//                  placeholder="admin@yourcompany.com"
//                  placeholderTextColor={COLORS.mutedLight}
//                  keyboardType="email-address"
//                  autoCapitalize="none"
//                  autoCorrect={false}
//                  returnKeyType="next"
//                  editable={!loading}
//                />
//              </View>
//            </View>
//
//            {/* Password */}
//            <View style={styles.fieldGroup}>
//              <Text style={styles.fieldLabel}>PASSWORD</Text>
//              <View style={styles.fieldWrap}>
//                <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
//                <TextInput
//                  style={styles.fieldInput}
//                  value={password}
//                  onChangeText={setPassword}
//                  placeholder="••••••••"
//                  placeholderTextColor={COLORS.mutedLight}
//                  secureTextEntry={!showPass}
//                  returnKeyType="done"
//                  onSubmitEditing={handleLogin}
//                  editable={!loading}
//                />
//                <TouchableOpacity
//                  onPress={() => setShowPass(v => !v)}
//                  style={styles.eyeBtn}
//                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                >
//                  <Ionicons
//                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
//                    size={18}
//                    color={COLORS.muted}
//                  />
//                </TouchableOpacity>
//              </View>
//            </View>
//
//            {/* Submit */}
//            <TouchableOpacity
//              style={[styles.loginBtn, loading && styles.loginBtnDim]}
//              onPress={handleLogin}
//              disabled={loading}
//              activeOpacity={0.85}
//            >
//              {loading
//                ? <ActivityIndicator color={COLORS.primary} size="small" />
//                : <Text style={styles.loginBtnText}>SIGN IN</Text>
//              }
//            </TouchableOpacity>
//
//            <Text style={styles.hint}>
//              Contact your administrator to get access credentials.
//            </Text>
//          </View>
//
//          <Text style={styles.footer}>Catering Management v1.0</Text>
//        </ScrollView>
//      </KeyboardAvoidingView>
//    </SafeAreaView>
//  );
//}
//
//const styles = StyleSheet.create({
//  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
//  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
//  header: { alignItems: 'center', marginBottom: 36 },
//  logoCircle: {
//    width: 72, height: 72, borderRadius: RADIUS.lg,
//    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
//    marginBottom: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.accent + '50',
//  },
//  appName: { fontSize: 30, fontWeight: FONT_WEIGHT.heavy, color: COLORS.white, letterSpacing: 7 },
//  appTagline: { fontSize: FONT_SIZE.sm, color: '#8899AA', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' },
//
//  card: {
//    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
//    padding: SPACING.xxl, marginBottom: SPACING.lg,
//  },
//  cardTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: 4 },
//  cardSub: { fontSize: FONT_SIZE.sm, color: COLORS.muted, marginBottom: SPACING.xxl },
//
//  fieldGroup: { marginBottom: SPACING.lg },
//  fieldLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
//  fieldWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.sm, backgroundColor: COLORS.offWhite },
//  fieldIcon: { paddingLeft: SPACING.md },
//  fieldInput: { flex: 1, paddingVertical: 13, paddingHorizontal: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.text },
//  eyeBtn: { padding: SPACING.md },
//
//  loginBtn: {
//    backgroundColor: COLORS.accent, borderRadius: RADIUS.sm,
//    paddingVertical: 15, alignItems: 'center', marginBottom: SPACING.lg,
//  },
//  loginBtnDim: { opacity: 0.6 },
//  loginBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.heavy, color: COLORS.primary, letterSpacing: 2 },
//
//  hint: { fontSize: FONT_SIZE.xs, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
//  footer: { fontSize: 11, color: '#445566', textAlign: 'center', letterSpacing: 0.5 },
//});
