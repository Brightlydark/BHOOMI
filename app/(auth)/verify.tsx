// app/(auth)/verify.tsx — BHOOMI OTP Verification
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

const OTP_LENGTH = 4;
const RESEND_SECS = 30;

export default function VerifyScreen() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(RESEND_SECS);
  const [shaking, setShaking] = useState(false);
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const login = useUserStore((s) => s.login);
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Refs for each OTP input box
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // Auto-verify when all digits entered
  useEffect(() => {
    if (isComplete) handleVerify();
  }, [otp]);

  const handleVerify = () => {
    // Demo: any 4 digits pass
    if (otp.length === OTP_LENGTH) {
      login(phone as string);
      // _layout will redirect to setup or tabs
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    const newDigits = [...digits];
    const char = val.slice(-1); // only last char
    newDigits[index] = char;
    setDigits(newDigits);

    // Advance focus
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setDigits(['', '', '', '']);
    setResendTimer(RESEND_SECS);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kbView}
      >
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <View style={styles.backBtnInner}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </View>
        </Pressable>

        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          {/* Shield icon with gradient */}
          <LinearGradient
            colors={['#059669', '#10B981']}
            style={styles.iconCircle}
          >
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </LinearGradient>

          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            We've sent a 4-digit code to
          </Text>
          <Text style={styles.phoneDisplay}>+91 {phone}</Text>
        </MotiView>

        {/* OTP boxes */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 150 }}
        >
          <Animated.View
            style={[
              styles.otpRow,
              {
                transform: [
                  {
                    translateX: shakeAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-8, 0, 8],
                    }),
                  },
                ],
              },
            ]}
          >
            {digits.map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : undefined,
                  i === digits.findIndex((d) => !d) && styles.otpBoxActive,
                ]}
              >
                <TextInput
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  caretHidden
                  autoFocus={i === 0}
                  selectTextOnFocus
                />
              </View>
            ))}
          </Animated.View>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
              <Text style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify CTA */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, !isComplete && styles.btnDisabled]}
              onPress={handleVerify}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!isComplete}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isComplete ? ['#059669', '#10B981'] : [colors.border, colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={isComplete ? '#FFFFFF' : colors.textMuted}
                />
                <Text style={[styles.btnText, !isComplete && styles.btnTextDisabled]}>
                  Verify & Continue
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.demoNote}>
            Demo: enter any 4 digits to proceed
          </Text>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    kbView: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },

    backBtn: { marginBottom: 32 },
    backBtnInner: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.card,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },

    // Header
    header: { alignItems: 'center', marginBottom: 48 },
    iconCircle: {
      width: 72, height: 72, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      fontSize: 26, fontWeight: '800',
      color: colors.text, marginBottom: 8,
    },
    subtitle: {
      fontSize: 15, color: colors.textSecondary, marginBottom: 4,
    },
    phoneDisplay: {
      fontSize: 17, fontWeight: '700', color: colors.primary,
    },

    // OTP boxes
    otpRow: {
      flexDirection: 'row', justifyContent: 'center',
      gap: 14, marginBottom: 28,
    },
    otpBox: {
      width: 64, height: 70,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    otpBoxFilled: {
      borderColor: colors.primary,
      backgroundColor: isDark ? `${colors.primary}15` : '#ECFDF5',
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    otpBoxActive: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    otpInput: {
      width: '100%', height: '100%',
      fontSize: 28, fontWeight: '700',
      color: colors.text, textAlign: 'center',
      borderRadius: 16,
    },

    // Resend
    resendRow: {
      flexDirection: 'row', justifyContent: 'center',
      alignItems: 'center', marginBottom: 28,
    },
    resendLabel: { fontSize: 14, color: colors.textSecondary },
    resendBtn: { fontSize: 14, fontWeight: '700', color: colors.primary },
    resendBtnDisabled: { color: colors.textMuted },

    // CTA
    btn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    btnDisabled: { opacity: 0.6 },
    btnGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 17, gap: 8,
    },
    btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    btnTextDisabled: { color: colors.textMuted },

    demoNote: {
      textAlign: 'center', fontSize: 12,
      color: colors.textMuted, fontStyle: 'italic',
    },
  });
