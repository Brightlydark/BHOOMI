// app/(auth)/login.tsx — BHOOMI Premium Login
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();

  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const canContinue = phone.length >= 10;

  const handleContinue = () => {
    if (canContinue) {
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    }
  };

  return (
    <View style={styles.root}>
      {/* Top gradient hero section */}
      <LinearGradient
        colors={isDark ? ['#020d08', '#031a0e', '#0a2618'] : ['#064e3b', '#059669', '#10B981']}
        style={styles.heroGradient}
      >
        {/* Ambient orbs */}
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomLeft} />

        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 100 }}
            style={styles.heroContent}
          >
            {/* Logo mark */}
            <View style={styles.logoMark}>
              <Ionicons name="leaf" size={32} color="#10B981" />
            </View>

            <Text style={styles.heroTitle}>BHOOMI</Text>
            <Text style={styles.heroTagline}>{t('auth.tagline', 'Intelligent Land. Empowered Farmers.')}</Text>
          </MotiView>
        </SafeAreaView>
      </LinearGradient>

      {/* Bottom card / form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formCard}
      >
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 18, stiffness: 120 }}
          style={styles.formInner}
        >
          <Text style={styles.formTitle}>{t('auth.welcomeBack', 'Welcome back')}</Text>
          <Text style={styles.formSubtitle}>
            {t('auth.enterMobile', 'Enter your mobile number to continue')}
          </Text>

          {/* Phone input */}
          <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
            <View style={styles.flagCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
              <View style={styles.codeDivider} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="00000 00000"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {phone.length > 0 && (
              <Pressable onPress={() => setPhone('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* CTA button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, !canContinue && styles.btnDisabled]}
              onPress={handleContinue}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!canContinue}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={canContinue ? ['#059669', '#10B981'] : [colors.border, colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>
                  {t('auth.continue', 'Continue')}
                </Text>
                {canContinue && (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legalText}>
            {t('auth.legalPrefix', "By continuing, you agree to BHOOMI's ")}
            <Text style={styles.legalLink}>{t('auth.tos', 'Terms of Service')}</Text>
            {t('auth.and', ' and ')}
            <Text style={styles.legalLink}>{t('auth.privacyPolicy', 'Privacy Policy')}</Text>
          </Text>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    // Hero section
    heroGradient: { height: 280, position: 'relative', overflow: 'hidden' },
    heroSafe: { flex: 1 },
    heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
    orbTopRight: {
      position: 'absolute', top: -40, right: -40,
      width: 160, height: 160, borderRadius: 80,
      backgroundColor: '#34D399', opacity: 0.12,
    },
    orbBottomLeft: {
      position: 'absolute', bottom: -30, left: -30,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: '#6EE7B7', opacity: 0.1,
    },
    logoMark: {
      width: 64, height: 64, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    heroTitle: {
      fontSize: 40, fontWeight: '800', color: '#FFFFFF',
      letterSpacing: 8, marginBottom: 6,
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    heroTagline: {
      fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.75)',
      letterSpacing: 0.3,
    },

    // Form card
    formCard: {
      flex: 1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.card,
      marginTop: -28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 20,
      elevation: 12,
    },
    formInner: { padding: 28, paddingTop: 32, flex: 1 },
    formTitle: {
      fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 6,
    },
    formSubtitle: {
      fontSize: 15, color: colors.textSecondary, marginBottom: 28,
    },

    // Phone input
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 16, backgroundColor: colors.background,
      marginBottom: 24,
      overflow: 'hidden',
    },
    inputRowFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    flagCode: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, gap: 6,
    },
    flag: { fontSize: 20 },
    code: { fontSize: 16, fontWeight: '600', color: colors.text },
    codeDivider: { width: 1, height: 24, backgroundColor: colors.border, marginLeft: 6 },
    input: {
      flex: 1, paddingVertical: 16, paddingHorizontal: 12,
      fontSize: 18, color: colors.text, letterSpacing: 1,
    },
    clearBtn: { paddingRight: 14 },

    // CTA button
    btn: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
    btnDisabled: { opacity: 0.6 },
    btnGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 17, gap: 8,
    },
    btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    btnTextDisabled: { color: colors.textMuted },

    // Legal
    legalText: {
      textAlign: 'center', fontSize: 12,
      color: colors.textMuted, lineHeight: 18,
    },
    legalLink: { color: colors.primary, fontWeight: '600' },
  });
