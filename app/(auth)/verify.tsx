import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useUserStore } from '../../store/userStore';

export default function VerifyScreen() {
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const login = useUserStore(state => state.login);

  useEffect(() => {
    if (otp.length === 4) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = () => {
    if (otp === '1234' || otp.length === 4) { // Mock verification
      login(phone as string);
      // The _layout will automatically redirect to setup because the user lacks a name
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>

        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          style={styles.headerContainer}
        >
          <View style={styles.iconContainer}>
            <ShieldCheck color="#10B981" size={48} />
          </View>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>We've sent a code to +91 {phone}</Text>
        </MotiView>

        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 100 }}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Enter 4-digit code (Any 4 digits for demo)</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="----"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={4}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity 
            style={[styles.button, otp.length < 4 && styles.buttonDisabled]} 
            onPress={handleVerify}
            disabled={otp.length < 4}
          >
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 32,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 32,
    padding: 16,
    fontSize: 32,
    letterSpacing: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
