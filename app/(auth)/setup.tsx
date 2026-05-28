// app/(auth)/setup.tsx — BHOOMI Name Setup
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const completeSetup = useUserStore((s) => s.completeSetup);
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const canSubmit = name.trim().length >= 2;

  const handleFinish = () => {
    if (canSubmit) {
      completeSetup(name.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kbView}
      >
        {/* Decorative top accent */}
        <View style={styles.topAccent}>
          <View style={styles.accentOrb1} />
          <View style={styles.accentOrb2} />
        </View>

        {/* Hero icon */}
        <MotiView
          from={{ opacity: 0, scale: 0.7, translateY: -20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100, damping: 14, stiffness: 120 }}
          style={styles.iconWrapper}
        >
          <LinearGradient
            colors={['#059669', '#10B981', '#34D399']}
            style={styles.iconCircle}
          >
            <Ionicons name="person" size={38} color="#FFFFFF" />
          </LinearGradient>

          {/* Greeting badge */}
          <View style={styles.greetBadge}>
            <Text style={styles.greetEmoji}>👋</Text>
          </View>
        </MotiView>

        {/* Text */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 250 }}
          style={styles.textBlock}
        >
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>
            Let's personalise your{'\n'}
            <Text style={styles.bhoomi}>BHOOMI</Text> experience
          </Text>
        </MotiView>

        {/* Name Input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.formBlock}
        >
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={focused ? colors.primary : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="E.g. Ramesh Kumar"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleFinish}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, !canSubmit && styles.btnDisabled]}
              onPress={handleFinish}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={canSubmit ? ['#059669', '#10B981'] : [colors.border, colors.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={[styles.btnText, !canSubmit && styles.btnTextDisabled]}>
                  Start Farming
                </Text>
                {canSubmit && (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.hint}>
            Your name will appear on your BHOOMI dashboard
          </Text>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    kbView: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

    // Decorative
    topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
    accentOrb1: {
      position: 'absolute', top: -60, right: -40,
      width: 180, height: 180, borderRadius: 90,
      backgroundColor: colors.primary, opacity: isDark ? 0.06 : 0.08,
    },
    accentOrb2: {
      position: 'absolute', top: 20, left: -50,
      width: 140, height: 140, borderRadius: 70,
      backgroundColor: '#34D399', opacity: isDark ? 0.04 : 0.06,
    },

    // Icon
    iconWrapper: { alignItems: 'center', marginBottom: 28, position: 'relative' },
    iconCircle: {
      width: 96, height: 96, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    greetBadge: {
      position: 'absolute',
      bottom: -6, right: '30%',
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.card,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 4,
      elevation: 3,
    },
    greetEmoji: { fontSize: 18 },

    // Text
    textBlock: { alignItems: 'center', marginBottom: 36 },
    title: {
      fontSize: 28, fontWeight: '800',
      color: colors.text, marginBottom: 8,
    },
    subtitle: {
      fontSize: 16, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 24,
    },
    bhoomi: { color: colors.primary, fontWeight: '800' },

    // Form
    formBlock: {},
    label: {
      fontSize: 13, fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 16, backgroundColor: colors.card,
      marginBottom: 24, overflow: 'hidden',
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15, shadowRadius: 8,
      elevation: 4,
    },
    inputIcon: { paddingLeft: 16 },
    input: {
      flex: 1, paddingVertical: 16, paddingHorizontal: 12,
      fontSize: 17, color: colors.text,
    },

    // Button
    btn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    btnDisabled: { opacity: 0.5 },
    btnGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 17, gap: 8,
    },
    btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    btnTextDisabled: { color: colors.textMuted },

    hint: {
      textAlign: 'center', fontSize: 13,
      color: colors.textMuted, lineHeight: 18,
    },
  });
