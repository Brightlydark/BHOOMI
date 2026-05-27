// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.config';

import { LanguageSwitcher } from '../../components/settings/LanguageSwitcher';
import { useUserStore } from '../../store/userStore';
import { clearAuthToken } from '../../services/api';
import { clearCache } from '../../services/farmService';

// FAQ data
const FAQ_ITEMS = [
  { q: 'profile.faq.q1', a: 'profile.faq.a1' },
  { q: 'profile.faq.q2', a: 'profile.faq.a2' },
  { q: 'profile.faq.q3', a: 'profile.faq.a3' },
  { q: 'profile.faq.q4', a: 'profile.faq.a4' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, preferences, setLanguage, setNotificationSettings, logout } = useUserStore();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  /**
   * Handle language change — update store + i18n
   */
  const handleLanguageChange = (lang: 'en' | 'hi' | 'kn') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setShowLanguagePicker(false);
  };

  /**
   * Handle logout with confirmation
   */
  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            await clearCache();
            logout();
          },
        },
      ]
    );
  };

  /**
   * Contact support
   */
  const handleContactSupport = async () => {
    const url = 'mailto:support@smartagri.app?subject=Support%20Request';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email app installed on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open email app.');
    }
  };

  const langLabels: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी',
    kn: 'ಕನ್ನಡ',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color="#10B981" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name ?? t('profile.defaultName')}
            </Text>
            <Text style={styles.userLocation}>
              {user?.location?.city
                ? `${user.location.city}, ${user.location.state}`
                : t('profile.locationNotSet')}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <SectionHeader title={t('profile.settingsTitle')} />

        {/* Language Switcher Row */}
        <SettingsRow
          icon="language"
          iconColor="#8B5CF6"
          label={t('profile.language')}
          value={langLabels[preferences.language]}
          onPress={() => setShowLanguagePicker(true)}
          showChevron
        />

        {/* Notification Toggles */}
        <NotificationRow
          icon="notifications"
          iconColor="#F59E0B"
          label={t('profile.notifPush')}
          value={preferences.notifications.push}
          onChange={(v) => setNotificationSettings({ push: v })}
        />
        <NotificationRow
          icon="mail"
          iconColor="#3B82F6"
          label={t('profile.notifEmail')}
          value={preferences.notifications.email}
          onChange={(v) => setNotificationSettings({ email: v })}
        />
        <NotificationRow
          icon="rainy"
          iconColor="#06B6D4"
          label={t('profile.notifWeather')}
          value={preferences.notifications.weather}
          onChange={(v) => setNotificationSettings({ weather: v })}
        />
        <NotificationRow
          icon="water"
          iconColor="#10B981"
          label={t('profile.notifIrrigation')}
          value={preferences.notifications.irrigation}
          onChange={(v) => setNotificationSettings({ irrigation: v })}
        />

        {/* Support Section */}
        <SectionHeader title={t('profile.supportTitle')} />

        <SettingsRow
          icon="headset"
          iconColor="#10B981"
          label={t('profile.contactSupport')}
          onPress={handleContactSupport}
          showChevron
        />

        {/* FAQ Section */}
        <SectionHeader title={t('profile.faqTitle')} />
        <View style={styles.faqContainer}>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              question={t(item.q)}
              answer={t(item.a)}
              expanded={expandedFaq === index}
              onToggle={() =>
                setExpandedFaq(expandedFaq === index ? null : index)
              }
            />
          ))}
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </Pressable>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Smart Agriculture v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Language Picker Modal */}
      {showLanguagePicker && (
        <LanguageSwitcher
          currentLanguage={preferences.language}
          onSelect={handleLanguageChange}
          onClose={() => setShowLanguagePicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.text}>{title}</Text>
    </View>
  );
}

interface SettingsRowProps {
  icon: string;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}
function SettingsRow({ icon, iconColor, label, value, onPress, showChevron }: SettingsRowProps) {
  return (
    <Pressable style={rowStyles.container} onPress={onPress}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>
        {value && <Text style={rowStyles.value}>{value}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />}
      </View>
    </Pressable>
  );
}

interface NotificationRowProps {
  icon: string;
  iconColor: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}
function NotificationRow({ icon, iconColor, label, value, onChange }: NotificationRowProps) {
  return (
    <View style={rowStyles.container}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
        thumbColor={value ? '#10B981' : '#9CA3AF'}
      />
    </View>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
}
function FAQItem({ question, answer, expanded, onToggle }: FAQItemProps) {
  return (
    <View style={faqStyles.item}>
      <Pressable style={faqStyles.question} onPress={onToggle}>
        <Text style={faqStyles.questionText}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#6B7280"
        />
      </Pressable>
      {expanded && <Text style={faqStyles.answer}>{answer}</Text>}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  userLocation: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutContainer: { marginHorizontal: 16, marginTop: 24, marginBottom: 8 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  versionInfo: { alignItems: 'center', paddingVertical: 20 },
  versionText: { fontSize: 12, color: '#9CA3AF' },
});

const sectionStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  text: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { flex: 1, fontSize: 15, color: '#111827' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: 14, color: '#6B7280' },
});

const faqStyles = StyleSheet.create({
  item: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  question: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  answer: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 14, color: '#6B7280', lineHeight: 22 },
});
