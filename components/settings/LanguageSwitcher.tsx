import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

interface LanguageSwitcherProps {
  currentLanguage?: 'en' | 'hi' | 'kn';
  onSelect?: (lang: 'en' | 'hi' | 'kn') => void;
  onClose?: () => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onSelect,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { preferences, setLanguage } = useUserStore();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ] as const;

  const activeLanguage = currentLanguage || preferences.language;

  const handleLanguageChange = async (languageCode: 'en' | 'hi' | 'kn') => {
    if (onSelect) {
      onSelect(languageCode);
    } else {
      await i18n.changeLanguage(languageCode);
      setLanguage(languageCode);
    }
  };

  const listContent = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('profile.selectLanguage')}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {languages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageOption,
            activeLanguage === language.code && styles.selectedOption,
          ]}
          onPress={() => handleLanguageChange(language.code)}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{language.nativeName}</Text>
            <Text style={styles.languageSubtext}>{language.name}</Text>
          </View>
          {activeLanguage === language.code && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (onClose) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.modalContent}>
            {listContent}
          </View>
        </View>
      </Modal>
    );
  }

  return listContent;
};

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: isDark ? `${colors.primary}20` : colors.successLight,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
