// app/(tabs)/profile.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.config';

import { LanguageSwitcher } from '../../components/settings/LanguageSwitcher';
import { useUserStore } from '../../store/userStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { clearAuthToken } from '../../services/api';
import { clearCache } from '../../services/farmService';
import { useLocation } from '../../hooks/useLocation';
import { getAddressFromCoordinates } from '../../services/locationService';

// FAQ data
const FAQ_ITEMS = [
  { q: 'profile.faq.q1', a: 'profile.faq.a1' },
  { q: 'profile.faq.q2', a: 'profile.faq.a2' },
  { q: 'profile.faq.q3', a: 'profile.faq.a3' },
  { q: 'profile.faq.q4', a: 'profile.faq.a4' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, preferences, setLanguage, setNotificationSettings, logout, updateUser, setTheme } =
    useUserStore();

  const { location, hasPermission, requestPermission, loading: locationLoading } =
    useLocation();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationResolving, setLocationResolving] = useState(false);

  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Reverse geocode device location and cache it in the user profile
  useEffect(() => {
    if (!location) return;

    const resolveAddress = async () => {
      setLocationResolving(true);
      try {
        const address = await getAddressFromCoordinates(location);
        setLocationLabel(address);

        // Also persist into user store so it shows even without GPS on next open
        if (user) {
          const parts = address.split(', ');
          updateUser({
            location: {
              city: parts[0] ?? '',
              state: parts[1] ?? '',
              country: parts[2] ?? 'India',
            },
          });
        }
      } catch {
        setLocationLabel(
          `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
        );
      } finally {
        setLocationResolving(false);
      }
    };

    resolveAddress();
  // Only run when location coords change meaningfully
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);

  /** Derive display label for location in the user card */
  const displayLocation = (() => {
    if (locationResolving) return null; // show spinner
    if (locationLabel) return locationLabel;
    // Fall back to stored user location
    if (user?.location?.city) {
      return user.location.state
        ? `${user.location.city}, ${user.location.state}`
        : user.location.city;
    }
    return null; // no location known
  })();

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
    const url = 'mailto:support@bhoomi.app?subject=Support%20Request';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email app installed on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not open email app.');
    }
  };

  const langLabels: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    kn: 'ಕನ್ನಡ (Kannada)',
  };

  const themeLabels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color="#10B981" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name || t('profile.defaultName')}
            </Text>

            {/* Location row */}
            {locationLoading || locationResolving ? (
              <View style={styles.locationRow}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.locationResolving}>Locating…</Text>
              </View>
            ) : displayLocation ? (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="#10B981" />
                <Text style={styles.userLocation}>{displayLocation}</Text>
              </View>
            ) : !hasPermission ? (
              <Pressable
                style={styles.grantLocationBtn}
                onPress={async () => {
                  await requestPermission();
                }}
              >
                <Ionicons name="locate" size={13} color="#3B82F6" />
                <Text style={styles.grantLocationText}>Grant location access</Text>
              </Pressable>
            ) : (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                <Text style={[styles.userLocation, { color: '#9CA3AF' }]}>
                  {t('profile.locationNotSet')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Location permission banner if denied */}
        {!hasPermission && !locationLoading && (
          <Pressable style={styles.locationBanner} onPress={requestPermission}>
            <Ionicons name="location-outline" size={20} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Enable Location Access</Text>
              <Text style={styles.bannerDesc}>
                Allow BHOOMI to use your location for personalised farm insights.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
          </Pressable>
        )}

        {/* Settings Section */}
        <SectionHeader title={t('profile.settingsTitle')} />

        {/* Theme Switcher Row */}
        <SettingsRow
          icon="color-palette"
          iconColor="#10B981"
          label="Appearance Theme"
          value={themeLabels[preferences.theme || 'system']}
          onPress={() => setShowThemePicker(true)}
          showChevron
        />

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
          <Text style={styles.versionText}>BHOOMI v1.0.0</Text>
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

      {/* Theme Picker Modal */}
      {showThemePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            {(Object.keys(themeLabels) as Array<keyof typeof themeLabels>).map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.modalOption,
                  preferences.theme === key && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setTheme(key as 'light' | 'dark' | 'system');
                  setShowThemePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    preferences.theme === key && styles.modalOptionTextActive,
                  ]}
                >
                  {themeLabels[key]}
                </Text>
                {preferences.theme === key && (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                )}
              </Pressable>
            ))}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const { colors } = useAppTheme();
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
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
  const { colors } = useAppTheme();
  const rowStyles = useMemo(() => createRowStyles(colors), [colors]);
  return (
    <Pressable style={rowStyles.container} onPress={onPress}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>
        {value && <Text style={rowStyles.value}>{value}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
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
  const { colors } = useAppTheme();
  const rowStyles = useMemo(() => createRowStyles(colors), [colors]);
  return (
    <View style={rowStyles.container}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.successLight }}
        thumbColor={value ? colors.primary : colors.textMuted}
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
  const { colors } = useAppTheme();
  const faqStyles = useMemo(() => createFaqStyles(colors), [colors]);
  return (
    <View style={faqStyles.item}>
      <Pressable style={faqStyles.question} onPress={onToggle}>
        <Text style={faqStyles.questionText}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>
      {expanded && <Text style={faqStyles.answer}>{answer}</Text>}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDark ? `${colors.primary}20` : colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userLocation: { fontSize: 13, color: colors.textSecondary },
  locationResolving: { fontSize: 13, color: colors.primary, marginLeft: 6 },
  grantLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? `${colors.info}20` : colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  grantLocationText: { fontSize: 12, color: colors.info, fontWeight: '600' },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: isDark ? `${colors.info}20` : '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#BFDBFE',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: isDark ? colors.info : '#1D4ED8' },
  bannerDesc: { fontSize: 12, color: colors.info, marginTop: 2, lineHeight: 16 },
  faqContainer: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.shadow,
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
    backgroundColor: isDark ? `${colors.danger}20` : colors.dangerLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#FECACA',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger },
  versionInfo: { alignItems: 'center', paddingVertical: 20 },
  versionText: { fontSize: 12, color: colors.textMuted },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionActive: {
    backgroundColor: colors.surfaceActive,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
});

const createSectionStyles = (colors: ColorPalette) => StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

const createRowStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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
  label: { flex: 1, fontSize: 15, color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: 14, color: colors.textSecondary },
});

const createFaqStyles = (colors: ColorPalette) => StyleSheet.create({
  item: { borderBottomWidth: 1, borderBottomColor: colors.border },
  question: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  answer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
