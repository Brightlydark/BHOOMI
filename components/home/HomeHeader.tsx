// components/home/HomeHeader.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

interface HomeHeaderProps {
  userName: string;
  criticalCount: number;
  avgTemp: number;
  isStable: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ 
  userName, 
  criticalCount, 
  avgTemp, 
  isStable 
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const router = useRouter();
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning', 'Good Morning');
    if (hour < 17) return t('home.goodAfternoon', 'Good Afternoon');
    return t('home.goodEvening', 'Good Evening');
  };

  const aiSubtitle = criticalCount > 0 
    ? `${criticalCount} alert${criticalCount > 1 ? 's' : ''} need attention.` 
    : isStable 
      ? 'Your farms are stable today.' 
      : 'AI monitoring active.';

  // Subtle animated glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 4000, useNativeDriver: true })
      ])
    ).start();
  }, [glowAnim]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 90 }}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ['#064E3B40', `${colors.background}00`] : ['#D1FAE580', `${colors.background}00`]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />
      
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=059669&color=fff&bold=true` }} 
                style={styles.avatar} 
              />
            </View>
            <View>
              <Text style={styles.greetingText}>{greeting()},</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>

          <Pressable 
            style={styles.notifBtn} 
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.iconBg}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </View>
            {criticalCount > 0 && (
              <MotiView 
                from={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: 'spring' }}
                style={styles.notifBadge}
              >
                <Text style={styles.notifBadgeText}>{criticalCount}</Text>
              </MotiView>
            )}
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.pill, styles.aiPill]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.aiText} numberOfLines={1}>{aiSubtitle}</Text>
          </View>
          <View style={[styles.pill, styles.weatherPill]}>
            <Ionicons name="partly-sunny" size={14} color={isDark ? '#FCD34D' : '#D97706'} />
            <Text style={styles.weatherText}>{avgTemp > 0 ? `${avgTemp}°C` : '--'}</Text>
          </View>
        </View>
      </View>
    </MotiView>
  );
};

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23, // slightly less than container to fit inside border
  },
  greetingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  notifBtn: {
    position: 'relative',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? `${colors.border}40` : `${colors.border}80`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? `${colors.border}60` : `${colors.border}`,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.card,
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  aiPill: {
    backgroundColor: isDark ? `${colors.primary}15` : '#ECFDF5',
    borderColor: isDark ? `${colors.primary}30` : '#D1FAE5',
    flex: 1,
  },
  weatherPill: {
    backgroundColor: isDark ? '#382F10' : '#FEF3C7',
    borderColor: isDark ? '#78350F' : '#FDE68A',
  },
  aiText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
  weatherText: {
    fontSize: 13,
    fontWeight: '800',
    color: isDark ? '#FCD34D' : '#D97706',
  }
});
